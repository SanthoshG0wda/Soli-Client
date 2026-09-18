'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Shell } from '@/components/layout/shell';
import { HeroPrompt } from '@/components/workspace/hero-prompt';
import { useAuth } from '@/contexts/auth-context';

export default function WorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [promptText, setPromptText] = useState('');

  const handleExecutePrompt = (prompt: string) => {
    router.push(`/workspace?q=${encodeURIComponent(prompt)}`);
  };

  const handleNewTask = () => {
    setPromptText('');
  };

  return (
    <Shell onNewTask={handleNewTask}>
      <div className="min-h-full flex flex-col justify-between px-4 sm:px-8 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center flex-1 my-auto">
          <Link
            href="/workspace"
            className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F1E1D] text-white text-xs font-semibold hover:bg-black transition-colors shadow-claude"
          >
            Open Workspace — Legal Research Canvas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <HeroPrompt
            userName={user?.full_name}
            promptValue={promptText}
            setPromptValue={setPromptText}
            onSubmitPrompt={handleExecutePrompt}
          />
        </div>
      </div>
    </Shell>
  );
}
