import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Content Container */}
      <div className="relative z-50 w-full animate-fade-in">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className, children, onClose }) {
  return (
    <div
      className={cn(
        'relative mx-auto max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-xs text-zinc-400 leading-relaxed', className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end space-x-2 pt-4 border-t border-zinc-900', className)}
      {...props}
    />
  );
}
