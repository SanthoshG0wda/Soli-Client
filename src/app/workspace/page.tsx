'use client';

/**
 * /workspace — Soli Legal Research Workspace.
 *
 * Split Layout:
 * - Left: Normal Chat View (linear conversational stream, citations, rich markdown).
 * - Right: Fixed Evidence Board with dedicated infinite canvas (statutes, judgments, notes, connecting edges).
 * - Top: Full-width Workspace Header (title, auto-save persistence status, undo/redo).
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronsRight } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkspaceProvider, useWorkspace } from '@/components/workspace/canvas/WorkspaceProvider';
import { WorkspaceCanvas } from '@/components/workspace/canvas/workspace-canvas';
import { WorkspaceTopbar } from '@/components/workspace/canvas/workspace-topbar';
import { NormalChatView } from '@/components/workspace/chat/normal-chat-view';
import { MobileWorkspace } from '@/components/workspace/canvas/mobile-workspace';
import { ResizeDivider } from '@/components/workspace/canvas/resize-divider';
import { Sidebar } from '@/components/layout/sidebar';

/** Picks up ?q= from the homepage prompt and researches it once. */
function DeepLinkHandler() {
  const searchParams = useSearchParams();
  const { sendComposer } = useWorkspace();
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    const q = searchParams.get('q')?.trim();
    if (!q) return;
    consumed.current = true;
    sendComposer(q);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, sendComposer]);

  return null;
}

export default function WorkspacePage({ workspaceId }: { workspaceId?: string } = {}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [boardVisible, setBoardVisible] = useState(true);
  const [splitWidth, setSplitWidth] = useState('55%');

  return (
    <WorkspaceProvider initialWorkspaceId={workspaceId}>
      <ReactFlowProvider>
        <Suspense fallback={null}>
          <DeepLinkHandler />
        </Suspense>
        <div className="h-dvh w-screen overflow-hidden bg-[#FAF9F5] text-[#1F1E1D] flex flex-col relative">
          {/* Full-width Workspace Topbar */}
          <WorkspaceTopbar
            onToggleBoard={() => setBoardVisible((v) => !v)}
            boardVisible={boardVisible}
          />

          {/* Body: Sidebar + Split Workspace */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* Collapsible Workspace Sidebar */}
            <div
              className={`shrink-0 h-full overflow-hidden transition-[width] duration-200 border-r border-[#E5E0D8] ${
                sidebarCollapsed ? 'w-0' : 'w-64'
              }`}
            >
              <div className="w-64 h-full">
                <Sidebar onShrink={() => setSidebarCollapsed(true)} />
              </div>
            </div>

            {/* Desktop Split View: Normal Chat (Left) + Evidence Board Infinite Canvas (Right) */}
            <div className="hidden md:flex flex-1 min-w-0 h-full relative">
              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                  className="absolute left-3 top-3 z-30 p-1.5 rounded-lg bg-white/95 backdrop-blur border border-[#E5E0D8] shadow-claude text-[#6B6861] hover:text-[#1F1E1D] transition-colors cursor-pointer animate-fade-in"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              )}

              {/* Normal Chat View (Left / Center) */}
              <div
                className="h-full min-w-0 flex flex-col relative bg-[#FAF9F5]"
                style={{ width: boardVisible ? splitWidth : '100%' }}
              >
                <NormalChatView />
              </div>

              {/* Draggable Resize Divider */}
              {boardVisible && (
                <ResizeDivider
                  setLeftWidth={setSplitWidth}
                  minLeft={320}
                  minRight={360}
                />
              )}

              {/* Evidence Board with Infinite Canvas (Right) */}
              {boardVisible && (
                <div className="flex-1 min-w-[360px] h-full flex flex-col border-l border-[#E5E0D8] relative shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                  <WorkspaceCanvas />
                </div>
              )}
            </div>

            {/* Mobile Companion View */}
            <div className="md:hidden flex-1 h-full w-full relative">
              <MobileWorkspace />
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </WorkspaceProvider>
  );
}
