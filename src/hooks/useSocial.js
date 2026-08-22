/**
 * Social Follow Hook for KM
 * Manages real-time following, followers, and mutual follow detection.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  subscribeSocial,
  followPlayer,
  unfollowPlayer,
  searchPlayer,
  isFollowing,
  isFollower,
  isMutualFollow,
  ensureMutualConversation,
} from '../services/socialService';

export function useSocial(profile) {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.playerId) {
      setSocialData(null);
      setLoading(false);
      return;
    }

    const unsub = subscribeSocial(profile.playerId, (data) => {
      setSocialData(data);
      setLoading(false);
    });

    return () => unsub?.();
  }, [profile?.playerId]);

  const handleFollow = useCallback(
    async (targetProfile) => {
      if (!profile || !targetProfile) return false;
      const res = await followPlayer(profile, targetProfile);
      return res;
    },
    [profile]
  );

  const handleUnfollow = useCallback(
    async (targetId) => {
      if (!profile?.playerId || !targetId) return false;
      const res = await unfollowPlayer(profile.playerId, targetId);
      return res;
    },
    [profile?.playerId]
  );

  const handleSearch = useCallback(async (query) => {
    return await searchPlayer(query);
  }, []);

  const checkIsFollowing = useCallback(
    (targetId) => isFollowing(socialData, targetId),
    [socialData]
  );

  const checkIsFollower = useCallback(
    (targetId) => isFollower(socialData, targetId),
    [socialData]
  );

  const checkIsMutual = useCallback(
    (targetId) => isMutualFollow(socialData, targetId),
    [socialData]
  );

  const startConversation = useCallback(
    async (targetProfile) => {
      if (!profile || !targetProfile) return null;
      return await ensureMutualConversation(profile, targetProfile);
    },
    [profile]
  );

  return {
    socialData,
    loading,
    followPlayer: handleFollow,
    unfollowPlayer: handleUnfollow,
    searchPlayers: handleSearch,
    isFollowing: checkIsFollowing,
    isFollower: checkIsFollower,
    isMutual: checkIsMutual,
    startConversation,
  };
}
