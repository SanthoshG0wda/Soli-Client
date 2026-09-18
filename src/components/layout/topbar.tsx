'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  // Desktop needs no bar — the homepage is a single centered column.
  // Mobile keeps a slim header with the menu button.
  return (
    <header className="md:hidden shrink-0 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E5E0D8]">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 -ml-1 rounded-lg text-[#524E48] hover:bg-[#F5F2EC] transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CC6242] flex items-center justify-center text-white font-serif font-bold text-sm">
              S
            </div>
            <span className="font-serif font-bold text-[#1F1E1D] text-base">Soli</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
