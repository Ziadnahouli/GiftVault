import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/20',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/20',
    danger: 'bg-rose-500/20 text-rose-300 border border-rose-500/20',
    default: 'bg-dark-700/50 text-dark-300 border border-dark-600/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
