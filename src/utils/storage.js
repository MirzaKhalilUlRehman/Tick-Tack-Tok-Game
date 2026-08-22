/**
 * Local storage helper with safe fallback
 */

const STORAGE_KEYS = {
  PROFILE: 'mplay_user_profile',
  SOUND_ENABLED: 'mplay_sound_enabled',
  GAME_STATS: 'mplay_game_stats',
  RECENT_ROOMS: 'mplay_recent_rooms',
};

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored profile:', err);
    return null;
  }
}

export function saveStoredProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to storage:', err);
  }
}

export function clearStoredProfile() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  } catch (err) {
    console.error('Failed to clear profile from storage:', err);
  }
}

export function getSoundSetting() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val === null ? true : val === 'true';
  } catch (err) {
    return true;
  }
}

export function setSoundSetting(enabled) {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  } catch (err) {
    console.error('Failed to save sound setting:', err);
  }
}

export function getStoredStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAME_STATS);
    if (!raw) {
      return {
        tttWins: 0,
        tttLosses: 0,
        tttDraws: 0,
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    return {
      tttWins: 0,
      tttLosses: 0,
      tttDraws: 0,
    };
  }
}

export function updateStoredStats(updater) {
  try {
    const current = getStoredStats();
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update stats:', err);
    return getStoredStats();
  }
}
