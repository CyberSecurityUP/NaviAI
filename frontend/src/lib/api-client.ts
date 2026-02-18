import type {
  User,
  TokenResponse,
  ChatRequest,
  ChatResponse,
  VisionResponse,
  TrustedVideo,
  AccessibilitySettings,
  KnowledgeChunk,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('navi-auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.accessToken = parsed?.state?.accessToken || null;
          this.refreshTokenValue = parsed?.state?.refreshToken || null;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 401 && retry && this.refreshTokenValue) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(response.status, errorBody);
    }

    return response.json();
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshTokenValue = refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshTokenValue = null;
  }

  // Auth endpoints
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<TokenResponse> {
    // Register creates the user, then we login to get tokens
    await this.request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    return this.login(email, password);
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const data = await this.request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshTokenValue }),
      });
      if (!response.ok) return false;
      const data: TokenResponse = await response.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/v1/auth/me');
  }

  async updateAccessibility(
    accessibilitySettings: Record<string, unknown>
  ): Promise<User> {
    return this.request<User>(
      '/api/v1/auth/me/accessibility',
      {
        method: 'PATCH',
        body: JSON.stringify({ accessibility_settings: accessibilitySettings }),
      }
    );
  }

  // Chat endpoints
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Vision endpoints
  async analyzeImage(imageBase64: string, question?: string, locale?: string): Promise<VisionResponse> {
    return this.request<VisionResponse>('/api/v1/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, question, locale: locale || 'pt-BR' }),
    });
  }

  // Video search
  async searchVideos(query: string): Promise<TrustedVideo[]> {
    return this.request<TrustedVideo[]>(
      `/api/v1/videos/search?q=${encodeURIComponent(query)}`
    );
  }

  // Knowledge base
  async searchKnowledge(query: string): Promise<KnowledgeChunk[]> {
    return this.request<KnowledgeChunk[]>(
      `/api/v1/knowledge/search?q=${encodeURIComponent(query)}`
    );
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
