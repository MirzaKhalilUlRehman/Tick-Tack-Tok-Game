/**
 * KM PWA Mobile & Desktop Install Experience
 * Features:
 * - Native browser installation trigger (beforeinstallprompt)
 * - Automatic detection of installed / standalone mode (hides when already installed)
 * - Clean mobile install dialog with "Install App" and "Not Now"
 * - Desktop install bar
 * - Does not repeatedly annoy the user if dismissed
 */
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Sparkles, Check, ChevronRight } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useSound } from '../../hooks/useSound';

export default function InstallAppPrompt({ forceShow = false, onClose = null }) {
  const { canInstall, isInstalled, isStandalone, platform, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const { playPop, playWin, playClick } = useSound();

  useEffect(() => {
    // Check if dismissed in this session or within the last 24 hours
    const dismissedTimestamp = localStorage.getItem('km_pwa_install_dismissed_at');
    if (dismissedTimestamp && !forceShow) {
      const timeDiff = Date.now() - parseInt(dismissedTimestamp, 10);
      // Keep dismissed for 24 hours
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, [forceShow]);

  // If already running standalone / installed, hide completely
  if (isStandalone || isInstalled) {
    return null;
  }

  // If dismissed and not forced, hide
  if (dismissed && !forceShow) {
    return null;
  }

  // If browser doesn't support PWA install prompt and not force-show, hide
  if (!canInstall && !forceShow) {
    return null;
  }

  const handleInstallClick = async () => {
    try {
      playPop();
      setInstalling(true);
      const success = await installApp();
      if (success) {
        playWin();
        setInstallSuccess(true);
        setTimeout(() => {
          setDismissed(true);
          if (onClose) onClose();
        }, 2000);
      }
    } catch (e) {
      console.warn('Install error:', e);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    try {
      playClick();
    } catch (e) {}
    setDismissed(true);
    localStorage.setItem('km_pwa_install_dismissed_at', Date.now().toString());
    if (onClose) onClose();
  };

  // 1. Mobile Android / Phone Clean Dialog Card
  if (platform.isAndroid || platform.isIOS || forceShow) {
    return (
      <aside
        id="km-mobile-pwa-install-dialog"
        aria-label="App Installation"
        className="fixed inset-x-4 bottom-6 sm:bottom-8 sm:max-w-sm sm:mx-auto z-50 animate-slideUp select-none"
      >
        <div className="bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-center relative overflow-hidden">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button top right */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Logo & Name */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border-2 border-indigo-500/50 p-1 flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-3 ring-2 ring-indigo-400/20">
              <img
                src="/icon-192.png"
                alt="KM"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <h3 className="text-xl font-black font-display text-white tracking-wide">
              KM
            </h3>

            <p className="text-xs sm:text-sm text-white/70 mt-1.5 mb-6 max-w-xs leading-relaxed">
              Install KM on your phone for a faster app-like experience.
            </p>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {canInstall ? (
              <button
                id="pwa-install-app-btn"
                type="button"
                disabled={installing || installSuccess}
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black font-display text-sm tracking-wide shadow-xl shadow-indigo-600/40 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {installSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>App Installed!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installing...' : 'Install App'}</span>
                  </>
                )}
              </button>
            ) : platform.isIOS ? (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-white/80 space-y-1">
                <p className="font-semibold text-indigo-300">To install on iOS / Safari:</p>
                <p>Tap Share <span className="font-mono font-bold">⎋</span> → <span className="font-bold text-white">Add to Home Screen</span></p>
              </div>
            ) : (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-white/80">
                <p>Tap browser menu <span className="font-bold">⋮</span> → <span className="font-bold text-indigo-300">Install app</span></p>
              </div>
            )}

            <button
              id="pwa-not-now-btn"
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 rounded-xl text-white/50 hover:text-white text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
            >
              Not Now
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Desktop Browser Top Banner
  return (
    <aside
      id="km-desktop-pwa-install-banner"
      aria-label="Desktop App Installation"
      className="bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 border-b border-indigo-500/30 px-4 py-2.5 backdrop-blur-md relative z-30 select-none animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-display text-white">Install KM for Desktop</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-bold uppercase tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Enjoy a dedicated window, faster loading, and cross-play with mobile friends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canInstall && (
            <button
              id="pwa-desktop-install-btn"
              type="button"
              disabled={installing || installSuccess}
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {installSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
              <span>{installSuccess ? 'Installed' : installing ? 'Installing...' : 'Install App'}</span>
            </button>
          )}

          <button
            id="dismiss-pwa-desktop-banner-btn"
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
