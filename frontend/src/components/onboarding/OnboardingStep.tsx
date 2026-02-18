'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface OnboardingStepProps {
  title: string;
  children: React.ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function OnboardingStep({
  title,
  children,
  icon,
  className,
}: OnboardingStepProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center w-full px-4',
        'animate-in fade-in slide-in-from-right-4 duration-300',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-6 text-navi-primary" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Title - the narrated text displayed visually */}
      <h2 className="text-navi-2xl font-bold text-navi-text mb-8 leading-relaxed max-w-sm">
        {title}
      </h2>

      {/* Content area (input field) */}
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
