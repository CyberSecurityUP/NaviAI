'use client';

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TopBar() {
  const t = useTranslations('MainScreen');
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-navi-surface border-b border-navi-surface-hover">
      <div className="flex items-center gap-2">
        <span className="text-navi-2xl font-bold text-navi-primary">
          NaviAI
        </span>
      </div>
      <button
        onClick={() => router.push('/settings')}
        aria-label={t('accessibilityLabel')}
        className="min-w-tap min-h-tap flex items-center justify-center rounded-navi
                   text-navi-text hover:bg-navi-surface-hover transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>
    </header>
  );
}
