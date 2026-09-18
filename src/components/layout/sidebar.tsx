'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronsLeft, Plus, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useOptionalWorkspace } from '@/components/workspace/canvas/WorkspaceProvider';
import { listWorkspaces, type WorkspaceSummary } from '@/lib/workspace/api';

interface SidebarProps {
  onCloseMobile?: () => void;
  onNewTask?: () => void;
  onShrink?: () => void;
}

export function Sidebar({ onCloseMobile, onNewTask, onShrink }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const workspaceContext = useOptionalWorkspace();

  const [localWorkspaces, setLocalWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // If inside WorkspaceProvider, use its live workspaces list; otherwise fetch from API
  const workspaceItems = workspaceContext?.workspaces?.length
    ? workspaceContext.workspaces
    : localWorkspaces;
  const activeWorkspaceId = workspaceContext?.activeWorkspaceId ?? null;

  useEffect(() => {
    if (!workspaceContext) {
      setLoadingList(true);
      listWorkspaces()
        .then(setLocalWorkspaces)
        .catch(() => {})
        .finally(() => setLoadingList(false));
    }
  }, [workspaceContext]);

  const handleNewWorkspace = async () => {
    onCloseMobile?.();
    if (workspaceContext?.createNewWorkspace) {
      const createdId = await workspaceContext.createNewWorkspace();
      if (createdId) {
        router.push(`/workspace/${createdId}`);
        return;
      }
    }
    router.push('/workspace');
  };

  return (
    <aside className="w-64 h-full bg-[#F7F5EE] border-r border-[#E5E0D8] flex flex-col justify-between select-none text-[#1F1E1D]">
      {/* Top area */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-[#ECE8E1]/80">
          <Link href="/" onClick={onCloseMobile} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#CC6242] flex items-center justify-center text-white shadow-xs group-hover:bg-[#B85435] transition-all">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-[17px] font-bold text-[#1F1E1D] tracking-tight">
                Soli
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[#6B6861] -mt-0.5">
                Legal Research
              </span>
            </div>
          </Link>
          {onShrink && (
            <button
              type="button"
              onClick={onShrink}
              aria-label="Shrink sidebar"
              title="Shrink sidebar"
              className="p-1.5 rounded-lg text-[#99958D] hover:text-[#1F1E1D] hover:bg-[#EFECE3] transition-colors cursor-pointer shrink-0"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Task Action Button */}
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => {
              if (onNewTask) {
                onNewTask();
                onCloseMobile?.();
              } else {
                void handleNewWorkspace();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-[#F3EFE7] border border-[#E5E0D8] text-[#1F1E1D] text-xs font-medium shadow-xs transition-all cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-md bg-[#CC6242]/10 text-[#CC6242] flex items-center justify-center group-hover:bg-[#CC6242] group-hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">New legal task</span>
          </button>
        </div>

        {/* Workspace entry link */}
        <div className="px-3 py-1">
          <Link
            href="/workspace"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1F1E1D] hover:bg-black text-white text-xs font-medium transition-colors group"
          >
            <span className="font-medium">Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dynamic Workspace List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#99958D]">
            <span>Recent Researches</span>
            <button
              type="button"
              onClick={handleNewWorkspace}
              title="New research canvas"
              aria-label="New research canvas"
              className="p-1 rounded-md hover:bg-[#EFECE3] text-[#6B6861] hover:text-[#1F1E1D] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {loadingList ? (
            <div className="space-y-1.5 px-2 py-1">
              <div className="h-6 rounded bg-[#EFECE3]/60 animate-pulse" />
              <div className="h-6 rounded bg-[#EFECE3]/40 animate-pulse" />
            </div>
          ) : workspaceItems.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-[#99958D] leading-relaxed">
              No research canvases yet. Ask a question or create a new canvas above.
            </p>
          ) : (
            workspaceItems.map((ws) => {
              const isActive = activeWorkspaceId === ws.id;
              return (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  onClick={() => {
                    onCloseMobile?.();
                    if (workspaceContext?.selectWorkspace) {
                      void workspaceContext.selectWorkspace(ws.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors group ${
                    isActive
                      ? 'bg-[#EAE5D9] text-[#1F1E1D] font-medium shadow-2xs'
                      : 'text-[#4A4740] hover:bg-[#EFECE3] hover:text-[#1F1E1D]'
                  }`}
                >
                  <span className="truncate">{ws.title || 'Untitled Research'}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#CC6242] shrink-0" />}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#ECE8E1] bg-[#F7F5EE]">
        <div className="p-2 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#CC6242] text-white flex items-center justify-center shrink-0 font-medium text-xs shadow-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#1F1E1D] truncate leading-tight">
                {user?.full_name || 'Counsel'}
              </p>
              <p className="text-[10px] text-[#6B6861] truncate">
                {user?.onboarding?.role || 'Advocate'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-[#99958D] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
