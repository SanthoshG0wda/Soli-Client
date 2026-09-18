'use client';

/**
 * Soli Workspace — state layer.
 *
 * Owns ALL workspace state in one place so canvas components stay thin:
 *   - React Flow nodes/edges (conversation nodes, evidence board, evidence cards)
 *   - conversations (each an independent canvas object)
 *   - fixed-composer state (draft, continue-target, evidence context)
 *   - undo/redo history (canvas snapshots)
 *   - selection helpers
 *
 * Persistence is server-authoritative: PostgreSQL (via /api/v1/workspaces)
 * is the source of truth. The canvas below is hydrated from the backend on
 * open and every structural mutation is persisted through small
 * domain-specific calls (messages immediately, positions debounced).
 * Components consume only this context.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import type {
  ChatCitation,
  ChatMessage,
  Conversation,
  EvidenceData,
  EvidenceKind,
  RelationshipType,
} from '@/lib/workspace/types';
import { RELATIONSHIP_TYPES } from '@/lib/workspace/types';
import { ApiException } from '@/lib/api/client';
import {
  runResearch,
  type PersistedRunMessage,
} from '@/lib/api/research';
import {
  createConversationNode as apiCreateConversation,
  createEvidenceNode as apiCreateEvidence,
  createMessage as apiCreateMessage,
  createWorkspace as apiCreateWorkspace,
  createWorkspaceEdge as apiCreateEdge,
  deleteConversationNode as apiDeleteConversation,
  deleteEvidenceNode as apiDeleteEvidence,
  deleteWorkspaceEdge as apiDeleteEdge,
  getWorkspace as apiGetWorkspace,
  listWorkspaces as apiListWorkspaces,
  updateConversationNode as apiUpdateConversation,
  updateEvidenceNode as apiUpdateEvidence,
  updateWorkspace as apiUpdateWorkspace,
  updateWorkspaceEdge as apiUpdateEdge,
  type ApiChatMessage,
  type ApiConversationNode,
  type ApiEvidenceNode,
  type ApiWorkspaceEdge,
  type WorkspaceDetail,
  type WorkspaceSummary,
} from '@/lib/workspace/api';

/**
 * Map a persisted backend citation to a canvas citation. The backend stores
 * exactly what the research workflow returned inside citation_data.
 */
function toChatCitation(c: {
  id: string;
  document_id?: string | null;
  chunk_id?: string | null;
  citation_label: string;
  citation_data?: Record<string, any> | null;
}): ChatCitation {
  const data = (c.citation_data ?? {}) as Record<string, any>;
  const rawKind = (data.kind as string) ?? '';
  return {
    id: c.id,
    kind: (BACKEND_KINDS.has(rawKind) ? rawKind : data.section ? 'statute' : 'source') as EvidenceKind,
    title: (data.title as string) ?? c.citation_label ?? 'Source',
    reference:
      (data.section as string) ??
      (data.source as string) ??
      c.citation_label ??
      '',
    excerpt: (data.excerpt as string) ?? '',
    documentId: c.document_id ?? (data.document_id as string) ?? undefined,
    chunkId: c.chunk_id ?? (data.chunk_id as string) ?? undefined,
  };
}

function toChatMessage(m: ApiChatMessage): ChatMessage {
  const status: ChatMessage['status'] =
    m.response_type === 'error' ? 'error' : 'complete';
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    status,
    citations: (m.citations ?? []).map(toChatCitation),
    error: status === 'error' ? m.content : undefined,
  };
}

function persistedRunMessageToChat(m: PersistedRunMessage): ChatMessage {
  const status: ChatMessage['status'] =
    m.response_type === 'error' ? 'error' : 'complete';
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    status,
    citations: (m.citations ?? []).map(toChatCitation),
    error: status === 'error' ? m.content : undefined,
  };
}

const BACKEND_KINDS = new Set(['source', 'judgment', 'statute', 'document', 'note']);

function toEvidenceKind(sourceType: string): EvidenceKind {
  return (BACKEND_KINDS.has(sourceType) ? sourceType : 'source') as EvidenceKind;
}


function formatRetrievalError(err: unknown): string {
  if (err instanceof ApiException) {
    if (err.status === 0) return err.message; // connection failure, already friendly
    if (err.status === 401) return 'Your session has expired. Please sign in again.';
    if (err.status === 503)
      return 'The legal knowledge database is unavailable. Please try again shortly.';
    return err.message;
  }
  return 'Something went wrong while researching. Please try again.';
}

export interface ConversationFlowData extends Record<string, unknown> {
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  contextEvidenceId?: string;
}
export type ConversationFlowNode = Node<ConversationFlowData, 'conversation'>;
export type BoardPanelNode = Node<{ childCount: number }, 'boardPanel'>;
export interface EvidenceFlowData extends Record<string, unknown> {
  kind: EvidenceKind;
  title: string;
  excerpt: string;
  reference: string;
  citation?: string;
  /** Knowledge-DB document id for real citations (enables scoped retrieval). */
  documentId?: string;
  /** Knowledge-DB chunk id for real citations (exact source traceability). */
  chunkId?: string;
}
export type EvidenceFlowNode = Node<EvidenceFlowData, 'evidence'>;
export type WorkspaceFlowNode = ConversationFlowNode | BoardPanelNode | EvidenceFlowNode;

export const BOARD_NODE_ID = 'board';

