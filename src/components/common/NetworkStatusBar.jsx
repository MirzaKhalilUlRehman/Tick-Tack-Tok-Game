/**
 * KM Network Status Notification Bar
 * Displays user-friendly reconnection feedback without exposing technical error traces.
 */
import React from 'react';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function NetworkStatusBar() {
  const { isOnline, reconnected } = useNetworkStatus();

  if (isOnline && !reconnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        id="km-offline-bar"
        className="bg-amber-500/90 text-slate-950 px-4 py-2 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-lg backdrop-blur-md sticky top-0 z-50 animate-fadeIn"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Reconnecting...</span>
      </div>
    );
  }

  if (reconnected) {
    return (
      <div
        id="km-reconnected-bar"
        className="bg-emerald-500/95 text-slate-950 px-4 py-2 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-lg backdrop-blur-md sticky top-0 z-50 animate-fadeIn"
      >
        <Wifi className="w-4 h-4" />
        <span>Back online! Synchronizing latest data...</span>
      </div>
    );
  }

  return null;
}
