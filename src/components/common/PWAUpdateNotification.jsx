/**
 * KM PWA Update Notification Card
 * Prompts user to refresh safely when a new version of the app is available.
 */
import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { useSound } from '../../hooks/useSound';

export default function PWAUpdateNotification() {
  const { updateAvailable, isUpdating, updateApp } = usePWAUpdate();
  const { playPop } = useSound();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    try {
      playPop();
    } catch (e) {}
    updateApp();
  };

  return (
    <aside
      id="km-pwa-update-banner"
      aria-label="Application Update Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 flex items-center justify-between gap-3 animate-slideUp"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-black font-display text-white">A new version is available</h4>
          <p className="text-[11px] text-white/50">Update to get the latest features</p>
        </div>
      </div>

      <button
        id="km-pwa-update-btn"
        type="button"
        disabled={isUpdating}
        onClick={handleUpdate}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
        <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
      </button>
    </aside>
  );
}
