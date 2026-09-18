'use client';

/**
 * Minimal markdown renderer for Soli responses.
 * Supports headings, bold, italic, inline code, bullet/numbered lists,
 * blockquotes. No external dependency — keeps the workspace bundle small.
 */

import React from 'react';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={`${keyPrefix}-${i}`} className="font-semibold text-[#1F1E1D]">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('*')) {
      parts.push(<em key={`${keyPrefix}-${i}`}>{tok.slice(1, -1)}</em>);
    } else {
      parts.push(
        <code key={`${keyPrefix}-${i}`} className="font-mono text-[11px] bg-[#F7F5EE] border border-[#E5E0D8] rounded px-1 py-px">{tok.slice(1, -1)}</code>,
      );
    }
    i += 1;
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuffer) return;
    const { ordered, items } = listBuffer;
    listBuffer = null;
    if (ordered) {
      blocks.push(
        <ol key={key++} className="list-decimal list-outside ml-4 space-y-1 text-[13px] leading-relaxed text-[#383633]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `ol-${key}-${idx}`)}</li>)}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={key++} className="list-disc list-outside ml-4 space-y-1 text-[13px] leading-relaxed text-[#383633]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `ul-${key}-${idx}`)}</li>)}
        </ul>,
      );
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(<h4 key={key++} className="font-serif text-[14px] font-bold text-[#1F1E1D] pt-1">{renderInline(trimmed.slice(4), `h-${key}`)}</h4>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(<h3 key={key++} className="font-serif text-[15px] font-bold text-[#1F1E1D] pt-1">{renderInline(trimmed.slice(3), `h-${key}`)}</h3>);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(<h2 key={key++} className="font-serif text-base font-bold text-[#1F1E1D] pt-1">{renderInline(trimmed.slice(2), `h-${key}`)}</h2>);
    } else if (/^(\-|\*) /.test(trimmed)) {
      const item = trimmed.replace(/^(\-|\*) /, '');
      if (!listBuffer || listBuffer.ordered) { flushList(); listBuffer = { ordered: false, items: [] }; }
      listBuffer.items.push(item);
    } else if (/^\d+\. /.test(trimmed)) {
      const item = trimmed.replace(/^\d+\. /, '');
      if (!listBuffer || !listBuffer.ordered) { flushList(); listBuffer = { ordered: true, items: [] }; }
      listBuffer.items.push(item);
    } else if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote key={key++} className="border-l-2 border-[#CC6242]/50 pl-2.5 text-[13px] italic text-[#6B6861] leading-relaxed">
          {renderInline(trimmed.slice(2), `q-${key}`)}
        </blockquote>,
      );
    } else if (trimmed === '') {
      flushList();
      blocks.push(<div key={key++} className="h-1.5" />);
    } else {
      flushList();
      blocks.push(<p key={key++} className="text-[13px] leading-relaxed text-[#383633]">{renderInline(trimmed, `p-${key}`)}</p>);
    }
  }
  flushList();

  return <div className="space-y-1">{blocks}</div>;
}
