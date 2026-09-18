'use client';

/**
 * Focused full-conversation view — a viewport-fixed right drawer.
 * Stays on /workspace: read the full exchange, inspect citations,
 * continue the thread, add sources to the Evidence Board, close to canvas.
 */

import React from 'react';
import { Loader2, MessageSquarePlus, Plus, TriangleAlert, X } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { Markdown } from './markdown';
import type { ChatMessage } from '@/lib/workspace/types';

function cleanBoilerplate(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:^|\n)#{1,4}\s*(?:Statutory\s+)?Coverage\s*(?:&|and)\s*Limitations?[\s\S]*$/i, '')
    .replace(/(?:^|\n)(?:Statutory\s+)?Coverage\s*(?:&|and)\s*Limitations?:?[\s\S]*$/i, '')
    .replace(/This analysis is synthesized directly from (?:Soli'?s\s+)?indexed statutory corpus\.?[^\n]*/gi, '')
    .replace(/You can pin (?:any of )?these citations[^\n.]*\.?/gi, '')
    .trim();
}

function FullMessage({ message }: { message: ChatMessage }) {
  const { addCitationToBoard, openConversationId } = useWorkspace();

  if (message.status === 'streaming') {
    return (
      <div className="flex items-center gap-2 text-xs text-[#6B6861] py-2" aria-live="polite">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
        <span>Soli is researching…</span>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 flex items-start gap-2">
        <TriangleAlert className="w-4 h-4 text-red-500 shrink-0 mt-px" />
        <div>
          <p className="text-xs font-semibold text-red-700">Research failed</p>
          <p className="text-xs text-red-600/90 mt-0.5">{message.error ?? 'Please try again.'}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[92%] rounded-2xl rounded-br-md bg-[#1F1E1D] text-white px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E0D8] bg-white p-3.5 shadow-2xs">
      <Markdown text={cleanBoilerplate(message.content)} />
      {message.citations && message.citations.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#ECE8E1] space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#99958D]">
            Sources ({message.citations.length})
          </p>
          {message.citations.map((cite) => (
            <div
              key={cite.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#FAF9F5] border border-[#ECE8E1] px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#1F1E1D] truncate">{cite.title}</p>
                <p className="text-[11px] text-[#6B6861] truncate">{cite.reference}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addCitationToBoard({ ...cite, id: `${cite.id}-${Date.now()}` }, openConversationId ?? undefined)
                }
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-white hover:bg-indigo-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                title="Create an evidence node and link it to this conversation"
              >
                <Plus className="w-3 h-3" />
                Add to board
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConversationDetail() {
  const {
    openConversationId,
    conversations,
    closeConversationDetail,
    continueConversation,
    addAllSourcesToBoard,
    evidence,
  } = useWorkspace();

  const conversation = conversations.find((c) => c.id === openConversationId) ?? null;
  if (!conversation) return null;

  const scopedEvidence = conversation.contextEvidenceId
    ? evidence.find((e) => e.id === conversation.contextEvidenceId)
    : null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <button
        type="button"
        aria-label="Close conversation"
        onClick={closeConversationDetail}
        className="pointer-events-auto absolute inset-0 bg-[#1F1E1D]/20 cursor-default"
      />
      <aside className="pointer-events-auto absolute right-3 top-16 bottom-20 w-[min(430px,calc(100%-1.5rem))] rounded-2xl border border-[#E5E0D8] bg-[#FAF9F5] shadow-float flex flex-col overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-[#E5E0D8] bg-white flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-600">Conversation</p>
            <h2 className="font-serif text-base font-bold text-[#1F1E1D] leading-snug line-clamp-2">{conversation.title}</h2>
            {scopedEvidence && (
              <p className="text-[11px] text-[#6B6861] truncate mt-0.5">⌗ Scoped to: {scopedEvidence.title}</p>
            )}
          </div>
          <button
            type="button"
            onClick={closeConversationDetail}
            className="p-1.5 rounded-lg text-[#6B6861] hover:text-[#1F1E1D] hover:bg-[#F7F5EE] transition-colors cursor-pointer shrink-0"
            aria-label="Close and return to canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-3">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
              {msg.role === 'assistant' && (
                <span className="text-[10px] font-mono text-[#99958D] px-1">Soli</span>
              )}
              <FullMessage message={msg} />
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#E5E0D8] bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => { continueConversation(conversation.id); closeConversationDetail(); }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Continue in composer
          </button>
          <button
            type="button"
            onClick={() => addAllSourcesToBoard(conversation.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] hover:border-indigo-300 hover:bg-indigo-50/50 text-[#383633] text-xs font-semibold transition-colors cursor-pointer"
            title="Add every source as evidence nodes linked to this conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            All to board
          </button>
        </div>
      </aside>
    </div>
  );
}
