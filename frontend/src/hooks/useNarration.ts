'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTTS } from '@/hooks/useTTS';

interface UseNarrationReturn {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  narrateCurrentStep: () => void;
}

export function useNarration(
  narrations: string[],
  autoNarrate: boolean = true
): UseNarrationReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const { speak, stop } = useTTS();
  const totalSteps = narrations.length;
  const prevStepRef = useRef<number>(-1);

  const narrateCurrentStep = useCallback(() => {
    const text = narrations[currentStep];
    if (text) {
      speak(text);
    }
  }, [currentStep, narrations, speak]);

  // Auto-narrate when step changes
  useEffect(() => {
    if (autoNarrate && prevStepRef.current !== currentStep) {
      // Small delay to let the UI render before speaking
      const timeout = setTimeout(() => {
        narrateCurrentStep();
      }, 300);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timeout);
    }
  }, [currentStep, autoNarrate, narrateCurrentStep]);

  const nextStep = useCallback(() => {
    stop();
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [stop, totalSteps]);

  const prevStep = useCallback(() => {
    stop();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [stop]);

  return {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    narrateCurrentStep,
  };
}
