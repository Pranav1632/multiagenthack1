import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
        secondary:
          'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800',
        outline:
          'border-zinc-800 text-zinc-300',
        destructive:
          'border-rose-900/50 bg-rose-950/40 text-rose-300',
        success:
          'border-emerald-900/50 bg-emerald-950/40 text-emerald-300',
        warning:
          'border-amber-900/50 bg-amber-950/40 text-amber-300',
        blue:
          'border-sky-900/50 bg-sky-950/40 text-sky-300',
        vercel:
          'border-zinc-700 bg-black text-white shadow-sm font-mono text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