const BOARD_DEFAULT_POSITION = { x: 800, y: 32 };
const BOARD_DEFAULT_SIZE = { width: 680, height: 560 };
const EVIDENCE_CARD_WIDTH = 288;
const CONVERSATION_CARD_WIDTH = 320;

const KIND_DEFAULTS: Record<EvidenceKind, { title: string; excerpt: string; reference: string }> = {
  source: { title: 'Untitled source', excerpt: 'Paste the source excerpt here…', reference: 'Add reference' },
  judgment: { title: 'Untitled judgment', excerpt: 'Holding / ratio summary…', reference: 'Court · citation pending' },
  statute: { title: 'Untitled provision', excerpt: 'Provision text or summary…', reference: 'Act · section pending' },
  document: { title: 'Untitled document', excerpt: 'Key excerpt from the document…', reference: 'File / matter' },
  note: { title: 'Untitled note', excerpt: 'Write your research note…', reference: 'Workspace note' },
};

function initialNodes(): WorkspaceFlowNode[] {
  return [];
}

function initialEdges(): Edge[] {
  return [];
}

interface CanvasSnapshot {
  nodes: WorkspaceFlowNode[];
  edges: Edge[];
}

interface WorkspaceContextValue {
  nodes: WorkspaceFlowNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<WorkspaceFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
  onConnect: (connection: Connection) => void;
  cycleEdgeLabel: (edgeId: string) => void;
  /** Stash canvas state before a drag so drop can push one history entry. */
  beginDrag: () => void;
  endDrag: () => void;

  conversations: Conversation[];
  evidence: EvidenceData[];
  workspaceName: string;
  setWorkspaceName: (name: string) => void;

  /** Server-backed workspace identity + hydration. */
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  workspaceLoading: boolean;
  workspaceReady: boolean;
  syncState: 'idle' | 'loading' | 'saving' | 'error';
  syncError: string | null;
  ensureWorkspace: (preferredId?: string | null) => Promise<string | null>;
  selectWorkspace: (id: string) => Promise<void>;
  createNewWorkspace: (title?: string) => Promise<string | null>;
  hydrateWorkspace: (id: string) => Promise<void>;

  /** Fixed viewport composer state. */
  composerDraft: string;
  setComposerDraft: (draft: string) => void;
  composerBusy: boolean;
  composerFocusKey: number;
  sendComposer: (prompt: string) => void;

  /** Continue-conversation targeting. */
  continuedConversationId: string | null;
  continueConversation: (conversationId: string) => void;
  stopContinuing: () => void;

  /** Evidence-scoped questioning ("Ask Soli about this"). */
  evidenceContextId: string | null;
  askAboutEvidence: (evidenceId: string) => void;
  clearEvidenceContext: () => void;

  /** Focused full-conversation view (viewport drawer, stays on /workspace). */
  openConversationId: string | null;
  openConversation: (id: string) => void;
  closeConversationDetail: () => void;

