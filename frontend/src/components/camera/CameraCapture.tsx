'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Loader2, AlertTriangle } from 'lucide-react';
import { BigButton } from '@/components/ui/BigButton';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  error: string | null;
  onStart: () => Promise<void>;
  onCapture: () => void;
}

export function CameraCapture({
  videoRef,
  isActive,
  error,
  onStart,
  onCapture,
}: CameraCaptureProps) {
  const t = useTranslations('Camera');

  // Auto-start camera on mount
  useEffect(() => {
    onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
        <div className="w-20 h-20 rounded-full bg-navi-danger/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-navi-danger" />
        </div>
        <p className="text-navi-lg text-center text-navi-text font-medium">
          {t(error)}
        </p>
        <BigButton
          icon={<Camera className="w-6 h-6" />}
          label={t('tryAgain')}
          onClick={onStart}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Video feed container */}
      <div
        className={cn(
          'relative w-full max-w-lg aspect-[4/3] bg-black rounded-navi overflow-hidden',
          !isActive && 'flex items-center justify-center'
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            !isActive && 'hidden'
          )}
        />
        {!isActive && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-white text-navi-base">{t('starting')}</p>
          </div>
        )}
      </div>

      {/* Capture button */}
      {isActive && (
        <BigButton
          icon={<Camera className="w-7 h-7" />}
          label={t('takePhoto')}
          onClick={onCapture}
          className="w-full max-w-sm text-navi-xl"
        />
      )}
    </div>
  );
}
