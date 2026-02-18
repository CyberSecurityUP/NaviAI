'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { apiClient } from '@/lib/api-client';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const router = useRouter();

  const {
    fontScale,
    highContrast,
    readAloud,
    easyTouch,
    voiceSpeed,
  } = useAccessibilityStore();

  // Debounced save to server
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const saveToServer = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiClient.updateAccessibility({
          font_scale: fontScale,
          high_contrast: highContrast,
          read_aloud: readAloud,
          easy_touch: easyTouch,
          voice_speed: voiceSpeed,
        });
      } catch {
        // Silently fail - settings are persisted locally anyway
      }
    }, 1000);
  }, [fontScale, highContrast, readAloud, easyTouch, voiceSpeed]);

  useEffect(() => {
    // Skip saving on first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    saveToServer();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fontScale, highContrast, readAloud, easyTouch, voiceSpeed, saveToServer]);

  return (
    <>
      <TopBar />
      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        {/* Back button */}
        <div className="w-full max-w-lg pt-4 pb-2">
          <button
            onClick={() => router.back()}
            aria-label={t('back')}
            className="min-w-tap min-h-tap flex items-center gap-2 text-navi-primary
                       text-navi-lg font-medium rounded-navi px-2 py-2
                       hover:bg-navi-surface-hover transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>{t('back')}</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-navi-2xl font-bold text-navi-text mb-8">
          {t('title')}
        </h1>

        {/* Accessibility panel */}
        <div className="w-full max-w-lg">
          <AccessibilityPanel />
        </div>
      </main>
    </>
  );
}
