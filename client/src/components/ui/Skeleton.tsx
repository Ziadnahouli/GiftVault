import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer bg-dark-800 rounded-xl bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 bg-[length:400%_100%]', className)}
      {...props}
    />
  );
}
