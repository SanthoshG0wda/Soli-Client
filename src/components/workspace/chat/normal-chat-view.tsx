'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Scale,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useWorkspace } from '../canvas/WorkspaceProvider';
import { Markdown } from '../canvas/markdown';
import type { ChatCitation, ChatMessage } from '@/lib/workspace/types';

const SUGGESTED_PROMPTS = [
  'What offences may apply to OTP-based bank fraud under BNS and IT Act?',
  'Explain Section 103 of Bharatiya Nyaya Sanhita, 2023 with punishments',
  'What are the mandatory conditions for electronic evidence under Section 63 BSA?',
  'How does anticipatory bail procedure work under BNSS 2023?',
];

function cleanBoilerplate(text: string): string {
  if (!text) return '';
  return text
    // Strip trailing section starting with Statutory Coverage & Limitations
    .replace(/(?:^|\n)#{1,4}\s*(?:Statutory\s+)?Coverage\s*(?:&|and)\s*Limitations?[\s\S]*$/i, '')
    .replace(/(?:^|\n)(?:Statutory\s+)?Coverage\s*(?:&|and)\s*Limitations?:?[\s\S]*$/i, '')
    // Strip synthesized directly sentences
    .replace(/This analysis is synthesized directly from (?:Soli'?s\s+)?indexed statutory corpus\.?[^\n]*/gi, '')
    // Strip pin citations instructions
    .replace(/You can pin (?:any of )?these citations[^\n.]*\.?/gi, '')
    .trim();
}

function getShortStatuteName(title: string): string {
  if (!title) return '';
  if (/information\s+technology/i.test(title)) return 'IT Act';
  if (/bharatiya\s+nyaya\s+sanhita/i.test(title)) return 'BNS';
  if (/bharatiya\s+nagarik\s+suraksha/i.test(title)) return 'BNSS';
  if (/bharatiya\s+sakshya/i.test(title)) return 'BSA';
  if (/penal\s+code/i.test(title)) return 'IPC';
  if (/criminal\s+procedure/i.test(title)) return 'CrPC';
  if (/constitution/i.test(title)) return 'Const.';
  if (/evidence\s+act/i.test(title)) return 'IEA';
  return title.replace(/^The\s+/i, '').replace(/,\s*\d{4}$/, '');
}

function formatCitationBadge(c: ChatCitation): { sec: string; doc: string } {
  const shortDoc = getShortStatuteName(c.title);
  if (c.reference) {
    const secNum = c.reference.replace(/^(?:Section|Sec\.?|Article|Art\.?)\s*/i, '');
    const prefix = /article/i.test(c.reference) ? 'Art.' : '§';
    return {
      sec: `${prefix} ${secNum}`,
      doc: shortDoc,
    };
  }
  return {
    sec: c.kind === 'statute' ? '§' : c.kind.toUpperCase(),
    doc: shortDoc || c.title,
  };
}

function CompactCitationChip({
  citation,
  conversationId,
}: {
  citation: ChatCitation;
  conversationId?: string;
}) {
  const { addCitationToBoard, evidence } = useWorkspace();
  const [added, setAdded] = useState(false);

  const isAlreadyOnBoard = evidence.some(
    (e) =>
      e.title === citation.title ||
      (citation.chunkId && e.chunkId === citation.chunkId) ||
      (e.reference && citation.reference && e.reference === citation.reference),
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addCitationToBoard(citation, conversationId);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const { sec, doc } = formatCitationBadge(citation);

  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
        isAlreadyOnBoard || added
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          : 'bg-[#FAF9F5] border-[#E5E0D8] text-[#1F1E1D] hover:border-[#CC6242]/60 hover:bg-white shadow-2xs'
      }`}
      title={`${citation.title}${citation.reference ? ` — ${citation.reference}` : ''}${citation.excerpt ? `\n\n"${citation.excerpt}"` : ''}`}
    >
      <span className="font-semibold text-[11px] font-mono tracking-tight text-[#CC6242]">
        {sec}
      </span>
      <span className="text-[11px] text-[#524F4A] truncate max-w-[140px] sm:max-w-[190px]">
        {doc}
      </span>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isAlreadyOnBoard || added}
        className={`ml-0.5 -mr-1 p-0.5 rounded-md transition-colors cursor-pointer ${
          isAlreadyOnBoard || added
            ? 'text-emerald-600 hover:text-emerald-700 cursor-default'
            : 'text-[#99958D] hover:text-[#CC6242] hover:bg-[#F3EFE7]'
        }`}
        title={isAlreadyOnBoard || added ? 'Added to Evidence Board' : 'Pin to Evidence Board'}
        aria-label={isAlreadyOnBoard || added ? 'Pinned to Evidence Board' : 'Pin to Evidence Board'}
      >
        {isAlreadyOnBoard || added ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function DetailedCitationCard({
  citation,
  conversationId,
}: {
  citation: ChatCitation;
  conversationId?: string;
}) {
  const { addCitationToBoard, evidence } = useWorkspace();
  const [added, setAdded] = useState(false);

  const isAlreadyOnBoard = evidence.some(
    (e) =>
      e.title === citation.title ||
      (citation.chunkId && e.chunkId === citation.chunkId) ||
      (e.reference && citation.reference && e.reference === citation.reference),
  );

  const handleAdd = () => {
    addCitationToBoard(citation, conversationId);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-[#FAF9F5] border border-[#E5E0D8] p-2.5 hover:border-[#D8D1C5] transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white border border-[#E5E0D8] text-[#6B6861]">
            {citation.kind}
          </span>
          <p className="text-xs font-semibold text-[#1F1E1D] truncate">{citation.title}</p>
          {citation.reference && (
            <span className="text-[11px] font-medium text-[#B85435] shrink-0">
              {citation.reference}
            </span>
          )}
        </div>
        {citation.excerpt && (
          <p className="text-[11px] text-[#6B6861] mt-1 line-clamp-2 italic leading-relaxed">
            &ldquo;{citation.excerpt}&rdquo;
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAlreadyOnBoard || added}
        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          isAlreadyOnBoard || added
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
            : 'bg-white hover:bg-[#F3EFE7] text-[#1F1E1D] border border-[#E5E0D8] shadow-2xs hover:border-[#CC6242]'
        }`}
        title="Pin source to Evidence Board"
      >
        {isAlreadyOnBoard || added ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>On Board</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5 text-[#CC6242]" />
            <span>Add to board</span>
          </>
        )}
      </button>
    </div>
  );
}

function CitationsSection({
  citations,
  conversationId,
}: {
  citations: ChatCitation[];
  conversationId?: string;
}) {
  const { addAllSourcesToBoard } = useWorkspace();
  const [showDetails, setShowDetails] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-[#ECE8E1]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#99958D]">
            Sources ({citations.length})
          </span>
          {conversationId && (
            <button
              type="button"
              onClick={() => addAllSourcesToBoard(conversationId)}
              className="text-[10px] font-medium text-[#CC6242] hover:text-[#B85435] transition-colors cursor-pointer inline-flex items-center gap-0.5 hover:underline"
              title="Pin all sources to Evidence Board"
            >
              <Plus className="w-2.5 h-2.5" />
              Pin all
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] font-medium text-[#8C887F] hover:text-[#1F1E1D] transition-colors cursor-pointer inline-flex items-center gap-0.5"
        >
          <span>{showDetails ? 'Hide details' : 'Show details'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Compact Chips Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {citations.map((c) => (
          <CompactCitationChip key={c.id} citation={c} conversationId={conversationId} />
        ))}
      </div>

      {/* Optional Expanded Details */}
      {showDetails && (
        <div className="mt-2.5 space-y-1.5 pt-2 border-t border-dashed border-[#ECE8E1] animate-fade-in">
          {citations.map((c) => (
            <DetailedCitationCard key={c.id} citation={c} conversationId={conversationId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantMessageView({
  message,
  conversationId,
}: {
  message: ChatMessage;
  conversationId?: string;
}) {
  if (message.status === 'streaming') {
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-7 h-7 rounded-lg bg-[#CC6242] text-white flex items-center justify-center shrink-0 shadow-2xs font-serif font-bold text-xs mt-0.5">
          S
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-sm border border-[#E5E0D8] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B6861]">
            <Loader2 className="w-4 h-4 animate-spin text-[#CC6242]" />
            <span>Soli is researching Indian statutes and precedents…</span>
          </div>
        </div>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-serif font-bold text-xs mt-0.5">
          S
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <TriangleAlert className="w-4 h-4 text-rose-600" />
            <span>Research Error</span>
          </div>
          <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">
            {message.error || message.content || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group animate-fade-in">
      <div className="w-7 h-7 rounded-lg bg-[#CC6242] text-white flex items-center justify-center shrink-0 shadow-2xs font-serif font-bold text-xs mt-0.5">
        S
      </div>
      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm border border-[#E5E0D8] bg-white p-4.5 shadow-2xs">
        {/* Markdown answer content with boilerplate stripped */}
        <div className="prose prose-sm max-w-none text-[#1F1E1D]">
          <Markdown text={cleanBoilerplate(message.content)} />
        </div>

        {/* Compact Citations section */}
        {message.citations && message.citations.length > 0 && (
          <CitationsSection citations={message.citations} conversationId={conversationId} />
        )}
      </div>
    </div>
  );
}

export function NormalChatView() {
  const {
    conversations,
    composerDraft,
    setComposerDraft,
    composerBusy,
    sendComposer,
    continuedConversationId,
    continueConversation,
    stopContinuing,
    evidenceContextId,
    clearEvidenceContext,
    evidence,
  } = useWorkspace();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);

  // Sync active thread: default to latest conversation or selected continued target
  useEffect(() => {
    if (continuedConversationId) {
      setActiveThreadId(continuedConversationId);
    } else if (conversations.length > 0 && !activeThreadId) {
      setActiveThreadId(conversations[conversations.length - 1].id);
    }
  }, [continuedConversationId, conversations, activeThreadId]);

  const activeConversation =
    conversations.find((c) => c.id === activeThreadId) ??
    (conversations.length > 0 ? conversations[conversations.length - 1] : null);

  const contextEvidence = evidence.find((e) => e.id === evidenceContextId) ?? null;

  // Auto-scroll down on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeConversation?.messages]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [composerDraft]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composerDraft.trim() || composerBusy) return;
    // Target the active thread if one is active
    if (activeConversation && !continuedConversationId) {
      continueConversation(activeConversation.id);
    }
    sendComposer(composerDraft);
  };

  const handleStartNewThread = () => {
    stopContinuing();
    setActiveThreadId(null);
    clearEvidenceContext();
    textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9F5] relative overflow-hidden">
      {/* Top Thread Bar */}
      <div className="h-11 px-4 border-b border-[#E5E0D8] bg-white/70 backdrop-blur flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-[#CC6242] shrink-0" />
          {conversations.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setThreadMenuOpen((o) => !o)}
                className="flex items-center gap-1 text-xs font-semibold text-[#1F1E1D] hover:text-[#CC6242] transition-colors py-1 truncate cursor-pointer"
              >
                <span className="truncate max-w-[260px]">
                  {activeConversation?.title || 'Research Thread'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#99958D]" />
              </button>
              {threadMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close thread menu"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setThreadMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-xl border border-[#E5E0D8] bg-white shadow-float p-1.5 animate-fade-in max-h-60 overflow-y-auto">
                    <p className="px-2 py-1 text-[10px] font-mono uppercase text-[#99958D]">
                      Research Threads
                    </p>
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveThreadId(c.id);
                          continueConversation(c.id);
                          setThreadMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                          c.id === activeConversation?.id
                            ? 'bg-[#F3EFE7] font-semibold text-[#1F1E1D]'
                            : 'text-[#4A4740] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-[#1F1E1D] truncate">
              {activeConversation?.title || 'Legal Research Chat'}
            </span>
          )}
          {activeConversation?.messages && activeConversation.messages.length > 0 && (
            <span className="text-[10px] text-[#99958D] font-mono border border-[#E5E0D8] rounded-full px-2 py-0.5">
              {activeConversation.messages.length} turn
              {activeConversation.messages.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleStartNewThread}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6861] hover:text-[#1F1E1D] bg-[#F7F5EE] hover:bg-[#EFECE3] border border-[#E5E0D8] rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
          title="Start a new independent question thread"
        >
          <Plus className="w-3 h-3 text-[#CC6242]" />
          <span>New Thread</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 px-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#CC6242]/10 text-[#CC6242] flex items-center justify-center mb-4 shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1F1E1D] tracking-tight">
              Soli Legal Coworker
            </h2>
            <p className="text-xs text-[#6B6861] mt-2 leading-relaxed">
              Ask legal questions, explore statutory provisions, compare BNS/BNSS/BSA reforms, and
              pin retrieved citations directly to the Evidence Board on your right.
            </p>

            {/* Suggested Prompt Chips */}
            <div className="w-full mt-6 space-y-2 text-left">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#99958D] text-center">
                Suggested Research Topics
              </p>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setComposerDraft(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#F7F5EE] hover:border-[#CC6242]/40 text-xs text-[#383633] transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
                >
                  <span className="truncate">{prompt}</span>
                  <Plus className="w-3.5 h-3.5 text-[#99958D] group-hover:text-[#CC6242] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Messages */
          activeConversation.messages.map((m) => (
            <React.Fragment key={m.id}>
              {m.role === 'user' ? (
                <div className="flex flex-col items-end animate-fade-in">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#1F1E1D] text-white px-4 py-3 shadow-2xs">
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ) : (
                <AssistantMessageView message={m} conversationId={activeConversation.id} />
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Fixed Bottom Chat Composer */}
      <div className="p-3 sm:p-4 bg-white/90 backdrop-blur border-t border-[#E5E0D8] shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Active Context Banner (Evidence Scoped Questioning) */}
          {contextEvidence && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-xl bg-[#F7F5EE] border border-[#E5E0D8] text-xs animate-fade-in">
              <span className="truncate text-[#1F1E1D]">
                Asking about evidence:{' '}
                <strong className="text-[#CC6242]">{contextEvidence.title}</strong>
              </span>
              <button
                type="button"
                onClick={clearEvidenceContext}
                className="p-1 text-[#99958D] hover:text-[#1F1E1D] rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                aria-label="Clear evidence context"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSend}
            className="rounded-2xl border border-[#E5E0D8] bg-white shadow-claude focus-within:border-[#CC6242] focus-within:ring-3 focus-within:ring-[#CC6242]/10 transition-all flex flex-col"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={composerDraft}
              onChange={(e) => setComposerDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeConversation
                  ? 'Ask a follow-up question or continue this research...'
                  : 'Ask Soli about a statute, judgment, offence, or legal question...'
              }
              className="w-full bg-transparent text-[#1F1E1D] text-sm outline-none resize-none placeholder:text-[#99958D] leading-relaxed px-4 pt-3 pb-1 max-h-[140px]"
            />
            <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-[#F0ECE1]">
              <span className="text-[10px] text-[#99958D]">
                ↵ to send · Shift+↵ for new line
              </span>
              <button
                type="submit"
                disabled={!composerDraft.trim() || composerBusy}
                className="w-8 h-8 rounded-xl bg-[#CC6242] hover:bg-[#B85435] text-white flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer shrink-0 shadow-2xs"
                aria-label="Send query"
              >
                {composerBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-[#99958D] mt-1.5">
            Soli synthesizes research from indexed Indian statutes and precedents.
          </p>
        </div>
      </div>
    </div>
  );
}
