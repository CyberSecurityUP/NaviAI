'use client';

import { useTranslations } from 'next-intl';
import { Volume2, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepByStep } from './StepByStep';
import type { ChatMessage } from '@/stores/chat-store';

interface ResponseCardProps {
  message: ChatMessage;
  onListen: (text: string) => void;
  onOpenVideo?: (url: string) => void;
}

export function ResponseCard({ message, onListen, onOpenVideo }: ResponseCardProps) {
  const t = useTranslations('ResponseCard');

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="max-w-[85%] bg-navi-primary text-white rounded-navi rounded-br-sm
                      px-5 py-4 text-navi-lg"
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div
        className="w-full max-w-[95%] bg-navi-surface border border-navi-surface-hover
                    rounded-navi rounded-bl-sm px-5 py-5 flex flex-col gap-4"
      >
        {/* Response content */}
        {message.hasSteps ? (
          <StepByStep content={message.content} />
        ) : (
          <p className="text-navi-lg text-navi-text leading-relaxed whitespace-pre-line">
            {message.content}
          </p>
        )}

        {/* Video suggestion */}
        {message.suggestedVideo && (
          <div className="bg-navi-primary-light rounded-navi p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-navi-primary flex-shrink-0" aria-hidden="true" />
              <span className="text-navi-base font-semibold text-navi-text">
                {message.suggestedVideo.title}
              </span>
            </div>
            {message.suggestedVideo.channel_name && (
              <span className="text-navi-sm text-navi-text/60">
                {message.suggestedVideo.channel_name}
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpenVideo?.(message.suggestedVideo!.url)}
              className={cn(
                'min-h-tap flex items-center justify-center gap-2',
                'bg-navi-primary text-white rounded-navi px-4 py-3',
                'text-navi-base font-semibold',
                'hover:opacity-90 active:scale-[0.98] transition-all',
                'focus-visible:outline focus-visible:outline-3 focus-visible:outline-navi-primary focus-visible:outline-offset-2'
              )}
            >
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
              {t('openVideo')}
            </button>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="border-t border-navi-surface-hover pt-3">
            {message.sources.map((source, idx) => (
              <p key={idx} className="text-navi-sm text-navi-text/50 leading-relaxed">
                <span className="font-medium">{t('source')}:</span> {source.title}
              </p>
            ))}
          </div>
        )}

        {/* Listen button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onListen(message.content)}
            aria-label={t('listen')}
            className={cn(
              'min-h-tap min-w-tap flex items-center gap-2 px-4 py-2',
              'rounded-navi text-navi-base font-medium',
              'text-navi-primary bg-navi-primary-light',
              'hover:opacity-80 active:scale-[0.98] transition-all',
              'focus-visible:outline focus-visible:outline-3 focus-visible:outline-navi-primary focus-visible:outline-offset-2'
            )}
          >
            <Volume2 className="w-5 h-5" aria-hidden="true" />
            {t('listen')}
          </button>
        </div>
      </div>
    </div>
  );
}
