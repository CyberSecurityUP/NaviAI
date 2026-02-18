'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSTT } from '@/hooks/useSTT';
import { useChatStore } from '@/stores/chat-store';
import { VoiceVisualizer } from './VoiceVisualizer';

export function MicButton() {
  const t = useTranslations('MainScreen');
  const locale = useLocale();
  const {
    transcript,
    isListening,
    error: sttError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSTT();

  const { sendMessage, isLoading } = useChatStore();
  const hasSentRef = useRef(false);

  // When the user stops speaking and we have a final transcript, send the message
  useEffect(() => {
    if (!isListening && transcript && !hasSentRef.current) {
      hasSentRef.current = true;
      sendMessage(transcript, locale).finally(() => {
        resetTranscript();
        hasSentRef.current = false;
      });
    }
  }, [isListening, transcript, sendMessage, resetTranscript]);

  const handlePress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else if (!isLoading) {
      hasSentRef.current = false;
      resetTranscript();
      startListening(locale === 'en' ? 'en-US' : 'pt-BR');
    }
  }, [isListening, isLoading, startListening, stopListening, resetTranscript]);

  // Determine visual state
  const isProcessing = isLoading;
  const isIdle = !isListening && !isProcessing;

  // Status text shown below the button
  const statusText = isListening
    ? t('listening')
    : isProcessing
      ? t('processing')
      : t('micLabel');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mic button container with visualizer */}
      <div className="relative flex items-center justify-center" style={{ width: '280px', height: '280px' }}>
        {/* Voice visualizer rings shown while listening */}
        {isListening && <VoiceVisualizer />}

        {/* Main button */}
        <button
          type="button"
          onClick={handlePress}
          disabled={isProcessing}
          aria-label={
            isListening
              ? t('listening')
              : isProcessing
                ? t('processing')
                : t('micLabel')
          }
          className={cn(
            'relative z-10 flex items-center justify-center rounded-full',
            'w-40 h-40 md:w-[200px] md:h-[200px]',
            'shadow-lg transition-all duration-300',
            'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4',
            'disabled:cursor-not-allowed',
            // Idle state: blue
            isIdle && [
              'bg-navi-primary',
              'hover:opacity-90 active:scale-95',
              'focus-visible:outline-navi-primary',
            ],
            // Listening state: red with pulse
            isListening && [
              'bg-navi-danger',
              'animate-mic-pulse',
              'active:scale-95',
              'focus-visible:outline-navi-danger',
            ],
            // Processing state: gray with spinner
            isProcessing && [
              'bg-navi-surface-hover',
              'focus-visible:outline-navi-surface-hover',
            ]
          )}
        >
          {isProcessing ? (
            // Spinner
            <div
              className="w-12 h-12 md:w-14 md:h-14 border-4 border-navi-text/20 border-t-navi-primary rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Mic
              className={cn(
                'w-12 h-12 md:w-16 md:h-16',
                isListening ? 'text-white' : 'text-white'
              )}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Status text */}
      <span
        className={cn(
          'text-navi-xl font-medium text-center',
          isListening ? 'text-navi-danger' : 'text-navi-text'
        )}
        aria-live="polite"
      >
        {statusText}
      </span>

      {/* Interim transcript preview */}
      {isListening && transcript && (
        <p
          className="text-navi-lg text-navi-text/70 text-center max-w-sm px-4 italic"
          aria-live="polite"
        >
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {/* STT error */}
      {sttError && (
        <p className="text-navi-base text-navi-danger text-center max-w-sm px-4" role="alert">
          {sttError}
        </p>
      )}
    </div>
  );
}
