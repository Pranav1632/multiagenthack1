import React from 'react';
import { cn } from '../../lib/utils';

export function Progress({ value = 0, max = 100, className, indicatorClassName }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-zinc-800',
        className
      )}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-white transition-all duration-300 ease-in-out',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}

export function Separator({ className, orientation = 'horizontal' }) {
  return (
    <div
      className={cn(
        'shrink-0 bg-zinc-800',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
    />
  );
}
