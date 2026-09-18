'use client';

/**
 * Fixed bottom-center Chat Composer.
 * Viewport-fixed (NOT a canvas object): never moves on pan/zoom.
 * Two modes: fresh question ("Ask Soli…") and continue-target
 * ("Continue this research…" with a dismissible indicator).
 */

import React, { useEffect, useRef } from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';

export function ChatComposer() {
  const {
    composerDraft,
    setComposerDraft,
    composerBusy,
    composerFocusKey,
    sendComposer,
    continuedConversationId,
    conversations,
    stopContinuing,
    evidenceContextId,
    evidence,
    clearEvidenceContext,
  } = useWorkspace();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const continued = conversations.find((c) => c.id === continuedConversationId) ?? null;
  const contextEvidence = evidence.find((e) => e.id === evidenceContextId) ?? null;

  useEffect(() => {
    if (composerFocusKey > 0) textareaRef.current?.focus();
  }, [composerFocusKey]);

  // Auto-grow (cap ~5 rows).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [composerDraft]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendComposer(composerDraft);
  };

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-2xl">
      <div className="pointer-events-auto">
        {(continued || contextEvidence) && (
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1F1E1D] text-white pl-3 pr-1.5 py-1 shadow-float animate-fade-in max-w-full">
              <span className="text-[11px] truncate">
                {continued ? (
                  <>Continuing: <span className="font-semibold">{continued.title}</span></>
                ) : (
                  <>⌗ Asking about: <span className="font-semibold">{contextEvidence?.title}</span></>
                )}
              </span>
              <button
                type="button"
                onClick={() => { if (continued) stopContinuing(); if (contextEvidence) clearEvidenceContext(); }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                aria-label="Cancel continue mode"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5E0D8] bg-white shadow-float focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={composerDraft}
            onChange={(e) => setComposerDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              continued
                ? 'Continue this research...'
                : 'Ask Soli about a case, statute, judgment, or legal issue...'
            }
            className="w-full bg-transparent text-[#1F1E1D] text-sm outline-none resize-none placeholder:text-[#99958D] leading-relaxed px-4 pt-3.5 pb-1 max-h-[132px]"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <span className="text-[10px] font-mono text-[#99958D] pl-1">
              {continued ? 'Follow-up appends to this node' : '↵ send · new question = new node'}
            </span>
            <button
              type="submit"
              disabled={!composerDraft.trim() || composerBusy}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer shrink-0"
              aria-label="Send to Soli"
            >
              {composerBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
