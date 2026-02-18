'use client';

import { useEffect } from 'react';
import { useAccessibilityStore } from '@/stores/accessibility-store';

export function AccessibilityApplier() {
  const { fontScale, highContrast, easyTouch } = useAccessibilityStore();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--navi-font-scale', String(fontScale));
    root.setAttribute('data-high-contrast', String(highContrast));
    root.setAttribute('data-easy-touch', String(easyTouch));
  }, [fontScale, highContrast, easyTouch]);

  return null;
}
