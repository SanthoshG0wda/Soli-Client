'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { RoleSelector } from '@/components/onboarding/role-selector';
import { UseCaseGrid } from '@/components/onboarding/use-case-grid';
import { SummaryView } from '@/components/onboarding/summary-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingRole, OnboardingUseCase } from '@/lib/types';
import { formatErrorMessage } from '@/lib/api';

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(
    (user?.onboarding?.role as OnboardingRole) || null
  );
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>(
    user?.onboarding?.use_cases || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;

  const handleToggleUseCase = (useCase: OnboardingUseCase) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCase)
        ? prev.filter((item) => item !== useCase)
        : [...prev, useCase]
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !selectedRole) {
      setError('Please select your professional role to proceed.');
      return;
    }
    if (step === 2 && selectedUseCases.length === 0) {
      setError('Please choose at least one use case to proceed.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    if (!selectedRole || selectedUseCases.length === 0) {
      setError('Please ensure role and research use cases are selected.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({
        role: selectedRole,
        use_cases: selectedUseCases,
      });
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  // Step headers
  const getStepHeading = () => {
    switch (step) {
      case 1:
        return {
          title: "Let's personalize Soli",
          subtitle: 'What best describes your role in the legal system?',
        };
      case 2:
        return {
          title: 'What do you use Soli for?',
          subtitle: 'Select the legal workflows and intelligence capabilities you need.',
        };
      case 3:
        return {
          title: "You're ready to use Soli",
          subtitle: 'Review your personalized configuration before entering your workspace.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getStepHeading();

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#2A2438] flex items-center justify-center text-white font-serif font-bold text-base shadow-xs">
            S
          </div>
          <span className="font-serif tracking-tight text-lg font-bold text-stone-900">
            Soli
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {subtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
            >
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Role */}
          {step === 1 && (
            <RoleSelector
              selectedRole={selectedRole}
              onSelectRole={(role) => {
                setSelectedRole(role);
                setError(null);
              }}
            />
          )}

          {/* Step 2: Use Cases */}
          {step === 2 && (
            <UseCaseGrid
              selectedUseCases={selectedUseCases}
              onToggleUseCase={(uc) => {
                handleToggleUseCase(uc);
                setError(null);
              }}
            />
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <SummaryView
              userName={user?.full_name}
              userEmail={user?.email}
              role={selectedRole || 'Unspecified'}
              useCases={selectedUseCases}
            />
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-stone-100">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedRole) ||
                  (step === 2 && selectedUseCases.length === 0)
                }
                className="cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                onClick={handleFinalSubmit}
                className="cursor-pointer bg-[#2A2438] hover:bg-[#1E1929]"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Start using Soli
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
