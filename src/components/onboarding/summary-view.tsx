import React from 'react';
import { User, Scale, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SummaryViewProps {
  userName?: string;
  userEmail?: string;
  role: string;
  useCases: string[];
}

export function SummaryView({
  userName,
  userEmail,
  role,
  useCases,
}: SummaryViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Confirmation Banner */}
      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-emerald-900">
            Workspace Configuration Ready
          </h2>
          <p className="text-xs text-emerald-700/90 mt-0.5 leading-relaxed">
            Your profile has been configured for Indian legal intelligence and statutory analysis.
          </p>
        </div>
      </div>

      {/* Details Box */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-4.5 flex flex-col gap-4">
        {/* User identification */}
        <div className="flex items-center gap-3 pb-3 border-b border-stone-200/80">
          <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {userName || 'Legal Professional'}
            </p>
            <p className="text-xs text-stone-500 truncate">{userEmail}</p>
          </div>
        </div>

        {/* Selected Role */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1 font-medium">
            <Scale className="w-3.5 h-3.5" />
            <span>Designated Role</span>
          </div>
          <p className="text-sm font-semibold text-stone-900">
            {role}
          </p>
        </div>

        {/* Selected Use Cases */}
        <div>
          <p className="text-xs text-stone-500 mb-2 font-medium">
            Research Workflows ({useCases.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {useCases.map((uc) => (
              <Badge key={uc} variant="accent">
                {uc}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
