import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Play, 
  Award, 
  Terminal, 
  Network, 
  MessageSquare, 
  GitCommit, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent } from './ui/Dialog';

export default function CommandMenu({ 
  isOpen, 
  onClose, 
  presets, 
  onSelectPresetAndTrigger, 
  onSelectTab, 
  onOpenEval 
}) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items = [
    ...presets.map((p) => ({
      id: `preset-${p.id}`,
      title: `Trigger: ${p.name}`,
      category: 'Simulate Incident',
      icon: Play,
      action: () => {
        onSelectPresetAndTrigger(p);
        onClose(false);
      },
    })),
    {
      id: 'tab-overview',
      title: 'Navigate to Mission Overview',
      category: 'Navigation',
      icon: Layers,
      action: () => {
        onSelectTab('overview');
        onClose(false);
      },
    },
    {
      id: 'tab-timeline',
      title: 'Navigate to Live Trace & Logs',
      category: 'Navigation',
      icon: Terminal,
      action: () => {
        onSelectTab('timeline');
        onClose(false);
      },
    },
    {
      id: 'tab-correlation',
      title: 'Navigate to Root Cause & Diff',
      category: 'Navigation',
      icon: GitCommit,
      action: () => {
        onSelectTab('correlation');
        onClose(false);
      },
    },
    {
      id: 'tab-topology',
      title: 'Navigate to Service Blast Radius',
      category: 'Navigation',
      icon: Network,
      action: () => {
        onSelectTab('topology');
        onClose(false);
      },
    },
    {
      id: 'tab-dispatch',
      title: 'Navigate to War Room & Linear',
      category: 'Navigation',
      icon: MessageSquare,
      action: () => {
        onSelectTab('dispatch');
        onClose(false);
      },
    },
    {
      id: 'eval-suite',
      title: 'Open Reliability & Evaluation Benchmark Suite',
      category: 'Evaluation',
      icon: Award,
      action: () => {
        onOpenEval();
        onClose(false);
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 bg-zinc-950 border-zinc-800 overflow-hidden shadow-2xl" onClose={() => onClose(false)}>
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search scenarios..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 font-sans">
              No matching commands or scenarios found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="text-xs font-medium">{item.title}</span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="p-2.5 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[11px] font-mono text-zinc-600">
          <span>Navigate with ↑ ↓ • Press Enter to select</span>
          <span>Incident Commander</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
