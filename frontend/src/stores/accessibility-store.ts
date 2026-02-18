'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  fontScale: number;
  highContrast: boolean;
  readAloud: boolean;
  easyTouch: boolean;
  voiceSpeed: 'slow' | 'normal';
}

interface AccessibilityActions {
  setFontScale: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleReadAloud: () => void;
  toggleEasyTouch: () => void;
  setVoiceSpeed: (speed: 'slow' | 'normal') => void;
}

type AccessibilityStore = AccessibilityState & AccessibilityActions;

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      fontScale: 1,
      highContrast: false,
      readAloud: false,
      easyTouch: false,
      voiceSpeed: 'normal',

      setFontScale: (scale: number) => set({ fontScale: scale }),
      toggleHighContrast: () =>
        set((state) => ({ highContrast: !state.highContrast })),
      toggleReadAloud: () =>
        set((state) => ({ readAloud: !state.readAloud })),
      toggleEasyTouch: () =>
        set((state) => ({ easyTouch: !state.easyTouch })),
      setVoiceSpeed: (speed: 'slow' | 'normal') => set({ voiceSpeed: speed }),
    }),
    {
      name: 'navi-accessibility',
    }
  )
);
