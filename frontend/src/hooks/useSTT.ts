'use client';

import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseSTTReturn {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend window type for webkit prefix
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
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

export function useSTT(): UseSTTReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Refs for the server-side fallback (MediaRecorder path)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback((lang: string = 'pt-BR') => {
    const SpeechRecognition = getSpeechRecognition();

    // ── Primary path: Web Speech API ──
    if (SpeechRecognition) {
      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      setError(null);
      setTranscript('');

      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Show interim results for real-time feedback, finalize when done
        if (finalTranscript) {
          setTranscript(finalTranscript);
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        // 'no-speech' and 'aborted' are not real errors from the user perspective
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(event.error);
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setIsListening(true);

      try {
        recognition.start();
      } catch {
        setError('Failed to start speech recognition');
        setIsListening(false);
        recognitionRef.current = null;
      }

      return;
    }

    // ── Fallback path: MediaRecorder + server-side STT ──
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('STT not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;

        // Choose a supported mime type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : undefined; // let the browser pick default

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          // Stop all media tracks so the mic indicator goes away
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;

          const chunks = audioChunksRef.current;
          if (chunks.length === 0) {
            setIsListening(false);
            return;
          }

          const audioBlob = new Blob(chunks, {
            type: recorder.mimeType || 'audio/webm',
          });

          // Send to server
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('language', lang);

            const headers: HeadersInit = {};
            const token = getAuthToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(
              `${API_BASE_URL}/api/v1/stt/transcribe`,
              {
                method: 'POST',
                headers,
                body: formData,
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              setError(`Server STT failed: ${response.status} ${errorText}`);
              setIsListening(false);
              return;
            }

            const data = await response.json();
            setTranscript(data.text || data.transcript || '');
          } catch (err) {
            setError(
              `Server STT error: ${err instanceof Error ? err.message : String(err)}`
            );
          } finally {
            setIsListening(false);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
      })
      .catch((err) => {
        setError(
          `Microphone access denied: ${err instanceof Error ? err.message : String(err)}`
        );
        setIsListening(false);
      });
  }, []);

  const stopListening = useCallback(() => {
    // Web Speech API path
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // MediaRecorder fallback path
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      // Note: isListening will be set to false in the onstop handler after
      // the server responds, so the UI stays in "listening" state while
      // the transcription request is in flight.
      return;
    }

    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
