'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BigButtonProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function BigButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className,
  type = 'button',
}: BigButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'min-w-tap min-h-tap flex items-center justify-center gap-3 px-6 py-4',
        'rounded-navi text-navi-xl font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-3 focus-visible:outline-navi-primary focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && [
          'bg-navi-primary text-white',
          'hover:opacity-90 active:scale-[0.98]',
        ],
        variant === 'secondary' && [
          'bg-navi-surface text-navi-text border-2 border-navi-surface-hover',
          'hover:bg-navi-surface-hover active:scale-[0.98]',
        ],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
