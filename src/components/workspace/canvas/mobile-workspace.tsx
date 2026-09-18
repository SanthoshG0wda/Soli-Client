'use client';

/**
 * Mobile workspace — a simplified companion to the desktop canvas.
 * The full node canvas is desktop-first; on small screens:
 *   - Research (conversation list) is the primary tab
 *   - Evidence is a browsable list tab (same state, same actions)
 * The fixed composer stays pinned at the bottom; tapping a conversation
 * opens the same detail drawer used on desktop.
 */

import React, { useState } from 'react';
import { Layers, MessagesSquare, Plus } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { ConversationCard } from './conversation-card';
import { EvidenceCard } from './evidence-card';
import { ChatComposer } from './chat-composer';
import { ConversationDetail } from './conversation-detail';
import type { EvidenceKind } from '@/lib/workspace/types';

const QUICK_ADD: EvidenceKind[] = ['note', 'statute', 'judgment', 'document', 'source'];

export function MobileWorkspace() {
  const { conversations, evidence, addEvidence, openConversation } = useWorkspace();
  const [tab, setTab] = useState<'research' | 'evidence'>('research');

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    // Let the card's own buttons (menu, Continue, Open) handle their clicks.
    if ((e.target as HTMLElement).closest('button')) return;
    openConversation(id);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openConversation(id);
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 pt-16">
      <div className="px-3 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white border border-[#E5E0D8]">
          <button
            type="button"
            onClick={() => setTab('research')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'research' ? 'bg-[#1F1E1D] text-white' : 'text-[#6B6861]'
            }`}
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            Research ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('evidence')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'evidence' ? 'bg-[#1F1E1D] text-white' : 'text-[#6B6861]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Evidence ({evidence.length})
          </button>
        </div>
      </div>

      {tab === 'research' ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-44 space-y-2.5">
          {conversations.length > 0
            ? sortedConversations.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleCardClick(e, c.id)}
                  onKeyDown={(e) => handleCardKeyDown(e, c.id)}
                  className="w-full text-left cursor-pointer"
                >
                  <ConversationCard
                    id={c.id}
                    title={c.title}
                    messages={c.messages}
                    createdAt={c.createdAt}
                    updatedAt={c.updatedAt}
                    inCanvas={false}
                  />
                </div>
              ))
            : null}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-44 space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {QUICK_ADD.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => addEvidence(kind)}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium border border-[#E5E0D8] bg-white rounded-full px-2.5 py-1.5 text-[#383633] cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#CC6242]" />
                {kind}
              </button>
            ))}
          </div>
          {evidence.length > 0
            ? evidence.map((e) => (
                <EvidenceCard
                  key={e.id}
                  id={e.id}
                  kind={e.kind}
                  title={e.title}
                  excerpt={e.excerpt}
                  reference={e.reference}
                  citation={e.citation}
                  selected={false}
                  inCanvas={false}
                />
              ))
            : null}
        </div>
      )}

      <ChatComposer />
      <ConversationDetail />
    </div>
  );
}
