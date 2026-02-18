'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasSteps?: boolean;
  suggestedVideo?: { title: string; url: string; channel_name: string } | null;
  sources?: { title: string; content: string }[] | null;
}

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  sendMessage: (message: string, locale?: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,

  sendMessage: async (message: string, locale?: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiClient.chat({
        message,
        conversation_id: get().conversationId || undefined,
        locale: locale || 'pt-BR',
      });

      // Determine if the response contains step-by-step instructions
      const hasSteps = !!(
        response.steps?.length ||
        /passo\s+\d+/i.test(response.message) ||
        /^\d+\.\s/m.test(response.message)
      );

      // Extract the first video suggestion if available
      const suggestedVideo = response.videos?.[0]
        ? {
            title: response.videos[0].title,
            url: response.videos[0].url,
            channel_name: response.videos[0].source,
          }
        : null;

      // Map knowledge sources
      const sources = response.sources?.length
        ? response.sources.map((s) => ({
            title: s.source,
            content: s.content,
          }))
        : null;

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        hasSteps,
        suggestedVideo,
        sources,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        conversationId: response.conversation_id,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message';

      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  clearChat: () =>
    set({
      messages: [],
      conversationId: null,
      isLoading: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
