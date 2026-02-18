'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { BigButton } from '@/components/ui/BigButton';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { PhotoPreview } from '@/components/camera/PhotoPreview';
import { useCamera } from '@/hooks/useCamera';
import { useTTS } from '@/hooks/useTTS';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { apiClient } from '@/lib/api-client';

export default function CameraPage() {
  const t = useTranslations('Camera');
  const locale = useLocale();
  const router = useRouter();
  const { speak, stop: stopSpeaking, isSpeaking } = useTTS();
  const readAloud = useAccessibilityStore((s) => s.readAloud);

  const {
    videoRef,
    photoBlob,
    photoUrl,
    isActive,
    error,
    startCamera,
    takePhoto,
    retake,
    stopCamera,
  } = useCamera();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    description: string;
    suggestions?: string[];
    sensitive?: boolean;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-read result if readAloud is enabled
  useEffect(() => {
    if (analysisResult && readAloud) {
      speak(analysisResult.description);
    }
  }, [analysisResult, readAloud, speak]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!photoBlob) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const base64 = await blobToBase64(photoBlob);
      const response = await apiClient.analyzeImage(base64, undefined, locale);

      // Check for potentially sensitive content in the description
      const sensitiveKeywords = [
        'senha', 'password', 'cpf', 'cartao', 'card number',
        'credit card', 'social security', 'bank account',
      ];
      const descLower = response.description.toLowerCase();
      const isSensitive = sensitiveKeywords.some((kw) =>
        descLower.includes(kw)
      );

      setAnalysisResult({
        description: response.description,
        suggestions: response.suggestions,
        sensitive: isSensitive,
      });
    } catch {
      setAnalysisError(t('analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [photoBlob, blobToBase64, t]);

  const handleRetake = useCallback(() => {
    retake();
    setAnalysisResult(null);
    setAnalysisError(null);
    stopSpeaking();
  }, [retake, stopSpeaking]);

  const handleBack = useCallback(() => {
    stopCamera();
    stopSpeaking();
    router.back();
  }, [stopCamera, stopSpeaking, router]);

  return (
    <>
      <TopBar />
      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        {/* Back button */}
        <div className="w-full max-w-lg pt-4 pb-2">
          <button
            onClick={handleBack}
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
        <h1 className="text-navi-2xl font-bold text-navi-text mb-6">
          {t('title')}
        </h1>

        {/* Camera or Preview */}
        <div className="w-full max-w-lg">
          {!photoUrl ? (
            <CameraCapture
              videoRef={videoRef}
              isActive={isActive}
              error={error}
              onStart={startCamera}
              onCapture={takePhoto}
            />
          ) : !analysisResult ? (
            <PhotoPreview
              photoUrl={photoUrl}
              onRetake={handleRetake}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            /* Analysis Result */
            <div className="flex flex-col gap-6 w-full">
              {/* Photo thumbnail */}
              <div className="w-full aspect-[16/9] bg-black rounded-navi overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={t('photoPreviewAlt')}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              {/* Sensitive data warning */}
              {analysisResult.sensitive && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-4 rounded-navi bg-navi-danger/10
                             border-2 border-navi-danger/30"
                >
                  <AlertTriangle className="w-6 h-6 text-navi-danger flex-shrink-0 mt-0.5" />
                  <p className="text-navi-base text-navi-danger font-medium">
                    {t('sensitiveWarning')}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="bg-navi-surface rounded-navi p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-navi-xl font-bold text-navi-text">
                    {t('resultTitle')}
                  </h2>
                  <button
                    onClick={() =>
                      isSpeaking
                        ? stopSpeaking()
                        : speak(analysisResult.description)
                    }
                    aria-label={
                      isSpeaking ? t('stopListening') : t('listenResult')
                    }
                    className="min-w-tap min-h-tap flex items-center justify-center
                               rounded-navi text-navi-primary hover:bg-navi-surface-hover
                               transition-colors"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <p className="text-navi-lg text-navi-text leading-relaxed whitespace-pre-line">
                  {analysisResult.description}
                </p>
              </div>

              {/* Step-by-step suggestions */}
              {analysisResult.suggestions &&
                analysisResult.suggestions.length > 0 && (
                  <div className="bg-navi-surface rounded-navi p-5">
                    <h3 className="text-navi-lg font-bold text-navi-text mb-3">
                      {t('suggestions')}
                    </h3>
                    <ol className="space-y-3">
                      {analysisResult.suggestions.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-navi-base text-navi-text"
                        >
                          <span
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-navi-primary
                                       text-white flex items-center justify-center font-bold
                                       text-navi-sm"
                          >
                            {index + 1}
                          </span>
                          <span className="pt-1 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              {/* Retake button */}
              <BigButton
                label={t('retake')}
                variant="secondary"
                onClick={handleRetake}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Analysis error */}
        {analysisError && (
          <div
            role="alert"
            className="w-full max-w-lg mt-6 p-4 rounded-navi bg-navi-danger/10
                       border border-navi-danger/30 text-navi-danger
                       text-navi-base text-center"
          >
            {analysisError}
          </div>
        )}
      </main>
    </>
  );
}