  selectedEvidenceId: string | null;
  setSelectedEvidenceId: (id: string | null) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  deselectAll: () => void;

  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  addEvidence: (kind: EvidenceKind) => void;
  addCitationToBoard: (citation: ChatCitation, sourceConversationId?: string) => void;
  addAllSourcesToBoard: (conversationId: string) => void;
  duplicateEvidence: (id: string) => void;
  updateEvidence: (id: string, patch: { title?: string; excerpt?: string; reference?: string }) => void;
  deleteEvidence: (id: string) => void;
  deleteEvidenceMany: (ids: string[]) => void;
  deleteConversation: (id: string) => void;
  duplicateConversation: (id: string) => void;
  /** Debounced canvas-position persistence (call on drag stop). */
  persistPositions: (ids: string[]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/** Next free slot inside the board (2-column grid below the board header). */
function nextBoardSlot(count: number): { x: number; y: number } {
  const col = count % 2;
  const row = Math.floor(count / 2);
  return { x: 36 + col * (EVIDENCE_CARD_WIDTH + 24), y: 36 + row * 240 };
}

/**
 * Automatic initial placement for conversation nodes: 2-column cascade to
 * the left of the Evidence Board so new nodes never stack on each other.
 */
function nextConversationSlot(count: number): { x: number; y: number } {
  const col = count % 2;
  const row = Math.floor(count / 2);
  return { x: 40 + col * (CONVERSATION_CARD_WIDTH + 32), y: 56 + row * 400 };
}

function titleFromPrompt(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || 'Untitled research';
}

/** Backend UUIDs never carry these prefixes — temp optimistic ids do. */
function isTempId(id: string): boolean {
  return /^(conv|ev|edge|msg)-/.test(id);
}

export function WorkspaceProvider({
  children,
  initialWorkspaceId,
}: {
  children: React.ReactNode;
  initialWorkspaceId?: string;
}) {
  const [nodes, setNodes] = useState<WorkspaceFlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [composerDraft, setComposerDraft] = useState('');
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [continuedConversationId, setContinuedConversationId] = useState<string | null>(null);
  const [evidenceContextId, setEvidenceContextId] = useState<string | null>(null);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceNameState] = useState('Untitled Research');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  /** Server-backed workspace state (PostgreSQL is the source of truth). */
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const reportSyncError = useCallback((err: unknown, fallback: string) => {
    const message =
      err instanceof ApiException && err.message ? err.message : fallback;
    setSyncState('error');
    setSyncError(message);
  }, []);
  const activeWorkspaceRef = useRef<string | null>(null);
  const ensuringRef = useRef<Promise<string | null> | null>(null);
  const hydratingRef = useRef(false);
  const positionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerBusyRef = useRef(false);

  useEffect(() => {
    activeWorkspaceRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  const [past, setPast] = useState<CanvasSnapshot[]>([]);
  const [future, setFuture] = useState<CanvasSnapshot[]>([]);
  const dragStartRef = useRef<CanvasSnapshot | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  });

  const pushHistory = useCallback((snapshot: CanvasSnapshot) => {
    setPast((p) => [...p.slice(-59), snapshot]);
    setFuture([]);
  }, []);

  const snapshotCurrent = useCallback((): CanvasSnapshot => {
    return { nodes: nodesRef.current, edges: edgesRef.current };
  }, []);

  const onNodesChange = useCallback((changes: NodeChange<WorkspaceFlowNode>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const removedIds = changes
        .filter((c) => c.type === 'remove')
        .map((c) => c.id)
        .filter((id) => !isTempId(id));
      const wsId = activeWorkspaceRef.current;
      if (wsId && removedIds.length > 0) {
        Promise.all(removedIds.map((id) => apiDeleteEdge(wsId, id))).catch((err: unknown) =>
          reportSyncError(err, 'Could not delete relationship on the server.'),
        );
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [reportSyncError],
  );

  const endpointTypeOf = (nodeId: string): 'conversation' | 'evidence' | null => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node?.type === 'conversation') return 'conversation';
    if (node?.type === 'evidence') return 'evidence';
    return null;
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const wsId = activeWorkspaceRef.current;
      const sourceType = endpointTypeOf(connection.source);
      const targetType = endpointTypeOf(connection.target);
      if (!wsId || !sourceType || !targetType) {
        // Board shell or unsynced canvas: local-only edge.
        const edge: Edge = {
          id: nextId('edge'),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          label: 'related to',
          markerEnd: { type: 'arrowclosed' as const },
        };
        pushHistory(snapshotCurrent());
        setEdges((eds) => [...eds, edge]);
        return;
      }
      setSyncState('saving');
      apiCreateEdge(wsId, {
        source_type: sourceType,
        source_id: connection.source,
        target_type: targetType,
        target_id: connection.target,
        relationship: 'related to',
      }).then(
        (created) => {
          pushHistory(snapshotCurrent());
          const edge: Edge = {
            id: created.id,
            source: created.source_id,
            target: created.target_id,
            label: created.relationship as RelationshipType,
            markerEnd: { type: 'arrowclosed' as const },
          };
          setEdges((eds) => [...eds, edge]);
          setSyncState((s) => (s === 'saving' ? 'idle' : s));
        },
        (err: unknown) => reportSyncError(err, 'Could not save relationship.'),
      );
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  /** Double-click an edge to cycle its relationship type (persisted). */
  const cycleEdgeLabel = useCallback(
    (edgeId: string) => {
      const wsId = activeWorkspaceRef.current;
      const current = edgesRef.current.find((e) => e.id === edgeId);
      const currentLabel = typeof current?.label === 'string' ? current.label : '';
      const idx = RELATIONSHIP_TYPES.indexOf(currentLabel as RelationshipType);
      const next: RelationshipType = RELATIONSHIP_TYPES[(idx + 1) % RELATIONSHIP_TYPES.length];
      pushHistory(snapshotCurrent());
      setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label: next } : e)));
      if (wsId && !isTempId(edgeId)) {
        apiUpdateEdge(wsId, edgeId, next).catch((err: unknown) =>
          reportSyncError(err, 'Could not save relationship label.'),
        );
      }
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  const beginDrag = useCallback(() => {
    dragStartRef.current = snapshotCurrent();
  }, [snapshotCurrent]);

