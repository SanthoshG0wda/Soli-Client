'use client';

/**
 * Evidence card content — shared by the canvas node and the mobile list.
 * `inCanvas` controls whether React Flow connection handles are rendered.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Copy, MessageSquarePlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { EVIDENCE_KIND_META, type EvidenceKind } from '@/lib/workspace/types';
import { useWorkspace } from './WorkspaceProvider';

interface EvidenceCardProps {
  id: string;
  kind: EvidenceKind;
  title: string;
  excerpt: string;
  reference: string;
  citation?: string;
  selected?: boolean;
  inCanvas?: boolean;
}

export function EvidenceCard({
  id,
  kind,
  title,
  excerpt,
  reference,
  citation,
  selected,
  inCanvas = true,
}: EvidenceCardProps) {
  const { duplicateEvidence, deleteEvidence, askAboutEvidence, updateEvidence } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editExcerpt, setEditExcerpt] = useState(excerpt);
  const [editReference, setEditReference] = useState(reference);
  const titleRef = useRef<HTMLInputElement>(null);
  const meta = EVIDENCE_KIND_META[kind];

  // Focus the title input when entering edit mode
  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    const trimmedTitle = editTitle.trim() || title;
    const trimmedExcerpt = editExcerpt.trim();
    const trimmedReference = editReference.trim();
    // Only update if something actually changed
    if (
      trimmedTitle !== title ||
      trimmedExcerpt !== excerpt ||
      trimmedReference !== reference
    ) {
      updateEvidence(id, {
        title: trimmedTitle,
        excerpt: trimmedExcerpt,
        reference: trimmedReference,
      });
    }
    setEditing(false);
  }, [editTitle, editExcerpt, editReference, id, title, excerpt, reference, updateEvidence]);

  const handleCancel = useCallback(() => {
    setEditTitle(title);
    setEditExcerpt(excerpt);
    setEditReference(reference);
    setEditing(false);
  }, [title, excerpt, reference]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  return (
    <div
      className={`relative rounded-xl border bg-white transition-all h-full ${
        selected
          ? 'border-[#CC6242] ring-2 ring-[#CC6242]/20 shadow-float'
          : 'border-[#E5E0D8] shadow-2xs hover:border-[#D8D1C5] hover:shadow-claude'
      }`}
    >
      {inCanvas && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#CC6242] opacity-0 hover:opacity-100"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#CC6242] opacity-0 hover:opacity-100"
          />
        </>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 ${meta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="nodrag p-1 rounded-md text-[#99958D] hover:text-[#1F1E1D] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
              aria-label="Evidence options"
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
                <div className="nodrag absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-[#E5E0D8] bg-white shadow-float p-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setEditing(true); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#CC6242]" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); askAboutEvidence(id); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-[#CC6242]" />
                    Ask Soli about this
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); duplicateEvidence(id); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#383633] hover:bg-[#F7F5EE] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#6B6861]" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); deleteEvidence(id); }}
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

        {editing ? (
          <div className="mt-2 space-y-2" onKeyDown={handleKeyDown}>
            <input
              ref={titleRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              className="nodrag w-full text-[13px] font-semibold text-[#1F1E1D] leading-snug bg-[#F7F5EE] border border-[#D8D1C5] rounded-lg px-2 py-1 outline-none focus:border-[#CC6242] focus:ring-1 focus:ring-[#CC6242]/30"
            />
            <textarea
              value={editExcerpt}
              onChange={(e) => setEditExcerpt(e.target.value)}
              onBlur={handleSave}
              rows={3}
              className="nodrag w-full text-xs text-[#6B6861] leading-relaxed bg-[#F7F5EE] border border-[#D8D1C5] rounded-lg px-2 py-1 outline-none focus:border-[#CC6242] focus:ring-1 focus:ring-[#CC6242]/30 resize-none"
            />
            <input
              type="text"
              value={editReference}
              onChange={(e) => setEditReference(e.target.value)}
              onBlur={handleSave}
              placeholder="Reference / citation"
              className="nodrag w-full text-[10px] font-mono text-[#6B6861] bg-[#F7F5EE] border border-[#D8D1C5] rounded-lg px-2 py-1 outline-none focus:border-[#CC6242] focus:ring-1 focus:ring-[#CC6242]/30"
            />
            <p className="text-[9px] text-[#99958D]">Enter to save · Esc to cancel</p>
          </div>
        ) : (
          <>
            <h3 className="mt-2 text-[13px] font-semibold text-[#1F1E1D] leading-snug line-clamp-2">{title}</h3>
            <p className="mt-1 text-xs text-[#6B6861] leading-relaxed line-clamp-3">{excerpt}</p>
          </>
        )}

        {!editing && (
          <div className="mt-2.5 pt-2 border-t border-[#ECE8E1] flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-[#99958D] truncate">{citation ?? reference}</span>
          </div>
        )}
      </div>
    </div>
  );
}
