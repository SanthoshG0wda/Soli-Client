'use client';

/**
 * Soli Workspace Header Bar.
 *
 * Full-width top navigation providing workspace title editing, auto-save status,
 * undo/redo actions, and user account management.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Columns2,
  LogOut,
  Redo2,
  Undo2,
} from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { useAuth } from '@/contexts/auth-context';

export function WorkspaceTopbar({
  onToggleBoard,
  boardVisible = true,
}: {
  onToggleBoard?: () => void;
  boardVisible?: boolean;
}) {
  const {
    workspaceName,
    setWorkspaceName,
    canUndo,
    canRedo,
    undo,
    redo,
    syncState,
    syncError,
  } = useWorkspace();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const iconBtn =
    'p-1.5 rounded-lg text-[#6B6861] hover:text-[#1F1E1D] hover:bg-[#F1EEE7] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';
  const initial = (user?.full_name?.trim()?.[0] ?? user?.email?.[0] ?? 'C').toUpperCase();

  return (
    <header className="h-12 w-full border-b border-[#E5E0D8] bg-white/90 backdrop-blur px-3.5 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href="/"
          aria-label="Back to home"
          title="Back to home"
          className="p-1.5 rounded-lg text-[#6B6861] hover:text-[#1F1E1D] hover:bg-[#F1EEE7] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-6 h-6 rounded-md bg-[#CC6242] flex items-center justify-center text-white font-serif font-bold text-xs shrink-0 shadow-2xs">
          S
        </div>
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          aria-label="Workspace name"
          className="text-xs font-semibold text-[#1F1E1D] bg-transparent outline-none border-b border-transparent hover:border-[#E5E0D8] focus:border-[#CC6242] transition-colors w-32 sm:w-56 truncate"
        />
        {syncState === 'saving' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-[#B85435] border border-[#E5E0D8] bg-[#FDF8F5] rounded-full px-2 py-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CC6242] animate-pulse" />
            Saving...
          </span>
        )}
        {syncState === 'idle' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 border border-emerald-200 bg-emerald-50/60 rounded-full px-2 py-0.5 shrink-0">
            <Check className="w-3 h-3 text-emerald-600" />
            Saved
          </span>
        )}
        {syncState === 'loading' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-[#6B6861] border border-[#E5E0D8] bg-[#FAF9F5] rounded-full px-2 py-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#99958D] animate-pulse" />
            Loading...
          </span>
        )}
        {syncState === 'error' && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-rose-700 border border-rose-200 bg-rose-50 rounded-full px-2 py-0.5 shrink-0"
            title={syncError ?? 'Failed to save changes'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Sync error
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="hidden sm:flex items-center gap-0.5 mr-1 border-r border-[#E5E0D8] pr-2">
          <button type="button" onClick={undo} disabled={!canUndo} className={iconBtn} aria-label="Undo" title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className={iconBtn} aria-label="Redo" title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {onToggleBoard && (
          <button
            type="button"
            onClick={onToggleBoard}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer mr-1 ${
              boardVisible
                ? 'bg-[#F3EFE7] text-[#1F1E1D] border-[#D8D1C5]'
                : 'bg-white text-[#6B6861] border-[#E5E0D8] hover:text-[#1F1E1D]'
            }`}
            title={boardVisible ? 'Hide Evidence Board' : 'Show Evidence Board'}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{boardVisible ? 'Evidence Board' : 'Show Board'}</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-lg hover:bg-[#F7F5EE] transition-colors cursor-pointer"
            aria-label="Profile menu"
          >
            <span className="w-6 h-6 rounded-full bg-[#1F1E1D] text-white text-[11px] font-semibold flex items-center justify-center">
              {initial}
            </span>
            <ChevronDown className="w-3 h-3 text-[#99958D]" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-xl border border-[#E5E0D8] bg-white shadow-float p-2 animate-fade-in">
                <p className="px-2 pt-1 text-xs font-semibold text-[#1F1E1D] truncate">{user?.full_name ?? 'Counsel'}</p>
                <p className="px-2 pb-2 text-[11px] text-[#99958D] truncate">{user?.email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#6B6861]" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
