'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { BigButton } from '@/components/ui/BigButton';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      router.push('/');
    } catch {
      setLocalError(t('errorInvalidCredentials'));
    }
  }

  async function handleDevSession() {
    setDevLoading(true);
    setLocalError(null);
    clearError();

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/dev-session`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Dev session failed');
      }

      const tokens = await response.json();
      apiClient.setTokens(tokens.access_token, tokens.refresh_token);

      useAuthStore.setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
      });

      // Load user info
      const user = await apiClient.getMe();
      useAuthStore.setState({ user });

      router.push('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Dev session failed');
    } finally {
      setDevLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/google`);
      if (!response.ok) {
        throw new Error('Google OAuth not configured');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch {
      setLocalError(t('googleNotConfigured'));
    }
  }

  const displayError = localError || (error ? t(error) : null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-navi-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-navi-4xl font-bold text-navi-primary mb-2">
            NaviAI
          </h1>
          <p className="text-navi-lg text-navi-text/70">
            {t('loginTitle')}
          </p>
        </div>

        {/* Error message */}
        {displayError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-navi bg-navi-danger/10 border border-navi-danger/30 text-navi-danger text-navi-base text-center"
          >
            {displayError}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="block text-navi-lg font-medium text-navi-text mb-2"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-tap px-4 py-3 text-navi-lg rounded-navi border-2
                         border-navi-surface-hover bg-navi-surface text-navi-text
                         focus:border-navi-primary focus:outline-none transition-colors"
              placeholder={t('email')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-navi-lg font-medium text-navi-text mb-2"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-tap px-4 py-3 text-navi-lg rounded-navi border-2
                         border-navi-surface-hover bg-navi-surface text-navi-text
                         focus:border-navi-primary focus:outline-none transition-colors"
              placeholder={t('password')}
            />
          </div>

          <BigButton
            type="submit"
            label={t('login')}
            variant="primary"
            disabled={isLoading}
            className="w-full mt-2"
          />
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-navi-surface-hover" />
          <span className="text-navi-sm text-navi-text/50">{t('or')}</span>
          <div className="flex-1 h-px bg-navi-surface-hover" />
        </div>

        {/* Google OAuth */}
        <BigButton
          label={t('loginGoogle')}
          variant="secondary"
          onClick={handleGoogleLogin}
          className="w-full"
        />

        {/* Dev session button */}
        <button
          onClick={handleDevSession}
          disabled={devLoading}
          className="w-full mt-3 min-h-tap px-4 py-3 text-navi-base rounded-navi
                     border-2 border-dashed border-navi-surface-hover text-navi-text/50
                     hover:border-navi-primary hover:text-navi-primary transition-colors
                     disabled:opacity-50"
        >
          {devLoading ? 'Entrando...' : t('devSession')}
        </button>

        {/* Create account link */}
        <div className="mt-8 text-center">
          <p className="text-navi-base text-navi-text/70 mb-2">
            {t('noAccount')}
          </p>
          <Link
            href="/onboarding"
            className="text-navi-lg font-semibold text-navi-primary hover:underline
                       focus-visible:outline focus-visible:outline-3 focus-visible:outline-navi-primary
                       focus-visible:outline-offset-2 rounded-navi px-2 py-1"
          >
            {t('createAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
