export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  accessibility_settings?: AccessibilitySettings;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  locale?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  message: string;
  conversation_id: string;
  sources?: KnowledgeChunk[];
  videos?: TrustedVideo[];
  steps?: string[];
  created_at: string;
}

export interface VisionResponse {
  id: string;
  description: string;
  labels: string[];
  suggestions?: string[];
  created_at: string;
}

export interface TrustedVideo {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  duration_seconds: number;
  source: string;
  relevance_score: number;
}

export interface AccessibilitySettings {
  font_scale: number;
  high_contrast: boolean;
  read_aloud: boolean;
  easy_touch: boolean;
  voice_speed: 'slow' | 'normal';
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  source_url?: string;
  relevance_score: number;
}
