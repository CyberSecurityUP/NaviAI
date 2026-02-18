'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useAccessibilityStore } from '@/stores/accessibility-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseTTSReturn {
  speak: (text: string, lang?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
}

/**
 * Reads the auth token from the persisted Zustand store in localStorage.
 */
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('navi-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);
  const voiceSpeed = useAccessibilityStore((s) => s.voiceSpeed);

  // Ref for the server-side fallback audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Preload voices (they may load asynchronously in some browsers)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      voicesLoadedRef.current = true;
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, lang: string = 'pt-BR') => {
      if (typeof window === 'undefined') return;

      // ── Primary path: Web Speech API ──
      if (window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = voiceSpeed === 'slow' ? 0.7 : 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a matching voice for the language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice =
          voices.find((v) => v.lang.startsWith(lang)) ||
          voices.find((v) => v.lang.startsWith(lang.split('-')[0]));

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };

        utteranceRef.current = utterance;
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);

        return;
      }

      // ── Fallback path: server-side TTS ──

      // Stop any currently playing fallback audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setIsSpeaking(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(`${API_BASE_URL}/api/v1/tts/synthesize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, language: lang }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Server TTS failed: ${response.status} ${errorText}`
            );
          }
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            audioRef.current = null;
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            audioRef.current = null;
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
          };

          return audio.play();
        })
        .catch(() => {
          setIsSpeaking(false);
        });
    },
    [voiceSpeed]
  );

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Web Speech API path
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Fallback audio path
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
  };
}
