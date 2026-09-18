'use client';

/**
 * ResizeDivider — a draggable vertical handle for resizing split panels.
 *
 * Usage: place between two sibling flex containers. Drag left/right to
 * adjust the `leftWidth` percentage via the provided setter.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeDividerProps {
  /** Setter that receives the new left-panel width percentage. */
  setLeftWidth: (w: string) => void;
  /** Minimum left-panel width in px (default 320). */
  minLeft?: number;
  /** Minimum right-panel width in px (default 360). */
  minRight?: number;
  /** Optional extra class names. */
  className?: string;
}

export function ResizeDivider({
  setLeftWidth,
  minLeft = 320,
  minRight = 360,
  className,
}: ResizeDividerProps) {
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const pct = (mouseX / containerWidth) * 100;
      const minPct = (minLeft / containerWidth) * 100;
      const maxPct = 100 - (minRight / containerWidth) * 100;
      const clamped = Math.min(Math.max(pct, minPct), maxPct);
      setLeftWidth(`${clamped}%`);
    };

    const onMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, minLeft, minRight, setLeftWidth]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative flex items-center justify-center shrink-0 z-20 group ${className ?? ''}`}
      style={{ width: 6, cursor: 'col-resize' }}
    >
      {/* Visible track */}
      <div
        className={`absolute inset-y-0 left-1/2 -translate-x-1/2 transition-colors ${
          dragging
            ? 'w-[3px] bg-[#CC6242]'
            : 'w-px bg-[#E5E0D8] group-hover:bg-[#CC6242]/50 group-hover:w-[3px]'
        }`}
      />
      {/* Grab area — wider invisible hit target */}
      <div
        className={`absolute inset-y-0 -left-1 -right-1 ${
          dragging ? 'bg-[#CC6242]/10' : ''
        }`}
      />
    </div>
  );
}
