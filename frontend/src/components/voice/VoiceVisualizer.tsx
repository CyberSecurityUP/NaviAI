'use client';

import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  className?: string;
}

export function VoiceVisualizer({ className }: VoiceVisualizerProps) {
  return (
    <div
      className={cn('absolute inset-0 flex items-center justify-center pointer-events-none', className)}
      aria-hidden="true"
    >
      {/* Outermost ring */}
      <div
        className="absolute rounded-full border-2 border-navi-danger/20 animate-voice-pulse-outer"
        style={{ width: '280px', height: '280px' }}
      />

      {/* Middle ring */}
      <div
        className="absolute rounded-full border-2 border-navi-danger/35 animate-voice-pulse-mid"
        style={{ width: '240px', height: '240px' }}
      />

      {/* Inner ring */}
      <div
        className="absolute rounded-full border-2 border-navi-danger/50 animate-voice-pulse-inner"
        style={{ width: '200px', height: '200px' }}
      />
    </div>
  );
}
