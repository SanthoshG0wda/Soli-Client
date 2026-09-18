import React from 'react';
import { Briefcase, GraduationCap, Search, Scale, HelpCircle } from 'lucide-react';
import { OnboardingRole } from '@/lib/types';

interface RoleSelectorProps {
  selectedRole: string | null;
  onSelectRole: (role: OnboardingRole) => void;
}

interface RoleOption {
  id: OnboardingRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ROLES: RoleOption[] = [
  {
    id: 'Advocate / Lawyer',
    title: 'Advocate / Lawyer',
    description: 'Active practitioner in High Courts, Supreme Court, or Trial Courts.',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    id: 'Law Student',
    title: 'Law Student',
    description: 'Enrolled in LL.B., B.A. LL.B., or post-graduate law curriculum.',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    id: 'Legal Researcher',
    title: 'Legal Researcher',
    description: 'Academic, judicial clerk, or policy analyst performing case studies.',
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: 'Legal Professional',
    title: 'Legal Professional',
    description: 'Corporate legal counsel, compliance officer, or firm associate.',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: 'Other',
    title: 'Other',
    description: 'Interested in Indian statutory frameworks and case precedents.',
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {ROLES.map((role) => {
        const isSelected = selectedRole === role.id;

        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
              isSelected
                ? 'bg-[#F9F7FC] border-[#4B3F72] ring-1 ring-[#4B3F72] shadow-xs'
                : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#2A2438] text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {role.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">
                  {role.title}
                </p>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-[#4B3F72] bg-[#4B3F72]'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {role.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
