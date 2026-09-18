'use client';

/**
 * Compact conversation node content — a research-question card that is
 * visually distinct from evidence cards (indigo "conversation" identity).
 * Shows a preview only; the full exchange lives in the detail drawer.
 */

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  PanelRightOpen,
  Trash2,
} from 'lucide-react';
import { Markdown } from './markdown';
import type { ChatMessage } from '@/lib/workspace/types';
import { useWorkspace } from './WorkspaceProvider';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/\[DEV PLACEHOLDER[^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ConversationCardProps {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  selected?: boolean;
  inCanvas?: boolean;
}

export function ConversationCard({
  id,
  title,
  messages,
  createdAt,
  updatedAt,
  selected,
  inCanvas = true,
}: ConversationCardProps) {
  const {
    openConversation,
    continueConversation,
    deleteConversation,
    duplicateConversation,
    addAllSourcesToBoard,
    continuedConversationId,
  } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);

  const [isExpanded, setIsExpanded] = useState(true);

  const firstQuestion = messages.find((m) => m.role === 'user')?.content ?? '';
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const streaming = lastAssistant?.status === 'streaming';
  const preview = lastAssistant && lastAssistant.status === 'complete'
    ? stripMarkdown(lastAssistant.content).slice(0, 140)
    : '';
  const citationCount = messages.reduce((n, m) => n + (m.citations?.length ?? 0), 0);
  const exchangeCount = messages.filter((m) => m.role === 'user').length;
  const isContinued = continuedConversationId === id;

  return (
    <div
      className={`relative rounded-xl border bg-white transition-all h-full ${
        selected || isContinued
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-float'
          : 'border-[#E5E0D8] shadow-2xs hover:border-indigo-300 hover:shadow-claude'
      }`}
    >
      {inCanvas && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-indigo-500 opacity-0 hover:opacity-100"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-indigo-500 opacity-0 hover:opacity-100"
          />
        </>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Research
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-[#99958D]">{relativeTime(updatedAt || createdAt)}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="nodrag p-1 rounded-md text-[#99958D] hover:text-[#1F1E1D] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                aria-label="Conversation options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="nodrag fixed inset-0 z-10 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="nodrag absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-[#E5E0D8] bg-white shadow-float p-1 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); continueConversation(id); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-600" />
                      Continue conversation
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); addAllSourcesToBoard(id); }}
                      disabled={citationCount === 0}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <PanelRightOpen className="w-3.5 h-3.5 text-[#6B6861]" />
                      Add all sources to board
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); duplicateConversation(id); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#6B6861]" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); deleteConversation(id); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <h3 className="mt-2 font-serif text-[14px] font-bold text-[#1F1E1D] leading-snug line-clamp-2">⚖&nbsp;&nbsp;{title}</h3>

        <p className="mt-1.5 text-[11px] font-mono uppercase tracking-wide text-[#99958D]">You asked</p>
        <p className="text-xs text-[#383633] leading-relaxed line-clamp-2 italic">“{firstQuestion}”</p>

        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-[11px] font-mono uppercase tracking-wide text-indigo-600 flex items-center gap-1.5">
            <span>Soli</span>
            {citationCount > 0 && (
              <span className="text-[10px] font-sans font-normal text-[#99958D]">
                ({citationCount} authority{citationCount === 1 ? '' : 'ies'})
              </span>
            )}
          </p>
          {lastAssistant && !streaming && (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="nodrag text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors"
              title={isExpanded ? 'Collapse to compact preview' : 'Expand full output'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Compact</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Full output</span>
                </>
              )}
            </button>
          )}
        </div>

        {streaming ? (
          <div className="flex items-center gap-1.5 text-xs text-[#6B6861] py-2">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
            <span>Researching…</span>
          </div>
        ) : isExpanded && lastAssistant ? (
          <div className="mt-1.5 max-h-[380px] overflow-y-auto nowheel nodrag pr-1 space-y-1.5 rounded-lg border border-[#ECE8E1] bg-[#FAF9F5]/70 p-2.5 text-xs text-[#383633]">
            <Markdown text={lastAssistant.content} />
          </div>
        ) : (
          <p className="text-xs text-[#6B6861] leading-relaxed line-clamp-3 mt-1 italic">{preview || '…'}</p>
        )}

        {lastAssistant?.citations && lastAssistant.citations.length > 0 && isExpanded && (
          <div className="mt-2 pt-1.5 border-t border-[#F0ECE1] flex flex-wrap gap-1 items-center">
            <span className="text-[9px] font-mono uppercase tracking-wide text-[#99958D]">Citations:</span>
            {lastAssistant.citations.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center text-[10px] font-medium bg-white border border-[#E5E0D8] text-[#383633] px-1.5 py-0.5 rounded shadow-2xs"
                title={`${c.title}${c.reference ? ` - ${c.reference}` : ''}`}
              >
                {c.reference || c.title.slice(0, 18)}
              </span>
            ))}
            {lastAssistant.citations.length > 3 && (
              <span className="text-[9px] text-[#99958D] font-mono">
                +{lastAssistant.citations.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-[#ECE8E1] flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-[#99958D]">
            {citationCount} source{citationCount === 1 ? '' : 's'} · {exchangeCount} exchange{exchangeCount === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => continueConversation(id)}
              className="nodrag text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-1.5 py-1 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => openConversation(id)}
              className="nodrag inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F1E1D] border border-[#E5E0D8] hover:border-indigo-300 bg-white hover:bg-indigo-50/50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-3 h-3" />
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
