'use client';

/**
 * Floating "+ Add" action menu — creates evidence nodes on the board
 * using local workspace state (no server persistence yet).
 */

import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  Scale,
  ScrollText,
  StickyNote,
  X,
} from 'lucide-react';
import type { EvidenceKind } from '@/lib/workspace/types';
import { useWorkspace } from './WorkspaceProvider';

const OPTIONS: { kind: EvidenceKind; label: string; icon: React.ReactNode }[] = [
  { kind: 'source', label: 'Add Source', icon: <BookOpen className="w-4 h-4" /> },
  { kind: 'judgment', label: 'Add Judgment', icon: <Scale className="w-4 h-4" /> },
  { kind: 'statute', label: 'Add Provision', icon: <ScrollText className="w-4 h-4" /> },
  { kind: 'document', label: 'Add Document', icon: <FileText className="w-4 h-4" /> },
  { kind: 'note', label: 'Add Note', icon: <StickyNote className="w-4 h-4" /> },
];

export function AddEvidenceMenu() {
  const { addEvidence } = useWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-4 bottom-12 z-10 flex flex-col items-end gap-2">
      {open && (
        <div className="w-48 rounded-2xl border border-[#E5E0D8] bg-white shadow-float p-1.5 animate-fade-in">
          <p className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#99958D]">
            Add to Evidence Board
          </p>
          {OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => {
                addEvidence(opt.kind);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium text-[#383633] hover:bg-[#F7F5EE] hover:text-[#1F1E1D] transition-colors cursor-pointer"
            >
              <span className="text-[#CC6242]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 pl-4 pr-4 py-2.5 rounded-2xl text-sm font-semibold shadow-float transition-all cursor-pointer ${
          open
            ? 'bg-[#1F1E1D] text-white hover:bg-black'
            : 'bg-[#CC6242] text-white hover:bg-[#B85435]'
        }`}
        aria-label={open ? 'Close add menu' : 'Add evidence'}
      >
        {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
        Add
      </button>
    </div>
  );
}
