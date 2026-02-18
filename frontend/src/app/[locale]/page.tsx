'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, HelpCircle, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { BigButton } from '@/components/ui/BigButton';
import { MicButton } from '@/components/voice/MicButton';
import { ResponseCard } from '@/components/ui/ResponseCard';
import { useChatStore } from '@/stores/chat-store';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTTS } from '@/hooks/useTTS';

export default function MainScreen() {
  const t = useTranslations('MainScreen');
  const router = useRouter();
  const { messages, error, clearError } = useChatStore();
  const { readAloud } = useAccessibilityStore();
  const { isAuthenticated } = useAuthStore();
  const { speak, stop: stopSpeaking } = useTTS();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-speak new assistant messages when readAloud is enabled
  useEffect(() => {
    if (!readAloud || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.id !== lastSpokenIdRef.current
    ) {
      lastSpokenIdRef.current = lastMessage.id;
      speak(lastMessage.content);
    }
  }, [messages, readAloud, speak]);

  const handleListen = (text: string) => {
    speak(text);
  };

  const handleOpenVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Don't render the main screen if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        {/* Greeting */}
        <div className="w-full max-w-lg flex flex-col items-center pt-6 pb-2">
          <p className="text-navi-lg text-center text-navi-text/70 max-w-md mb-6">
            {t('greeting')}
          </p>

          {/* Giant Mic Button - the hero element */}
          <MicButton />
        </div>

        {/* Action buttons row */}
        <div className="w-full max-w-md flex gap-4 mt-8">
          <BigButton
            icon={<Camera className="w-6 h-6" />}
            label={t('cameraLabel')}
            variant="secondary"
            onClick={() => router.push('/camera')}
            className="flex-1"
          />
          <BigButton
            icon={<HelpCircle className="w-6 h-6" />}
            label={t('helpLabel')}
            variant="secondary"
            onClick={() => router.push('/help')}
            className="flex-1"
          />
        </div>

        {/* Settings shortcut */}
        <div className="w-full max-w-md mt-4">
          <BigButton
            icon={<Settings className="w-5 h-5" />}
            label={t('accessibilityLabel')}
            variant="secondary"
            onClick={() => router.push('/settings')}
            className="w-full"
          />
        </div>

        {/* Chat error display */}
        {error && (
          <div className="w-full max-w-lg mt-6">
            <div
              role="alert"
              className="p-4 rounded-navi bg-navi-danger/10 border border-navi-danger/30
                         text-navi-danger text-navi-base text-center cursor-pointer"
              onClick={clearError}
            >
              {t('errorGeneric')}
            </div>
          </div>
        )}

        {/* Response area - chat messages */}
        {messages.length > 0 && (
          <div className="w-full max-w-lg mt-8 flex flex-col">
            <h2 className="sr-only">{t('responsesTitle')}</h2>
            {messages.map((msg) => (
              <ResponseCard
                key={msg.id}
                message={msg}
                onListen={handleListen}
                onOpenVideo={handleOpenVideo}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>
    </>
  );
}
