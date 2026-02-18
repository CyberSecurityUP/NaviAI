'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { BigButton } from '@/components/ui/BigButton';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
}

export function OnboardingWizard({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onFinish,
  isFirstStep,
  isLastStep,
  isLoading = false,
}: OnboardingWizardProps) {
  const t = useTranslations('Onboarding');

  return (
    <div className="flex flex-col min-h-screen bg-navi-bg">
      {/* Step progress indicator */}
      <div className="flex items-center justify-center gap-2 px-4 pt-6 pb-2">
        <span className="text-navi-base text-navi-text/60 font-medium">
          {t('step')} {currentStep + 1} {t('of')} {totalSteps}
        </span>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 px-4 pb-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === currentStep
                ? 'w-8 bg-navi-primary'
                : index < currentStep
                  ? 'w-2 bg-navi-primary/50'
                  : 'w-2 bg-navi-surface-hover'
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Step content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {children}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4 px-6 pb-8 pt-4">
        {/* Back button - hidden on first step */}
        {!isFirstStep ? (
          <BigButton
            icon={<ArrowLeft className="w-6 h-6" />}
            label={t('previous')}
            onClick={onPrev}
            variant="secondary"
            disabled={isLoading}
            className="flex-1"
          />
        ) : (
          <div className="flex-1" />
        )}

        {/* Next / Finish button */}
        {isLastStep ? (
          <BigButton
            icon={<Check className="w-6 h-6" />}
            label={t('finish')}
            onClick={onFinish}
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          />
        ) : (
          <BigButton
            icon={<ArrowRight className="w-6 h-6" />}
            label={t('next')}
            onClick={onNext}
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
