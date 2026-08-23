/**
 * PWA Service Worker Update Hook
 * Detects new app versions and provides safe, one-click update reloading.
 */
import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    // Reload the page once the new service worker has activated
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // If a worker is already waiting, trigger update state
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      // Detect when a new service worker is found
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    isUpdating,
    updateApp,
  };
}