  const endDrag = useCallback(() => {
    if (dragStartRef.current) {
      pushHistory(dragStartRef.current);
      dragStartRef.current = null;
    }
  }, [pushHistory]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [...f, snapshotCurrent()]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return p.slice(0, -1);
    });
  }, [snapshotCurrent]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setPast((p) => [...p.slice(-59), snapshotCurrent()]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(0, -1);
    });
  }, [snapshotCurrent]);

  const deselectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setSelectedEvidenceId(null);
    setSelectedConversationId(null);
  }, []);

  /** Replace canvas state with the server's authoritative workspace. */
  const hydrateWorkspace = useCallback(
    async (id: string) => {
      hydratingRef.current = true;
      setWorkspaceLoading(true);
      setSyncState('loading');
      setSyncError(null);
      try {
        const detail: WorkspaceDetail = await apiGetWorkspace(id);
        const byConversation = new Map<string, ApiChatMessage[]>();
        for (const m of detail.messages) {
          const list = byConversation.get(m.conversation_node_id) ?? [];
          list.push(m);
          byConversation.set(m.conversation_node_id, list);
        }
        const convNodes: ConversationFlowNode[] = detail.conversation_nodes.map(
          (n: ApiConversationNode) =>
            ({
              id: n.id,
              type: 'conversation',
              position: { x: n.position_x, y: n.position_y },
              data: {
                title: n.title,
                messages: (byConversation.get(n.id) ?? [])
                  .sort((a, b) => a.sequence_number - b.sequence_number)
                  .map(toChatMessage),
                createdAt: Date.parse(n.created_at),
                updatedAt: Date.parse(n.updated_at),
              },
              style: { width: CONVERSATION_CARD_WIDTH },
            }) as ConversationFlowNode,
        );
        const evNodes: EvidenceFlowNode[] = detail.evidence_nodes.map(
          (n: ApiEvidenceNode) =>
            ({
              id: n.id,
              type: 'evidence',
              position: { x: n.position_x, y: n.position_y },
              data: {
                kind: toEvidenceKind(n.source_type),
                title: n.title,
                excerpt: n.excerpt ?? '',
                reference: n.citation_label ?? '',
                citation: n.citation_label ?? undefined,
                documentId: n.document_id ?? undefined,
                chunkId: n.chunk_id ?? undefined,
              },
              style: { width: EVIDENCE_CARD_WIDTH },
            }) as EvidenceFlowNode,
        );
        const flowEdges: Edge[] = detail.edges.map((e) => ({
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          label: e.relationship,
          markerEnd: { type: 'arrowclosed' as const },
        }));
        setNodes([...convNodes, ...evNodes]);
        setEdges(flowEdges);
        setPast([]);
        setFuture([]);
        setWorkspaceNameState(detail.title);
        setSelectedEvidenceId(null);
        setSelectedConversationId(null);
        setContinuedConversationId(null);
        setOpenConversationId(null);
        setActiveWorkspaceId(id);
        setSyncState('idle');
      } catch (err) {
        reportSyncError(err, 'Could not load workspace from the server.');
        throw err;
      } finally {
        setWorkspaceLoading(false);
        hydratingRef.current = false;
      }
    },
    [reportSyncError],
  );

  /** Guarantee a hydrated workspace; returns its id (or null on failure). */
  const ensureWorkspace = useCallback(
    async (preferredId?: string | null): Promise<string | null> => {
      if (preferredId && activeWorkspaceRef.current === preferredId) {
        return activeWorkspaceRef.current;
      }
      if (!preferredId && activeWorkspaceRef.current) {
        return activeWorkspaceRef.current;
      }
      if (ensuringRef.current) return ensuringRef.current;
      ensuringRef.current = (async () => {
        try {
          if (preferredId) {
            try {
              await hydrateWorkspace(preferredId);
              const list = await apiListWorkspaces();
              setWorkspaces(list);
              return preferredId;
            } catch (err) {
              console.warn('Could not hydrate preferred workspace, falling back to list', err);
            }
          }
          const list = await apiListWorkspaces();
          setWorkspaces(list);
          const target = list[0]?.id ?? null;
          if (!target) {
            const created = await apiCreateWorkspace('Untitled Research');
            setWorkspaces([created]);
            await hydrateWorkspace(created.id);
            return created.id;
          }
          await hydrateWorkspace(target);
          return target;
        } catch {
          return null;
        } finally {
          ensuringRef.current = null;
        }
      })();
      return ensuringRef.current;
    },
    [hydrateWorkspace],
  );

  useEffect(() => {
    void ensureWorkspace(initialWorkspaceId);
  }, [ensureWorkspace, initialWorkspaceId]);

  const selectWorkspace = useCallback(
    async (id: string) => {
      if (id === activeWorkspaceRef.current || hydratingRef.current) return;
      await hydrateWorkspace(id);
    },
    [hydrateWorkspace],
  );

  const createNewWorkspace = useCallback(
    async (title?: string): Promise<string | null> => {
      try {
        const created = await apiCreateWorkspace(title ?? 'Untitled Research');
        setWorkspaces((list) => [created, ...list]);
        await hydrateWorkspace(created.id);
        return created.id;
      } catch (err) {
        reportSyncError(err, 'Could not create workspace.');
        return null;
      }
    },
    [hydrateWorkspace, reportSyncError],
  );

  /** Rename with debounced server persistence (skipped while hydrating). */
  const setWorkspaceName = useCallback(
    (name: string) => {
      setWorkspaceNameState(name);
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
      nameTimerRef.current = setTimeout(() => {
        const wsId = activeWorkspaceRef.current;
        if (!wsId || hydratingRef.current || !name.trim()) return;
        setSyncState('saving');
        apiUpdateWorkspace(wsId, { title: name.trim() }).then(
          (updated) => {
            setWorkspaces((list) =>
              list.map((w) => (w.id === wsId ? updated : w)),
            );
            setSyncState((s) => (s === 'saving' ? 'idle' : s));
          },
          (err: unknown) => reportSyncError(err, 'Could not rename workspace.'),
        );
      }, 800);
    },
    [reportSyncError],
  );

  /** Debounced canvas-position persistence (call on drag stop). */
  const persistPositions = useCallback(
    (ids: string[]) => {
      if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
      positionTimerRef.current = setTimeout(() => {
        const wsId = activeWorkspaceRef.current;
        if (!wsId) return;
        const targets = nodesRef.current.filter(
          (n) =>
            ids.includes(n.id) &&
            (n.type === 'conversation' || n.type === 'evidence') &&
            !isTempId(n.id),
        );
        if (targets.length === 0) return;
        setSyncState('saving');
        Promise.all(
          targets.map((n) =>
            n.type === 'conversation'
              ? apiUpdateConversation(wsId, n.id, {
                  position_x: n.position.x,
                  position_y: n.position.y,
                })
              : apiUpdateEvidence(wsId, n.id, {
                  position_x: n.position.x,
                  position_y: n.position.y,
                }),
          ),
        ).then(
          () => setSyncState((s) => (s === 'saving' ? 'idle' : s)),
          () =>
            reportSyncError(
              new Error('positions'),
              'Could not save canvas positions. They will retry on next drag.',
            ),
        );
      }, 500);
    },
    [reportSyncError],
  );

  const evidenceChildCount = useCallback(() => {
    return nodesRef.current.filter((n) => n.type === 'evidence').length;
  }, []);

  const conversationCount = useCallback(() => {
    return nodesRef.current.filter((n) => n.type === 'conversation').length;
  }, []);

  interface NewEvidenceInput {
    kind: EvidenceKind;
    title: string;
    excerpt: string;
    reference: string;
    citation?: string;
    documentId?: string;
    chunkId?: string;
    citationData?: Record<string, any>;
  }

  const insertEvidenceNode = useCallback(
    async (
      input: NewEvidenceInput,
      link?: {
        sourceId: string;
        sourceType: 'conversation' | 'evidence';
        label: RelationshipType;
      },
    ): Promise<string | null> => {
      const wsId = activeWorkspaceRef.current;
      if (!wsId) {
        reportSyncError(new Error('no workspace'), 'Open a workspace before adding evidence.');
        return null;
      }
      const slot = nextBoardSlot(evidenceChildCount());
      setSyncState('saving');
      try {
        const created = await apiCreateEvidence(wsId, {
          title: input.title,
          source_type: input.kind,
          excerpt: input.excerpt,
          document_id: input.documentId,
          chunk_id: input.chunkId,
          citation_label: input.citation ?? input.reference,
          citation_data: input.citationData ?? {
            title: input.title,
            reference: input.reference,
            excerpt: input.excerpt,
          },
          position_x: slot.x,
          position_y: slot.y,
        });
        let createdEdgeId: string | null = null;
        if (link && !isTempId(link.sourceId)) {
          const createdEdge = await apiCreateEdge(wsId, {
            source_type: link.sourceType,
            source_id: link.sourceId,
            target_type: 'evidence',
            target_id: created.id,
            relationship: link.label,
          });
          createdEdgeId = createdEdge.id;
        }
        pushHistory(snapshotCurrent());
        const node: EvidenceFlowNode = {
          id: created.id,
          type: 'evidence',
          position: { x: created.position_x, y: created.position_y },
          data: {
            kind: input.kind,
            title: created.title,
            excerpt: created.excerpt ?? input.excerpt,
            reference: created.citation_label ?? input.reference,
            citation: created.citation_label ?? undefined,
            documentId: created.document_id ?? undefined,
            chunkId: created.chunk_id ?? undefined,
          },
          style: { width: EVIDENCE_CARD_WIDTH },
        } as EvidenceFlowNode;
        setNodes((nds) => [...nds, node]);
        if (link && createdEdgeId) {
          const edge: Edge = {
            id: createdEdgeId,
            source: link.sourceId,
            target: node.id,
            label: link.label,
            markerEnd: { type: 'arrowclosed' as const },
          };
          setEdges((eds) => [...eds, edge]);
        }
        setSelectedEvidenceId(node.id);
        setSyncState((s) => (s === 'saving' ? 'idle' : s));
        return node.id;
      } catch (err) {
        reportSyncError(err, 'Could not save evidence to the server.');
        return null;
      }
    },
    [evidenceChildCount, pushHistory, reportSyncError, snapshotCurrent],
  );

  const addEvidence = useCallback(
    (kind: EvidenceKind) => {
      const defaults = KIND_DEFAULTS[kind];
      void insertEvidenceNode({ kind, ...defaults });
    },
    [insertEvidenceNode],
  );

  const addCitationToBoard = useCallback(
    (citation: ChatCitation, sourceConversationId?: string) => {
      void insertEvidenceNode(
        {
          kind: citation.kind,
          title: citation.title,
          excerpt: citation.excerpt,
          reference: citation.reference,
          documentId: citation.documentId,
          chunkId: citation.chunkId,
          citationData: {
            title: citation.title,
            reference: citation.reference,
            excerpt: citation.excerpt,
          },
        },
        sourceConversationId && !isTempId(sourceConversationId)
          ? { sourceId: sourceConversationId, sourceType: 'conversation', label: 'references' }
          : undefined,
      );
    },
    [insertEvidenceNode],
  );

  const addAllSourcesToBoard = useCallback(
    (conversationId: string) => {
      const node = nodesRef.current.find(
        (n): n is ConversationFlowNode => n.type === 'conversation' && n.id === conversationId,
      );
      if (!node) return;
      const citations = node.data.messages.flatMap((m) => m.citations ?? []);
      if (citations.length === 0) return;
      const wsId = activeWorkspaceRef.current;
      if (!wsId || isTempId(conversationId)) {
        reportSyncError(new Error('unsynced'), 'Wait for this conversation to sync before adding sources.');
        return;
      }
      void (async () => {
        setSyncState('saving');
        try {
          const startCount = evidenceChildCount();
          const created = await Promise.all(
            citations.map((citation, i) => {
              const slot = nextBoardSlot(startCount + i);
              return apiCreateEvidence(wsId, {
                title: citation.title,
                source_type: citation.kind,
                excerpt: citation.excerpt,
                document_id: citation.documentId,
                chunk_id: citation.chunkId,
                citation_label: citation.reference,
                citation_data: {
                  title: citation.title,
                  reference: citation.reference,
                  excerpt: citation.excerpt,
                },
                position_x: slot.x,
                position_y: slot.y,
              });
            }),
          );
          const createdEdges = await Promise.all(
            created.map((ev) =>
              apiCreateEdge(wsId, {
                source_type: 'conversation',
                source_id: conversationId,
                target_type: 'evidence',
                target_id: ev.id,
                relationship: 'references',
              }),
            ),
          );
          pushHistory(snapshotCurrent());
          const newNodes: EvidenceFlowNode[] = created.map(
            (ev) =>
              ({
                id: ev.id,
                type: 'evidence',
                position: { x: ev.position_x, y: ev.position_y },
                data: {
                  kind: toEvidenceKind(ev.source_type),
                  title: ev.title,
                  excerpt: ev.excerpt ?? '',
                  reference: ev.citation_label ?? '',
                  citation: ev.citation_label ?? undefined,
                  documentId: ev.document_id ?? undefined,
                  chunkId: ev.chunk_id ?? undefined,
                },
                style: { width: EVIDENCE_CARD_WIDTH },
              }) as EvidenceFlowNode,
          );
          const newEdges: Edge[] = createdEdges.map((e) => ({
            id: e.id,
            source: e.source_id,
            target: e.target_id,
            label: e.relationship as RelationshipType,
            markerEnd: { type: 'arrowclosed' as const },
          }));
          setNodes((nds) => [...nds, ...newNodes]);
          setEdges((eds) => [...eds, ...newEdges]);
          setSyncState((s) => (s === 'saving' ? 'idle' : s));
        } catch (err) {
          reportSyncError(err, 'Could not save evidence to the server.');
        }
      })();
    },
    [evidenceChildCount, pushHistory, reportSyncError, snapshotCurrent],
  );

  const duplicateEvidence = useCallback(
    (id: string) => {
      const original = nodesRef.current.find((n) => n.id === id && n.type === 'evidence') as
        | EvidenceFlowNode
        | undefined;
      if (!original || isTempId(id)) return;
      const wsId = activeWorkspaceRef.current;
      if (!wsId) return;
      void (async () => {
        setSyncState('saving');
        try {
          const created = await apiCreateEvidence(wsId, {
            title: `${original.data.title} (copy)`,
            source_type: original.data.kind,
            excerpt: original.data.excerpt,
            document_id: original.data.documentId,
            chunk_id: original.data.chunkId,
            citation_label: original.data.citation ?? original.data.reference,
            position_x: original.position.x + 24,
            position_y: original.position.y + 24,
          });
          pushHistory(snapshotCurrent());
          const copy: EvidenceFlowNode = {
            id: created.id,
            type: 'evidence',
            position: { x: created.position_x, y: created.position_y },
            data: {
              kind: toEvidenceKind(created.source_type),
              title: created.title,
              excerpt: created.excerpt ?? '',
              reference: created.citation_label ?? '',
              citation: created.citation_label ?? undefined,
              documentId: created.document_id ?? undefined,
              chunkId: created.chunk_id ?? undefined,
            },
            style: { width: EVIDENCE_CARD_WIDTH },
            selected: true,
          } as EvidenceFlowNode;
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, selected: false } : n)).concat(copy),
          );
          setSelectedEvidenceId(copy.id);
          setSyncState((s) => (s === 'saving' ? 'idle' : s));
        } catch (err) {
          reportSyncError(err, 'Could not duplicate evidence.');
        }
      })();
    },
    [evidenceChildCount, pushHistory, reportSyncError, snapshotCurrent],
  );

  const deleteEvidenceMany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const wsId = activeWorkspaceRef.current;
      const persisted = ids.filter((id) => !isTempId(id));
      void (async () => {
        try {
          if (wsId && persisted.length > 0) {
            setSyncState('saving');
            await Promise.all(persisted.map((id) => apiDeleteEvidence(wsId, id)));
            setSyncState((s) => (s === 'saving' ? 'idle' : s));
          }
          pushHistory(snapshotCurrent());
          const idSet = new Set(ids);
          setNodes((nds) => nds.filter((n) => !idSet.has(n.id)));
          setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
          setSelectedEvidenceId((sel) => (sel && idSet.has(sel) ? null : sel));
        } catch (err) {
          reportSyncError(err, 'Could not delete evidence on the server.');
        }
      })();
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  const updateEvidence = useCallback(
    (id: string, patch: { title?: string; excerpt?: string; reference?: string }) => {
      const wsId = activeWorkspaceRef.current;
      if (!wsId || isTempId(id)) return;
      pushHistory(snapshotCurrent());
      setSyncState('saving');
      // Optimistically update local state immediately
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id || n.type !== 'evidence') return n;
          const data = { ...n.data };
          if (patch.title !== undefined) data.title = patch.title;
          if (patch.excerpt !== undefined) data.excerpt = patch.excerpt;
          if (patch.reference !== undefined) {
            data.reference = patch.reference;
            data.citation = patch.reference;
          }
          return { ...n, data };
        }),
      );
      // Persist to server
      apiUpdateEvidence(wsId, id, {
        title: patch.title,
        excerpt: patch.excerpt,
        citation_label: patch.reference,
        citation_data:
          patch.title !== undefined || patch.excerpt !== undefined || patch.reference !== undefined
            ? {
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.reference !== undefined ? { reference: patch.reference } : {}),
                ...(patch.excerpt !== undefined ? { excerpt: patch.excerpt } : {}),
              }
            : undefined,
      })
        .then(() => setSyncState((s) => (s === 'saving' ? 'idle' : s)))
        .catch((err: unknown) => reportSyncError(err, 'Could not save evidence changes.'));
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  const deleteEvidence = useCallback(
    (id: string) => {
      deleteEvidenceMany([id]);
    },
    [deleteEvidenceMany],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const wsId = activeWorkspaceRef.current;
      void (async () => {
        try {
          if (wsId && !isTempId(id)) {
            setSyncState('saving');
            await apiDeleteConversation(wsId, id);
            setSyncState((s) => (s === 'saving' ? 'idle' : s));
          }
          pushHistory(snapshotCurrent());
          setNodes((nds) => nds.filter((n) => n.id !== id));
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
          setSelectedConversationId((sel) => (sel === id ? null : sel));
          setContinuedConversationId((c) => (c === id ? null : c));
          setOpenConversationId((o) => (o === id ? null : o));
        } catch (err) {
          reportSyncError(err, 'Could not delete conversation on the server.');
        }
      })();
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  const duplicateConversation = useCallback(
    (id: string) => {
      const original = nodesRef.current.find(
        (n): n is ConversationFlowNode => n.type === 'conversation' && n.id === id,
      );
      if (!original || isTempId(id)) return;
      const wsId = activeWorkspaceRef.current;
      if (!wsId) return;
      void (async () => {
        setSyncState('saving');
        try {
          const created = await apiCreateConversation(wsId, {
            title: `${original.data.title} (copy)`,
            position_x: original.position.x + 32,
            position_y: original.position.y + 32,
          });
          const copiedMessages: ChatMessage[] = [];
          for (const m of original.data.messages) {
            if (m.status !== 'complete') continue;
            const saved = await apiCreateMessage(wsId, created.id, {
              role: m.role as 'user' | 'assistant',
              content: m.content,
            citations: (m.citations ?? []).map((c) => ({
              document_id: c.documentId,
              citation_label: c.reference,
              citation_data: { kind: c.kind, title: c.title, reference: c.reference, excerpt: c.excerpt },
            })),
            });
            copiedMessages.push({
              id: saved.id,
              role: saved.role as 'user' | 'assistant',
              content: saved.content,
              status: 'complete',
              citations: (saved.citations ?? []).map(toChatCitation),
            });
          }
          pushHistory(snapshotCurrent());
          const copy: ConversationFlowNode = {
            id: created.id,
            type: 'conversation',
            position: { x: created.position_x, y: created.position_y },
            data: {
              title: created.title,
              messages: copiedMessages,
              createdAt: Date.parse(created.created_at),
              updatedAt: Date.parse(created.updated_at),
            },
            style: { width: CONVERSATION_CARD_WIDTH },
            selected: true,
          } as ConversationFlowNode;
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, selected: false } : n)).concat(copy),
          );
          setSelectedConversationId(copy.id);
          setSyncState((s) => (s === 'saving' ? 'idle' : s));
        } catch (err) {
          reportSyncError(err, 'Could not duplicate conversation.');
        }
      })();
    },
    [pushHistory, reportSyncError, snapshotCurrent],
  );

  const continueConversation = useCallback((conversationId: string) => {
    setContinuedConversationId(conversationId);
    setComposerFocusKey((k) => k + 1);
  }, []);

  const stopContinuing = useCallback(() => {
    setContinuedConversationId(null);
  }, []);

  const openConversation = useCallback((id: string) => {
    setOpenConversationId(id);
  }, []);

  const closeConversationDetail = useCallback(() => {
    setOpenConversationId(null);
  }, []);

  const askAboutEvidence = useCallback((evidenceId: string) => {
    setEvidenceContextId(evidenceId);
    setContinuedConversationId(null);
    setComposerFocusKey((k) => k + 1);
  }, []);

  const clearEvidenceContext = useCallback(() => {
    setEvidenceContextId(null);
  }, []);

  /**
   * Composer submit.
   * - Continue mode (a conversation is targeted): append the exchange there.
   * - Otherwise: create a NEW conversation node (cascade placement).
   * Answers come live from POST /api/v1/research/retrieve (ranked corpus
   * sources). Generated prose answers are not built yet, so the assistant
   * message is an honest retrieval summary with real citations.
   */
  const sendComposer = useCallback(
    (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || composerBusyRef.current) return;
      composerBusyRef.current = true;

      void (async () => {
        setComposerDraft('');
        setComposerBusy(true);
        setSyncError(null);

        // The server owns workspace identity; create/open on first send.
        const wsId = await ensureWorkspace();
        if (!wsId) {
          composerBusyRef.current = false;
          setComposerBusy(false);
          reportSyncError(new Error('no workspace'), 'Could not open a workspace. Please try again.');
          return;
        }

        const contextNode = evidenceContextId
          ? (nodesRef.current.find((n) => n.id === evidenceContextId) as EvidenceFlowNode | undefined)
          : undefined;
        const continueId =
          continuedConversationId && !isTempId(continuedConversationId)
            ? continuedConversationId
            : null;
        const continueNode = continueId
          ? nodesRef.current.find(
              (n): n is ConversationFlowNode => n.type === 'conversation' && n.id === continueId,
            )
          : undefined;

        const scopedDocumentId = contextNode?.data.documentId;
        const filters = scopedDocumentId ? { document_ids: [scopedDocumentId] } : {};
        const userMsg: ChatMessage = { id: nextId('msg'), role: 'user', content: prompt, status: 'complete' };
        const streamingMsg: ChatMessage = { id: nextId('msg'), role: 'assistant', content: '', status: 'streaming' };

        let optimisticId: string;
        let slot = { x: 0, y: 0 };
        if (continueNode) {
          optimisticId = continueNode.id;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === optimisticId && n.type === 'conversation'
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      messages: [...n.data.messages, userMsg, streamingMsg],
                      updatedAt: Date.now(),
                    },
                  }
                : n,
            ),
          );
        } else {
          slot = nextConversationSlot(conversationCount());
          const now = Date.now();
          optimisticId = nextId('conv');
          const tempNode = {
            id: optimisticId,
            type: 'conversation',
            position: slot,
            data: {
              title: titleFromPrompt(prompt),
              messages: [userMsg, streamingMsg],
              createdAt: now,
              updatedAt: now,
              contextEvidenceId: evidenceContextId ?? undefined,
            },
            style: { width: CONVERSATION_CARD_WIDTH },
          } as ConversationFlowNode;
          setNodes((nds) => [...nds, tempNode]);
          setSelectedConversationId(optimisticId);
        }

        try {
          const res = await runResearch({
            query: prompt,
            workspace_id: wsId,
            conversation_node_id: continueNode ? continueNode.id : null,
            node_title: continueNode ? undefined : titleFromPrompt(prompt),
            position_x: continueNode ? undefined : slot.x,
            position_y: continueNode ? undefined : slot.y,
            client_request_id:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : undefined,
            top_k: 5,
            filters,
            workspace_context: {
              selected_node_id: continueNode ? continueNode.id : optimisticId,
              filters,
            },
          });
          // Server is authoritative: swap the optimistic node for persisted truth.
          const realId = res.conversation_node_id ?? optimisticId;
          const serverMessages = (res.messages ?? []).map(persistedRunMessageToChat);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === optimisticId && n.type === 'conversation'
                ? {
                    ...n,
                    id: realId,
                    data: {
                      ...n.data,
                      title: res.node?.title ?? n.data.title,
                      messages: serverMessages,
                      updatedAt: Date.now(),
                    },
                  }
                : n,
            ),
          );
          if (!continueNode && evidenceContextId && !isTempId(evidenceContextId)) {
            try {
              const createdEdge = await apiCreateEdge(wsId, {
                source_type: 'evidence',
                source_id: evidenceContextId,
                target_type: 'conversation',
                target_id: realId,
                relationship: 'derived from',
              });
              setEdges((eds) => [
                ...eds,
                {
                  id: createdEdge.id,
                  source: evidenceContextId as string,
                  target: realId,
                  label: 'derived from',
                  markerEnd: { type: 'arrowclosed' as const },
                },
              ]);
            } catch (edgeErr) {
              reportSyncError(edgeErr, 'Answer saved, but the evidence link was not.');
            }
          }
          setSelectedConversationId(realId);
          setEvidenceContextId(null);
          setPast([]);
          setFuture([]);
          setSyncState('idle');
        } catch (err) {
          // The backend persisted the question (and an error record) before
          // failing — reconcile from the server, then surface what happened.
          try {
            await hydrateWorkspace(wsId);
          } catch {
            /* hydrateWorkspace already reported its own failure */
          }
          setSyncState('error');
          setSyncError(formatRetrievalError(err));
        } finally {
          composerBusyRef.current = false;
          setComposerBusy(false);
        }
      })();
    },
    [
      continuedConversationId,
      conversationCount,
      ensureWorkspace,
      evidenceContextId,
      hydrateWorkspace,
      reportSyncError,
    ],
  );

  const conversations: Conversation[] = useMemo(
    () =>
      nodes
        .filter((n): n is ConversationFlowNode => n.type === 'conversation')
        .map((n) => ({
          id: n.id,
          title: n.data.title,
          messages: n.data.messages,
          position: n.position,
          selected: Boolean(n.selected),
          createdAt: n.data.createdAt,
          updatedAt: n.data.updatedAt,
          contextEvidenceId: n.data.contextEvidenceId,
        })),
    [nodes],
  );

  const evidence: EvidenceData[] = useMemo(
    () =>
      nodes
        .filter((n): n is EvidenceFlowNode => n.type === 'evidence')
        .map((n) => ({
          id: n.id,
          type: 'evidence' as const,
          position: n.position,
          selected: Boolean(n.selected),
          parentId: n.parentId,
          kind: n.data.kind,
          title: n.data.title,
          excerpt: n.data.excerpt,
          reference: n.data.reference,
          citation: n.data.citation,
          documentId: n.data.documentId,
          chunkId: n.data.chunkId,
        })),
    [nodes],
  );

  const value: WorkspaceContextValue = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    cycleEdgeLabel,
    beginDrag,
    endDrag,
    conversations,
    evidence,
    workspaceName,
    setWorkspaceName,
    workspaces,
    activeWorkspaceId,
    workspaceLoading,
    workspaceReady: activeWorkspaceId !== null && !workspaceLoading,
    syncState,
    syncError,
    ensureWorkspace,
    selectWorkspace,
    createNewWorkspace,
    hydrateWorkspace,
    composerDraft,
    setComposerDraft,
    composerBusy,
    composerFocusKey,
    sendComposer,
    continuedConversationId,
    continueConversation,
    stopContinuing,
    evidenceContextId,
    askAboutEvidence,
    clearEvidenceContext,
    openConversationId,
    openConversation,
    closeConversationDetail,
    selectedEvidenceId,
    setSelectedEvidenceId,
    selectedConversationId,
    setSelectedConversationId,
    deselectAll,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    addEvidence,
    addCitationToBoard,
    addAllSourcesToBoard,
    duplicateEvidence,
    updateEvidence,
    deleteEvidence,
    deleteEvidenceMany,
    deleteConversation,
    duplicateConversation,
    persistPositions,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}

export function useOptionalWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext) ?? null;
}
