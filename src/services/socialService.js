/**
 * Social Follow & Discovery Service for KM
 * Handles player search by Player ID, follow/unfollow relationships,
 * and mutual follow validation for unlocking messaging.
 */
import {
  getUserData,
  searchPlayerInDb,
  followUserInDb,
  unfollowUserInDb,
  subscribeToUserSocial,
  getOrCreateConversationInDb,
} from '../firebase/database';

export async function searchPlayer(query) {
  const clean = String(query || '').trim().toUpperCase();
  if (!clean) return [];
  return await searchPlayerInDb(clean);
}

export async function getPlayerProfile(playerId) {
  return await getUserData(playerId);
}

export async function followPlayer(currentUserProfile, targetUserProfile) {
  if (!currentUserProfile?.playerId || !targetUserProfile?.playerId) return false;
  return await followUserInDb(currentUserProfile.playerId, targetUserProfile);
}

export async function unfollowPlayer(currentUserId, targetPlayerId) {
  if (!currentUserId || !targetPlayerId) return false;
  return await unfollowUserInDb(currentUserId, targetPlayerId);
}

export function subscribeSocial(userId, callback) {
  return subscribeToUserSocial(userId, callback);
}

/**
 * Checks if targetId is followed by current user
 */
export function isFollowing(userSocialData, targetId) {
  if (!userSocialData?.following || !targetId) return false;
  return Boolean(userSocialData.following[targetId]);
}

/**
 * Checks if targetId follows current user
 */
export function isFollower(userSocialData, targetId) {
  if (!userSocialData?.followers || !targetId) return false;
  return Boolean(userSocialData.followers[targetId]);
}

/**
 * Checks if mutual follow relationship is established
 */
export function isMutualFollow(userSocialData, targetId) {
  return isFollowing(userSocialData, targetId) && isFollower(userSocialData, targetId);
}

/**
 * Helper to ensure a mutual follow conversation exists
 */
export async function ensureMutualConversation(userAProfile, userBProfile) {
  return await getOrCreateConversationInDb(userAProfile, userBProfile);
}
