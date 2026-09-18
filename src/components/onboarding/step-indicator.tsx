import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full flex items-center justify-between mb-8" aria-label="Onboarding progress">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all ${
                  isCompleted
                    ? 'bg-[#2A2438] text-white'
                    : isCurrent
                    ? 'bg-[#2A2438] text-white ring-4 ring-[#2A2438]/10'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={`w-8 sm:w-12 h-0.5 rounded-full transition-colors ${
                    stepNumber < currentStep ? 'bg-[#2A2438]' : 'bg-stone-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <span className="text-xs font-mono tracking-wider uppercase text-stone-500">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
