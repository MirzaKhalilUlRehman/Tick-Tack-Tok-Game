import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900/95 border-indigo-500/50 text-slate-200',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    },
  }[type] || {
    bg: 'bg-slate-900/95 border-indigo-500/50 text-slate-200',
    icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  };

  return (
    <div
      id="toast-notification"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${typeConfig.bg}`}
      >
        {typeConfig.icon}
        <p className="text-sm font-medium flex-1">{message}</p>
        {onClose && (
          <button
            id="toast-close-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
