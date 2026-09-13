import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext({
  value: '',
  onValueChange: () => {},
});

export function Tabs({ value, defaultValue, onValueChange, className, children }) {
  const [selected, setSelected] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : selected;

  const handleChange = (val) => {
    if (value === undefined) setSelected(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-lg bg-zinc-900/60 p-1 text-zinc-400 border border-zinc-800/80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, disabled }) {
  const context = useContext(TabsContext);
  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
        isSelected
          ? 'bg-zinc-800 text-white shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const context = useContext(TabsContext);
  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
}
