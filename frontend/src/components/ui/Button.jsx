import React from 'react';
import { cn } from '../../lib/utils';

const variantClasses = {
  default: 'bg-white text-black hover:bg-zinc-200 shadow-sm active:scale-[0.99]',
  destructive: 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm active:scale-[0.99]',
  outline: 'border border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-white',
  secondary: 'bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800/80 active:scale-[0.99]',
  ghost: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
  link: 'text-white underline-offset-4 hover:underline',
  vercel: 'bg-white text-black font-semibold hover:bg-zinc-200 border border-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.1)] active:scale-[0.98]',
};

const sizeClasses = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-11 rounded-md px-8 text-base font-semibold',
  icon: 'h-9 w-9',
};

export const buttonVariants = ({ variant = 'default', size = 'default', className = '' } = {}) => {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.default,
    className
  );
};

export const Button = React.forwardRef(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
