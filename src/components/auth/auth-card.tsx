import React from 'react';
import Link from 'next/link';
import { Sparkles, AlertCircle } from 'lucide-react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  errorMessage?: string | null;
  children: React.ReactNode;
  footerPrompt?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export function AuthCard({
  title,
  subtitle,
  errorMessage,
  children,
  footerPrompt,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#FAF9F5] text-[#1F1E1D]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#CC6242] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif tracking-tight text-xl font-bold text-[#1F1E1D]">
                Soli
              </span>
              <span className="text-[10px] font-mono tracking-wider text-[#6B6861] -mt-0.5">
                Cowork Workspace
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-[#1F1E1D] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#6B6861] mt-1">
            {subtitle}
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-7 sm:p-8 shadow-claude">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {children}
        </div>

        {/* Footer Link */}
        {footerPrompt && footerLinkText && footerLinkHref && (
          <p className="text-center text-xs text-[#6B6861] mt-6">
            {footerPrompt}{' '}
            <Link
              href={footerLinkHref}
              className="font-medium text-[#CC6242] hover:text-[#B85435] underline underline-offset-4 decoration-[#CC6242]/40 hover:decoration-[#CC6242] transition-colors"
            >
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
