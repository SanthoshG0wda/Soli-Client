'use client';

/**
 * React Flow custom node wrappers.
 * Thin shells — the real UI lives in `conversation-card.tsx`,
 * `evidence-card.tsx`, and the board header below.
 * (Evidence Board design/behavior intentionally untouched.)
 */

import React from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { ConversationCard } from './conversation-card';
import { EvidenceCard } from './evidence-card';
import { useWorkspace, type BoardPanelNode, type ConversationFlowNode, type EvidenceFlowNode } from './WorkspaceProvider';

const RESIZER_LINE = { borderColor: '#818cf8', borderWidth: 1.5 };
const RESIZER_HANDLE = { width: 9, height: 9, backgroundColor: '#fff', border: '2px solid #6366f1', borderRadius: 3 };

export function ConversationNodeWrapper(props: NodeProps) {
  const data = props.data as unknown as ConversationFlowNode['data'];
  const { beginDrag, endDrag } = useWorkspace();
  return (
    <div className="w-full h-full">
      <NodeResizer
        isVisible={props.selected}
        minWidth={260}
        minHeight={180}
        lineStyle={RESIZER_LINE}
        handleStyle={RESIZER_HANDLE}
        onResizeStart={beginDrag}
        onResizeEnd={endDrag}
      />
      <ConversationCard
        id={props.id}
        title={data.title}
        messages={data.messages}
        createdAt={data.createdAt}
        updatedAt={data.updatedAt}
        selected={props.selected}
        inCanvas
      />
    </div>
  );
}

export function BoardPanelNodeWrapper(props: NodeProps) {
  const { evidence, beginDrag, endDrag } = useWorkspace();
  const data = (props.data ?? {}) as BoardPanelNode['data'];

  return (
    <div className="w-full h-full rounded-2xl border border-[#D8D1C5] bg-[#F4F1EA]/60 overflow-hidden">
      <NodeResizer
        isVisible={props.selected}
        minWidth={480}
        minHeight={360}
        lineStyle={RESIZER_LINE}
        handleStyle={RESIZER_HANDLE}
        onResizeStart={beginDrag}
        onResizeEnd={endDrag}
      />
      <div className="px-4 py-3 border-b border-[#E5E0D8] bg-white/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1F1E1D] text-white flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[#1F1E1D] leading-tight">Evidence Board</h2>
            {evidence.length > 0 && (
              <p className="text-[11px] text-[#6B6861] leading-tight">
                {`${evidence.length} item${evidence.length === 1 ? '' : 's'} · drag to arrange · connect handles to link`}
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#99958D] border border-[#E5E0D8] bg-white rounded-full px-2 py-0.5">
          {typeof data.childCount === 'number' ? data.childCount : evidence.length}
        </span>
      </div>
    </div>
  );
}

export function EvidenceNodeWrapper(props: NodeProps) {
  const data = props.data as unknown as EvidenceFlowNode['data'];
  const { beginDrag, endDrag } = useWorkspace();
  return (
    <div className="w-full h-full">
      <NodeResizer
        isVisible={props.selected}
        minWidth={220}
        minHeight={140}
        lineStyle={RESIZER_LINE}
        handleStyle={RESIZER_HANDLE}
        onResizeStart={beginDrag}
        onResizeEnd={endDrag}
      />
      <EvidenceCard
        id={props.id}
        kind={data.kind}
        title={data.title}
        excerpt={data.excerpt}
        reference={data.reference}
        citation={data.citation}
        selected={props.selected}
        inCanvas
      />
    </div>
  );
}
