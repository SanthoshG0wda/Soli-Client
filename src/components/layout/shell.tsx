'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface ShellProps {
  children: React.ReactNode;
  onNewTask?: () => void;
}

export function Shell({
  children,
  onNewTask,
}: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F5]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar
          onNewTask={onNewTask}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <button
            aria-label="Close menu"
            className="fixed inset-0 bg-[#1F1E1D]/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-68 h-full bg-[#F7F5EE] z-10 shadow-2xl animate-fade-in">
            <Sidebar
              onCloseMobile={() => setMobileMenuOpen(false)}
              onNewTask={onNewTask}
            />
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-[#FAF9F5]">
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#FAF9F5] relative">
          <div className="h-full relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
