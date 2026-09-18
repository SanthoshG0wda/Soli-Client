'use client';

/**
 * Workspace canvas — the infinite Evidence Board.
 *
 * Fixed to the right side of the workspace, providing an infinite React Flow
 * canvas dedicated to legal evidence nodes (statutes, judgments, documents, notes)
 * and their inter-relationships (supports, cites, contradicts, etc.).
 *
 * Direct drag-and-drop, connection handle drawing, zooming, panning, and
 * debounced server persistence via PostgreSQL.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  BookOpen,
  FileText,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  ScrollText,
  StickyNote,
} from 'lucide-react';
import { useWorkspace, type EvidenceFlowNode } from './WorkspaceProvider';
import { EvidenceNodeWrapper } from './flow-nodes';
import { AddEvidenceMenu } from './add-evidence-menu';
import type { EvidenceKind } from '@/lib/workspace/types';

const DEFAULT_VIEWPORT = { x: 30, y: 30, zoom: 0.95 };

const ADD_OPTIONS: { kind: EvidenceKind; label: string; icon: React.ReactNode }[] = [
  { kind: 'statute', label: 'Statute Provision', icon: <ScrollText className="w-3.5 h-3.5" /> },
  { kind: 'judgment', label: 'Case Judgment', icon: <Scale className="w-3.5 h-3.5" /> },
  { kind: 'document', label: 'Matter Document', icon: <FileText className="w-3.5 h-3.5" /> },
  { kind: 'note', label: 'Research Note', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { kind: 'source', label: 'Legal Source', icon: <BookOpen className="w-3.5 h-3.5" /> },
];

function CanvasControls() {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

  const btn =
    'p-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#6B6861] hover:text-[#1F1E1D] hover:border-[#D8D1C5] shadow-2xs transition-colors cursor-pointer';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        className={btn}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        className={btn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className={btn}
        aria-label="Fit to view"
        title="Fit to view"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setViewport(DEFAULT_VIEWPORT, { duration: 300 })}
        className={btn}
        aria-label="Reset view"
        title="Reset view"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function KeyboardShortcuts() {
  const { nodes, deleteEvidenceMany, deselectAll } = useWorkspace();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        deselectAll();
        return;
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const selectedEvidence = nodes
        .filter((n) => n.type === 'evidence' && n.selected)
        .map((n) => n.id);
      if (selectedEvidence.length > 0) {
        e.preventDefault();
        deleteEvidenceMany(selectedEvidence);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nodes, deleteEvidenceMany, deselectAll]);
  return null;
}

export function WorkspaceCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    cycleEdgeLabel,
    beginDrag,
    endDrag,
    persistPositions,
    setSelectedEvidenceId,
    addEvidence,
  } = useWorkspace();

  const [headerAddOpen, setHeaderAddOpen] = useState(false);

  // Evidence Board infinite canvas exclusively presents evidence nodes and inter-evidence edges
  const evidenceNodes = useMemo(
    () => nodes.filter((n): n is EvidenceFlowNode => n.type === 'evidence'),
    [nodes],
  );

  const evidenceNodeIds = useMemo(
    () => new Set(evidenceNodes.map((n) => n.id)),
    [evidenceNodes],
  );

  const evidenceEdges = useMemo(
    () => edges.filter((e) => evidenceNodeIds.has(e.source) && evidenceNodeIds.has(e.target)),
    [edges, evidenceNodeIds],
  );

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      evidence: EvidenceNodeWrapper,
    }),
    [],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: { id: string; type?: string }[] }) => {
      const firstEvidence = selected.find((n) => n.type === 'evidence');
      setSelectedEvidenceId(firstEvidence ? firstEvidence.id : null);
    },
    [setSelectedEvidenceId],
  );

  const handleEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      cycleEdgeLabel(edge.id);
    },
    [cycleEdgeLabel],
  );

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: { id: string }, draggedNodes?: { id: string }[]) => {
      endDrag();
      const ids =
        draggedNodes && draggedNodes.length > 0
          ? draggedNodes.map((n) => n.id)
          : [node.id];
      persistPositions(ids);
    },
    [endDrag, persistPositions],
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#FAF9F5]">
      {/* Evidence Board Dedicated Header */}
      <div className="h-11 px-3.5 border-b border-[#E5E0D8] bg-white/80 backdrop-blur flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1F1E1D] text-white flex items-center justify-center shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#CC6242]" />
          </div>
          <span className="text-xs font-semibold text-[#1F1E1D] tracking-tight">Evidence Board</span>
          <span className="text-[10px] font-mono text-[#6B6861] border border-[#E5E0D8] bg-[#FAF9F5] rounded-full px-2 py-0.5">
            {evidenceNodes.length} {evidenceNodes.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CanvasControls />

          {/* Topbar Add Evidence Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderAddOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#CC6242] text-white hover:bg-[#B85435] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>
            {headerAddOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setHeaderAddOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-xl border border-[#E5E0D8] bg-white shadow-float p-1.5 animate-fade-in">
                  <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#99958D]">
                    Pin New Evidence
                  </p>
                  {ADD_OPTIONS.map((opt) => (
                    <button
                      key={opt.kind}
                      type="button"
                      onClick={() => {
                        addEvidence(opt.kind);
                        setHeaderAddOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] hover:text-[#1F1E1D] transition-colors cursor-pointer"
                    >
                      <span className="text-[#CC6242]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Infinite Canvas Area */}
      <div className="flex-1 w-full min-h-0 relative">
        <ReactFlow
          nodes={evidenceNodes}
          edges={evidenceEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onNodeDragStart={beginDrag}
          onNodeDragStop={handleNodeDragStop}
          onSelectionChange={handleSelectionChange}
          defaultViewport={DEFAULT_VIEWPORT}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode={[]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#CC6242', strokeWidth: 1.75 },
            labelStyle: { fontSize: 10, fill: '#6B6861', fontFamily: 'monospace' },
            labelBgStyle: { fill: '#FAF9F5' },
          }}
          proOptions={{ hideAttribution: true }}
          className="!bg-[#FAF9F5]"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#D8D1C5" />
          <MiniMap
            pannable
            zoomable
            className="!bg-white !border !border-[#E5E0D8] !rounded-xl !shadow-claude !m-3"
            maskColor="rgba(250, 249, 245, 0.7)"
          />
          <KeyboardShortcuts />
        </ReactFlow>

        {/* Empty State Banner */}
        {evidenceNodes.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex items-center justify-center text-[#CC6242] mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1F1E1D]">Evidence Board is empty</h3>
            <p className="text-xs text-[#6B6861] max-w-xs mt-1.5 leading-relaxed">
              Ask legal questions in the chat to extract citations and click &ldquo;+ Add to board&rdquo;, or click <strong>Add</strong> above to pin provisions directly.
            </p>
          </div>
        )}

        <AddEvidenceMenu />
      </div>
    </div>
  );
}
