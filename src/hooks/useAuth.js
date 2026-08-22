/**
 * Custom Hook for Player Profile and Authentication state
 */
import { useState, useEffect } from 'react';
import { getStoredProfile, saveStoredProfile, clearStoredProfile } from '../utils/storage';
import { getOrCreateProfile, updateProfile } from '../services/profileService';

export function useAuth() {
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await getOrCreateProfile();
        setProfile(p);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const createProfile = async (data) => {
    setLoading(true);
    try {
      const newProf = await getOrCreateProfile(data);
      setProfile(newProf);
      return newProf;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedFields) => {
    const updated = await updateProfile(updatedFields);
    setProfile(updated);
    return updated;
  };

  const logout = () => {
    clearStoredProfile();
    setProfile(null);
  };

  return {
    profile,
    loading,
    createProfile,
    updateProfile: handleUpdateProfile,
    logout,
    hasProfile: Boolean(profile?.playerId && profile?.displayName),
  };
}
