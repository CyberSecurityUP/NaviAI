'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw, Search, Loader2 } from 'lucide-react';
import { BigButton } from '@/components/ui/BigButton';

interface PhotoPreviewProps {
  photoUrl: string;
  onRetake: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function PhotoPreview({
  photoUrl,
  onRetake,
  onAnalyze,
  isAnalyzing,
}: PhotoPreviewProps) {
  const t = useTranslations('Camera');

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Photo preview */}
      <div className="relative w-full max-w-lg aspect-[4/3] bg-black rounded-navi overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={t('photoPreviewAlt')}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-lg">
        <BigButton
          icon={<RotateCcw className="w-6 h-6" />}
          label={t('retake')}
          variant="secondary"
          onClick={onRetake}
          disabled={isAnalyzing}
          className="flex-1"
        />
        <BigButton
          icon={
            isAnalyzing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Search className="w-6 h-6" />
            )
          }
          label={isAnalyzing ? t('analyzing') : t('analyze')}
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex-1"
        />
      </div>
    </div>
  );
}
