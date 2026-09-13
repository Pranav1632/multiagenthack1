import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext({
  toast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 3500 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start space-x-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all animate-fade-in',
              t.variant === 'destructive'
                ? 'border-rose-900/60 bg-zinc-950/95 text-rose-300'
                : t.variant === 'success'
                ? 'border-emerald-900/60 bg-zinc-950/95 text-emerald-300'
                : 'border-zinc-800 bg-zinc-950/95 text-zinc-100'
            )}
          >
            {t.variant === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {t.title && <div className="text-xs font-semibold text-white">{t.title}</div>}
              {t.description && (
                <div className="text-xs text-zinc-400 mt-0.5 leading-normal">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
