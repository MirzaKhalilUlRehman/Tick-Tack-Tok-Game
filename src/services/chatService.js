/**
 * Text & Emoji Only Chat Service for KM
 * Supports:
 * - Text messages with emojis
 * - Real-time emoji message reactions (❤️ 😂 😮 😢 👍 👎)
 * - Deterministic conversation IDs between mutual followers
 * - Offline message delivery & permanent storage
 * - Typing indicators & Seen receipts
 */
import {
  sendChatMessageToDb,
  addReactionToMessageInDb,
  setTypingInDb,
  markConversationSeenInDb,
  subscribeToConversation,
  subscribeUserConversations,
  getConversationId,
} from '../firebase/database';
import { generateMessageId } from '../utils/idGenerator';

/**
 * Returns deterministic conversation ID for two player IDs
 */
export function getConvId(userIdA, userIdB) {
  return getConversationId(userIdA, userIdB);
}

/**
 * Sends a text message to a conversation
 */
export async function sendTextMessage(convId, playerProfile, text) {
  const clean = String(text || '').trim();
  if (!clean || !convId || !playerProfile?.playerId) return null;

  const message = {
    id: generateMessageId(),
    senderId: playerProfile.playerId,
    senderName: playerProfile.displayName || 'Player',
    avatar: playerProfile.avatar || 'fox',
    type: 'text',
    text: clean.substring(0, 2000),
    timestamp: Date.now(),
    reactions: {},
    seenBy: { [playerProfile.playerId]: Date.now() },
  };

  await sendChatMessageToDb(convId, message);
  // Clear typing indicator on send
  await setTypingStatus(convId, playerProfile.playerId, false);
  return message;
}

/**
 * Toggles or updates an emoji reaction on a message
 */
export async function toggleReaction(convId, messageId, playerId, reactionEmoji, currentReactions = {}) {
  const existing = currentReactions[playerId];
  const newEmoji = existing === reactionEmoji ? null : reactionEmoji;
  await addReactionToMessageInDb(convId, messageId, playerId, newEmoji);
}

/**
 * Sets typing indicator
 */
export async function setTypingStatus(convId, playerId, isTyping) {
  try {
    await setTypingInDb(convId, playerId, isTyping);
  } catch (e) {}
}

/**
 * Marks conversation messages as seen
 */
export async function markChatSeen(convId, playerId) {
  try {
    await markConversationSeenInDb(convId, playerId);
  } catch (e) {}
}

/**
 * Subscribes to an active conversation
 */
export function subscribeConversation(convId, callback) {
  return subscribeToConversation(convId, callback);
}

/**
 * Subscribes to all conversations for user
 */
export function subscribeUserInbox(userId, callback) {
  return subscribeUserConversations(userId, callback);
}
