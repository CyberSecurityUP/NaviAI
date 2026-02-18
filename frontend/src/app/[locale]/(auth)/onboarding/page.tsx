'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Volume2,
  Check,
} from 'lucide-react';

import { useTTS } from '@/hooks/useTTS';
import { useNarration } from '@/hooks/useNarration';
import { useAuthStore } from '@/stores/auth-store';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { BigButton } from '@/components/ui/BigButton';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { NarrationBubble } from '@/components/onboarding/NarrationBubble';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const { isSpeaking } = useTTS();

  // Auth store
  const { register, isLoading, error: authError, clearError } = useAuthStore();

  // Accessibility store
  const { toggleReadAloud, toggleHighContrast, toggleEasyTouch, readAloud } =
    useAccessibilityStore();

  // Form state - persisted across steps so data is never lost
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Narration texts for each step
  const narrations = [
    t('welcome'),
    t('nameStep'),
    t('emailStep'),
    t('passwordStep'),
    t('done') + ' ' + t('accessibilityQuestion'),
  ];

  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    narrateCurrentStep,
  } = useNarration(narrations, true);

  // Validation per step
  const validateCurrentStep = useCallback((): boolean => {
    setLocalError(null);
    clearError();

    switch (currentStep) {
      case 0:
        // Welcome step - no validation
        return true;
      case 1:
        // Name step
        if (!displayName.trim()) {
          setLocalError(t('nameLabel'));
          return false;
        }
        return true;
      case 2:
        // Email step
        if (!email.trim() || !email.includes('@')) {
          setLocalError(t('emailLabel'));
          return false;
        }
        return true;
      case 3:
        // Password step
        if (password.length < 8) {
          setLocalError(t('errorPasswordShort'));
          return false;
        }
        return true;
      case 4:
        // Accessibility step - no validation
        return true;
      default:
        return true;
    }
  }, [currentStep, displayName, email, password, t, clearError]);

  // Handle next with validation
  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      nextStep();
    }
  }, [validateCurrentStep, nextStep]);

  // Handle finish - register the account
  const handleFinish = useCallback(async () => {
    setLocalError(null);
    clearError();

    // Apply accessibility settings if enabled
    if (accessibilityEnabled) {
      if (!readAloud) toggleReadAloud();
      toggleHighContrast();
      toggleEasyTouch();
    }

    try {
      await register(email, password, displayName);
      router.push('/');
    } catch (err) {
      // The auth store already sets its own error,
      // but we provide a user-friendly fallback
      if (err instanceof Error && err.message.includes('exists')) {
        setLocalError(t('errorEmailExists'));
      } else {
        setLocalError(t('errorGeneric'));
      }
    }
  }, [
    accessibilityEnabled,
    readAloud,
    toggleReadAloud,
    toggleHighContrast,
    toggleEasyTouch,
    register,
    email,
    password,
    displayName,
    router,
    clearError,
    t,
  ]);

  // Display error from auth store or local validation
  const displayError = localError || (authError ? t('errorGeneric') : null);

  // Shared input styling
  const inputClassName =
    'w-full min-h-[56px] px-4 py-4 text-navi-xl rounded-navi border-2 ' +
    'border-navi-surface-hover bg-navi-surface text-navi-text ' +
    'focus:border-navi-primary focus:outline-none transition-colors ' +
    'placeholder:text-navi-text/40';

  return (
    <OnboardingWizard
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrev={prevStep}
      onFinish={handleFinish}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isLoading={isLoading}
    >
      {/* Narration bubble */}
      <div className="mb-4 flex justify-center">
        <NarrationBubble isActive={isSpeaking} />
      </div>

      {/* Re-read button */}
      <button
        type="button"
        onClick={narrateCurrentStep}
        className="mb-6 inline-flex items-center gap-2 px-3 py-2 text-navi-base
                   text-navi-primary hover:text-navi-primary/80 transition-colors
                   rounded-navi focus-visible:outline focus-visible:outline-3
                   focus-visible:outline-navi-primary focus-visible:outline-offset-2"
        aria-label={t('narrating')}
      >
        <Volume2 className="w-5 h-5" />
      </button>

      {/* Error message */}
      {displayError && (
        <div
          role="alert"
          className="mb-6 w-full max-w-sm p-4 rounded-navi bg-navi-danger/10
                     border border-navi-danger/30 text-navi-danger text-navi-base text-center"
        >
          {displayError}
        </div>
      )}

      {/* Step 0: Welcome */}
      {currentStep === 0 && (
        <OnboardingStep
          title={t('welcomeTitle')}
          icon={<Volume2 className="w-16 h-16" />}
        >
          <p className="text-navi-lg text-navi-text/70 leading-relaxed">
            {t('welcome')}
          </p>
        </OnboardingStep>
      )}

      {/* Step 1: Name */}
      {currentStep === 1 && (
        <OnboardingStep
          title={t('nameStep')}
          icon={<User className="w-14 h-14" />}
        >
          <label htmlFor="onboarding-name" className="sr-only">
            {t('nameLabel')}
          </label>
          <input
            id="onboarding-name"
            type="text"
            autoComplete="name"
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClassName}
            placeholder={t('nameLabel')}
          />
        </OnboardingStep>
      )}

      {/* Step 2: Email */}
      {currentStep === 2 && (
        <OnboardingStep
          title={t('emailStep')}
          icon={<Mail className="w-14 h-14" />}
        >
          <label htmlFor="onboarding-email" className="sr-only">
            {t('emailLabel')}
          </label>
          <input
            id="onboarding-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
            placeholder={t('emailLabel')}
          />
        </OnboardingStep>
      )}

      {/* Step 3: Password */}
      {currentStep === 3 && (
        <OnboardingStep
          title={t('passwordStep')}
          icon={<Lock className="w-14 h-14" />}
        >
          <div className="relative">
            <label htmlFor="onboarding-password" className="sr-only">
              {t('passwordLabel')}
            </label>
            <input
              id="onboarding-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName + ' pr-16'}
              placeholder={t('passwordLabel')}
              minLength={8}
            />
            {/* Show/hide password toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px]
                         flex items-center justify-center rounded-navi
                         text-navi-text/60 hover:text-navi-primary transition-colors
                         focus-visible:outline focus-visible:outline-3
                         focus-visible:outline-navi-primary focus-visible:outline-offset-2"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
          </div>
        </OnboardingStep>
      )}

      {/* Step 4: Accessibility */}
      {currentStep === 4 && (
        <OnboardingStep
          title={t('accessibilityQuestion')}
          icon={<Check className="w-14 h-14" />}
        >
          <button
            type="button"
            onClick={() => setAccessibilityEnabled(!accessibilityEnabled)}
            role="switch"
            aria-checked={accessibilityEnabled}
            className={
              'w-full min-h-[56px] flex items-center justify-between px-6 py-4 ' +
              'rounded-navi border-2 transition-all duration-200 text-navi-lg font-medium ' +
              (accessibilityEnabled
                ? 'bg-navi-primary/10 border-navi-primary text-navi-primary'
                : 'bg-navi-surface border-navi-surface-hover text-navi-text')
            }
          >
            <span>{accessibilityEnabled ? t('done') : t('accessibilityQuestion')}</span>
            <div
              className={
                'w-14 h-8 rounded-full relative transition-colors duration-200 ' +
                (accessibilityEnabled ? 'bg-navi-primary' : 'bg-navi-surface-hover')
              }
            >
              <div
                className={
                  'absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ' +
                  (accessibilityEnabled ? 'translate-x-7' : 'translate-x-1')
                }
              />
            </div>
          </button>
        </OnboardingStep>
      )}
    </OnboardingWizard>
  );
}
