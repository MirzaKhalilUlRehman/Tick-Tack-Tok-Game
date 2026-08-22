import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Sparkles, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useSound } from '../../hooks/useSound';

export default function InstallAppPrompt() {
  const { canInstall, isInstalled, isStandalone, platform, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const { playPop, playWin } = useSound();

  useEffect(() => {
    // Check if dismissed recently in localStorage
    const isDismissed = localStorage.getItem('multiarena_install_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  // Do not show if already running standalone or installed or dismissed
  if (isStandalone || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    playPop();
    const success = await installApp();
    if (success) {
      playWin();
      setInstallSuccess(true);
      setTimeout(() => setDismissed(true), 3000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('multiarena_install_dismissed', 'true');
  };

  return (
    <div
      id="pwa-install-banner"
      className="bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 border-b border-indigo-500/30 px-4 py-2.5 backdrop-blur-md relative z-30"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            {platform.isAndroid ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="text-xs font-bold text-white">
                {platform.isAndroid ? 'Get the Android App' : 'Install Desktop App'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-bold uppercase">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              {platform.isAndroid
                ? 'Play full-screen with offline support and zero lag against PC friends'
                : 'Install as a standalone window on Windows, Mac, or Chrome'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canInstall ? (
            <button
              id="pwa-install-btn"
              type="button"
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-102 active:scale-95 transition-all cursor-pointer"
            >
              {installSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
              <span>{installSuccess ? 'Installed!' : 'Install App'}</span>
            </button>
          ) : platform.isAndroid ? (
            <span className="text-[10px] text-indigo-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              Tap browser menu (⋮) → "Add to Home screen"
            </span>
          ) : (
            <span className="text-[10px] text-indigo-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              Click URL bar install icon to add
            </span>
          )}

          <button
            id="dismiss-pwa-banner-btn"
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
