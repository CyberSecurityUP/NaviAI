'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

const FAQ_KEYS = [
  'howToSpeak',
  'howToCamera',
  'whatIsAccessibility',
  'howToCreateAccount',
] as const;

export default function HelpPage() {
  const t = useTranslations('Help');
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = useCallback(
    (index: number) => {
      setOpenIndex((prev) => (prev === index ? null : index));
    },
    []
  );

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

        {/* FAQ Accordion */}
        <div className="w-full max-w-lg flex flex-col gap-4">
          {FAQ_KEYS.map((key, index) => (
            <div
              key={key}
              className="rounded-navi bg-navi-surface border-2 border-navi-surface-hover
                         overflow-hidden transition-all duration-200"
            >
              {/* Question (tappable) */}
              <button
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                className={cn(
                  'w-full min-h-tap flex items-center justify-between gap-3',
                  'px-5 py-4 text-left',
                  'text-navi-lg font-semibold text-navi-text',
                  'hover:bg-navi-surface-hover transition-colors',
                  'focus-visible:outline focus-visible:outline-3',
                  'focus-visible:outline-navi-primary focus-visible:outline-offset-2'
                )}
              >
                <span className="flex-1">{t(`${key}.question`)}</span>
                <ChevronDown
                  className={cn(
                    'w-6 h-6 flex-shrink-0 text-navi-primary transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>

              {/* Answer (collapsible) */}
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  openIndex === index
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                )}
              >
                <div className="px-5 pb-5 pt-1">
                  <p className="text-navi-base text-navi-text/80 leading-relaxed">
                    {t(`${key}.answer`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
