/**
 * Soli Workspace — domain types.
 *
 * This module is the single source of truth for the workspace object model.
 * Every visible object on the canvas (chat panel, evidence board, evidence
 * cards, notes, documents) shares the base `WorkspaceObject` shape so that
 * layout persistence can be added later without refactoring components.
 *
 * Future backend mapping (not yet implemented — see `workspace-api.ts`):
 *   POST /workspaces        -> create workspace
 *   GET  /workspaces/:id    -> load workspace (objects + edges + chat)
 *   PUT  /workspaces/:id    -> persist workspace layout
 */

export type EvidenceKind = 'source' | 'judgment' | 'statute' | 'document' | 'note';

export type WorkspaceObjectType = 'chat' | 'board' | 'evidence';

export interface WorkspaceObjectBase {
  /** Stable unique id (also used as the React Flow node id). */
  id: string;
  type: WorkspaceObjectType;
  /** Canvas position. For children of the board this is relative to the board. */
  position: { x: number; y: number };
  selected: boolean;
}

export interface EvidenceData extends WorkspaceObjectBase {
  type: 'evidence';
  kind: EvidenceKind;
  title: string;
  excerpt: string;
  /** e.g. "BNS §103(1) · Act 45 of 2023" or filename. */
  reference: string;
  citation?: string;
  /** Knowledge-DB document id for real citations (enables scoped retrieval). */
  documentId?: string;
  /** Knowledge-DB chunk id for real citations (exact source traceability). */
  chunkId?: string;
  /** Id of the parent board node (React Flow grouping, optional). */
  parentId?: string;
}

export interface ChatCitation {
  id: string;
  kind: EvidenceKind;
  title: string;
  reference: string;
  excerpt: string;
  /** Knowledge-DB document id for real citations (enables scoped retrieval). */
  documentId?: string;
  /** Knowledge-DB chunk id for real citations (exact source traceability). */
  chunkId?: string;
}

export type ChatMessageStatus = 'complete' | 'streaming' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: ChatMessageStatus;
  /** Sources attached to an assistant response; each can be added to the board. */
  citations?: ChatCitation[];
  /** Id of the evidence node used as context for this question, if any. */
  contextEvidenceId?: string;
  error?: string;
}

export interface EvidenceEdge {
  id: string;
  source: string;
  target: string;
  /** Relationship label, e.g. "supports", "mentions". */
  label?: string;
}

/** Serializable snapshot used for undo/redo and (later) backend persistence. */
export interface WorkspaceSnapshot {
  name: string;
  evidence: EvidenceData[];
  edges: EvidenceEdge[];
  conversations: Conversation[];
  boardPosition: { x: number; y: number };
  boardSize: { width: number; height: number };
}

/* ------------------------------------------------------------------ */
/* Conversations (canvas objects) + relationships                      */
/* ------------------------------------------------------------------ */

export type RelationshipType =
  | 'related to'
  | 'follows from'
  | 'supports'
  | 'references'
  | 'contradicts'
  | 'derived from';

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'related to',
  'follows from',
  'supports',
  'references',
  'contradicts',
  'derived from',
];

export interface Conversation {
  /** Stable unique id (also used as the React Flow node id). */
  id: string;
  title: string;
  messages: ChatMessage[];
  /** Canvas position of the conversation node. */
  position: { x: number; y: number };
  selected: boolean;
  createdAt: number;
  updatedAt: number;
  /** Id of the evidence node this conversation was scoped to, if any. */
  contextEvidenceId?: string;
}

export const EVIDENCE_KIND_META: Record<
  EvidenceKind,
  { label: string; dot: string; badge: string }
> = {
  source: { label: 'Source', dot: 'bg-sky-600', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  judgment: { label: 'Judgment', dot: 'bg-violet-700', badge: 'bg-violet-50 text-violet-800 border-violet-200' },
  statute: { label: 'Provision', dot: 'bg-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  document: { label: 'Document', dot: 'bg-amber-600', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  note: { label: 'Note', dot: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};
