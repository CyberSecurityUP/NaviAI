'use client';

import { useTranslations } from 'next-intl';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { cn } from '@/lib/utils';
import {
  Eye,
  Volume2,
  Hand,
  Gauge,
} from 'lucide-react';

const FONT_SCALE_OPTIONS = [
  { value: 1.0, label: '100%' },
  { value: 1.2, label: '120%' },
  { value: 1.5, label: '150%' },
  { value: 2.0, label: '200%' },
];

export function AccessibilityPanel() {
  const t = useTranslations('Accessibility');
  const {
    fontScale,
    highContrast,
    readAloud,
    easyTouch,
    voiceSpeed,
    setFontScale,
    toggleHighContrast,
    toggleReadAloud,
    toggleEasyTouch,
    setVoiceSpeed,
  } = useAccessibilityStore();

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Font Size */}
      <section>
        <h2 className="text-navi-xl font-bold text-navi-text mb-4">
          {t('fontSize')}
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {FONT_SCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFontScale(option.value)}
              aria-pressed={fontScale === option.value}
              className={cn(
                'min-h-tap flex items-center justify-center rounded-navi',
                'text-navi-lg font-semibold transition-all duration-200',
                'focus-visible:outline focus-visible:outline-3',
                'focus-visible:outline-navi-primary focus-visible:outline-offset-2',
                fontScale === option.value
                  ? 'bg-navi-primary text-white ring-2 ring-navi-primary ring-offset-2'
                  : 'bg-navi-surface text-navi-text border-2 border-navi-surface-hover hover:bg-navi-surface-hover'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* High Contrast Toggle */}
      <section>
        <ToggleOption
          icon={<Eye className="w-6 h-6" />}
          label={t('highContrast')}
          active={highContrast}
          onToggle={toggleHighContrast}
        />
      </section>

      {/* Read Aloud Toggle */}
      <section>
        <ToggleOption
          icon={<Volume2 className="w-6 h-6" />}
          label={t('readAloud')}
          active={readAloud}
          onToggle={toggleReadAloud}
        />
      </section>

      {/* Easy Touch Toggle */}
      <section>
        <ToggleOption
          icon={<Hand className="w-6 h-6" />}
          label={t('easyTouch')}
          active={easyTouch}
          onToggle={toggleEasyTouch}
        />
      </section>

      {/* Voice Speed */}
      <section>
        <h2 className="text-navi-xl font-bold text-navi-text mb-4 flex items-center gap-3">
          <Gauge className="w-6 h-6" />
          {t('voiceSpeed')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setVoiceSpeed('slow')}
            aria-pressed={voiceSpeed === 'slow'}
            className={cn(
              'min-h-tap flex items-center justify-center rounded-navi',
              'text-navi-lg font-semibold transition-all duration-200',
              'focus-visible:outline focus-visible:outline-3',
              'focus-visible:outline-navi-primary focus-visible:outline-offset-2',
              voiceSpeed === 'slow'
                ? 'bg-navi-primary text-white ring-2 ring-navi-primary ring-offset-2'
                : 'bg-navi-surface text-navi-text border-2 border-navi-surface-hover hover:bg-navi-surface-hover'
            )}
          >
            {t('slow')}
          </button>
          <button
            onClick={() => setVoiceSpeed('normal')}
            aria-pressed={voiceSpeed === 'normal'}
            className={cn(
              'min-h-tap flex items-center justify-center rounded-navi',
              'text-navi-lg font-semibold transition-all duration-200',
              'focus-visible:outline focus-visible:outline-3',
              'focus-visible:outline-navi-primary focus-visible:outline-offset-2',
              voiceSpeed === 'normal'
                ? 'bg-navi-primary text-white ring-2 ring-navi-primary ring-offset-2'
                : 'bg-navi-surface text-navi-text border-2 border-navi-surface-hover hover:bg-navi-surface-hover'
            )}
          >
            {t('normal')}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ----- Internal ToggleOption component ----- */

interface ToggleOptionProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleOption({ icon, label, active, onToggle }: ToggleOptionProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      aria-label={label}
      className={cn(
        'w-full min-h-tap flex items-center justify-between gap-4 px-5 py-4',
        'rounded-navi text-navi-lg font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-3',
        'focus-visible:outline-navi-primary focus-visible:outline-offset-2',
        active
          ? 'bg-navi-primary text-white'
          : 'bg-navi-surface text-navi-text border-2 border-navi-surface-hover hover:bg-navi-surface-hover'
      )}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>

      {/* Visual toggle indicator */}
      <span
        className={cn(
          'relative inline-flex h-8 w-14 flex-shrink-0 rounded-full transition-colors duration-200',
          active ? 'bg-white/30' : 'bg-navi-surface-hover'
        )}
      >
        <span
          className={cn(
            'inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-1',
            active ? 'translate-x-7' : 'translate-x-1'
          )}
        />
      </span>
    </button>
  );
}
