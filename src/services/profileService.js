/**
 * Profile service for managing player profile local & remote
 */
import { generatePlayerId } from '../utils/idGenerator';
import { getStoredProfile, saveStoredProfile, clearStoredProfile } from '../utils/storage';
import { writeUserData } from '../firebase/database';
import { initAnonymousAuth } from '../firebase/auth';

export async function getOrCreateProfile(customData = null) {
  let profile = getStoredProfile();

  if (!profile && customData) {
    const playerId = generatePlayerId();
    profile = {
      playerId,
      displayName: customData.displayName.trim(),
      avatar: customData.avatar || 'av1',
      createdAt: Date.now(),
    };
    saveStoredProfile(profile);
  }

  if (profile) {
    try {
      await initAnonymousAuth();
      await writeUserData(profile.playerId, profile);
    } catch (e) {
      console.warn('Could not sync user profile remotely:', e);
    }
  }

  return profile;
}

export async function updateProfile(updatedFields) {
  const current = getStoredProfile();
  if (!current) return null;

  const newProfile = {
    ...current,
    ...updatedFields,
    updatedAt: Date.now(),
  };

  saveStoredProfile(newProfile);

  try {
    await writeUserData(newProfile.playerId, newProfile);
  } catch (e) {
    console.warn('Remote profile update error:', e);
  }

  return newProfile;
}

export function removeProfile() {
  clearStoredProfile();
}
