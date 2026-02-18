'use client';

import { Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface NarrationBubbleProps {
  isActive: boolean;
  className?: string;
}

export function NarrationBubble({ isActive, className }: NarrationBubbleProps) {
  const t = useTranslations('Onboarding');

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-navi-primary/10 text-navi-primary',
        'animate-pulse',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Volume2 className="w-5 h-5" />
      <span className="text-navi-base font-medium">{t('narrating')}</span>
    </div>
  );
}
