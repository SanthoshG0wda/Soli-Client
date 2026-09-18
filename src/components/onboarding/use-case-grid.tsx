import React from 'react';
import { Check } from 'lucide-react';
import { OnboardingUseCase } from '@/lib/types';

interface UseCaseGridProps {
  selectedUseCases: string[];
  onToggleUseCase: (useCase: OnboardingUseCase) => void;
}

interface UseCaseItem {
  id: OnboardingUseCase;
  label: string;
  category: string;
}

const USE_CASES: UseCaseItem[] = [
  { id: 'Criminal law research', label: 'Criminal law research', category: 'Specialized' },
  { id: 'Cybercrime research', label: 'Cybercrime research', category: 'Specialized' },
  { id: 'Judgment research', label: 'Judgment research', category: 'Precedents' },
  { id: 'Case preparation', label: 'Case preparation', category: 'Litigation' },
  { id: 'Legal research', label: 'Legal research', category: 'General' },
  { id: 'Drafting assistance', label: 'Drafting assistance', category: 'Litigation' },
  { id: 'Understanding statutes', label: 'Understanding statutes', category: 'Statutory' },
  { id: 'Other', label: 'Other', category: 'Exploration' },
];

export function UseCaseGrid({
  selectedUseCases,
  onToggleUseCase,
}: UseCaseGridProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-stone-500 mb-2">
        Select all areas that align with your day-to-day workflow.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {USE_CASES.map((item) => {
          const isSelected = selectedUseCases.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleUseCase(item.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between select-none ${
                isSelected
                  ? 'bg-[#F9F7FC] border-[#4B3F72] ring-1 ring-[#4B3F72] shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
              }`}
            >
              <div className="min-w-0 pr-2">
                <p className="text-sm font-medium text-stone-900 leading-snug">
                  {item.label}
                </p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {item.category}
                </span>
              </div>

              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#2A2438] border-[#2A2438] text-white'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
