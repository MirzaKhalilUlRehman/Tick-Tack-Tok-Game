/**
 * PWA Installation Hook for KM
 * Seamlessly manages native browser install prompts across Android, iOS, and PC Chrome/Edge.
 */
import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState({ isAndroid: false, isIOS: false, isDesktop: true });

  useEffect(() => {
    // Check if running in standalone mode (already installed PWA or Home Screen app)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(Boolean(isStandaloneMode));
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Listen for display mode media query changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Detect platform
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isDesktop = !isAndroid && !isIOS;
    setPlatform({ isAndroid, isIOS, isDesktop });

    // Capture native PWA install prompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Capture successful app install event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return false;
    }
  };

  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled: isInstalled || isStandalone,
    isStandalone,
    platform,
    installApp,
  };
}
