'use client';

import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface HeroPromptProps {
  userName?: string;
  onSubmitPrompt?: (prompt: string) => void;
  promptValue: string;
  setPromptValue: (val: string) => void;
}

export function HeroPrompt({
  userName,
  onSubmitPrompt,
  promptValue,
  setPromptValue,
}: HeroPromptProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userName ? userName.split(' ')[0] : 'Counsel';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptValue.trim()) return;
    onSubmitPrompt?.(promptValue.trim());
  };

  return (
    <div className="w-full flex flex-col items-center text-center max-w-3xl mx-auto pt-6 sm:pt-12 pb-4">
      <div className="flex flex-col items-center mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#CC6242]/10 text-[#CC6242] flex items-center justify-center mb-4 ring-1 ring-[#CC6242]/20 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-tight">
          {getGreeting()}, <span className="italic">{displayName}</span>
        </h1>
        <p className="text-[#6B6861] text-sm sm:text-base mt-2 font-normal">
          How can Soli assist with your legal research today?
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full relative flex flex-col items-center text-left"
      >
        <div className="w-full bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-claude hover:border-[#D8D1C5] focus-within:border-[#CC6242]/70 focus-within:ring-4 focus-within:ring-[#CC6242]/8 transition-all p-3 sm:p-4">
          <textarea
            rows={3}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Ask about a case, statute, judgment, or legal issue…"
            className="w-full bg-transparent text-[#1F1E1D] text-sm sm:text-base outline-none resize-none placeholder:text-[#99958D] leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="pt-2 mt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={!promptValue.trim()}
              className="w-8 h-8 rounded-xl bg-[#CC6242] hover:bg-[#B85435] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
              aria-label="Research in workspace"
            >
              <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
