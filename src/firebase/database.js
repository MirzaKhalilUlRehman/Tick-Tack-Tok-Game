/**
 * Firebase Firestore & Multi-Tab Sync Layer for KM
 * Supports:
 * - User Profiles & Social Follow System (Following / Followers)
 * - Deterministic Mutual-Follow Permanent Conversations (Text & Emojis only, Reactions, Offline delivery, Seen status, Typing)
 * - 2-Player Private Pairing & Synchronized Tic Tac Toe (Automatic Next Round Transitions)
 */
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  deleteField,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// Multi-tab BroadcastChannel for instant local & offline fallback
const localChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('km_app_sync_v3')
  : null;

// In-memory fallback stores
const localUsers = new Map();
const localPairs = new Map();
const localConversations = new Map();
const localGames = new Map();
const localRelationships = new Map();
const processedMatches = new Set();
const activeListeners = new Map();

function getPersisted(key) {
  try {
    const raw = localStorage.getItem(`__km_${key}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function setPersisted(key, data) {
  try {
    localStorage.setItem(`__km_${key}`, JSON.stringify(data));
  } catch (e) {}
}

if (localChannel) {
  localChannel.onmessage = (event) => {
    const { type, id, data } = event.data || {};
    if (!id) return;

    if (type === 'USER_UPDATE') {
      localUsers.set(id, data);
      const all = getPersisted('users');
      all[id] = data;
      setPersisted('users', all);
      notifyListeners(`user_${id}`, data);
      notifyListeners('all_users', all);
    } else if (type === 'PAIR_UPDATE') {
      localPairs.set(id, data);
      const all = getPersisted('pairs');
      all[id] = data;
      setPersisted('pairs', all);
      notifyListeners(`pair_${id}`, data);
    } else if (type === 'CONV_UPDATE') {
      localConversations.set(id, data);
      const all = getPersisted('conversations');
      all[id] = data;
      setPersisted('conversations', all);
      notifyListeners(`conv_${id}`, data);
      notifyListeners('all_conversations', all);
    } else if (type === 'GAME_UPDATE') {
      localGames.set(id, data);
      const all = getPersisted('games');
      all[id] = data;
      setPersisted('games', all);
      notifyListeners(`game_${id}`, data);
    } else if (type === 'REL_UPDATE') {
      localRelationships.set(id, data);
      const all = getPersisted('relationships');
      all[id] = data;
      setPersisted('relationships', all);
      notifyListeners(`rel_${id}`, data);
    }
  };
}

function notifyListeners(key, data) {
  const callbacks = activeListeners.get(key);
  if (callbacks) {
    callbacks.forEach((cb) => cb(data));
  }
}

/**
 * Normalizes field updates for Firestore dot notation
 */
function normalizeFirestoreUpdates(updates) {
  const normalized = {};
  for (const [key, value] of Object.entries(updates)) {
    const firestoreKey = key.replace(/\//g, '.');
    normalized[firestoreKey] = value === undefined ? null : value;
  }
  return normalized;
}

/**
 * Generates a deterministic relationship ID for two player IDs (e.g. USER001_USER002)
 */
export function getRelationshipId(userIdA, userIdB) {
  if (!userIdA || !userIdB) return null;
  const sorted = [String(userIdA).trim().toUpperCase(), String(userIdB).trim().toUpperCase()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Generates a deterministic conversation ID for two player IDs
 */
export function getConversationId(userIdA, userIdB) {
  if (!userIdA || !userIdB) return null;
  const relId = getRelationshipId(userIdA, userIdB);
  return relId ? `conv_${relId}` : null;
}

/* ==========================================================================
   1. USER PROFILE & SOCIAL FOLLOW SYSTEM
   ========================================================================== */

export async function writeUserData(playerId, userData) {
  if (!playerId) return false;

  const current = (await getUserData(playerId)) || {};
  const merged = {
    ...current,
    ...userData,
    playerId,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', playerId);
      await setDoc(userRef, merged, { merge: true });
    } catch (err) {
      console.warn('Failed to update user in Firestore:', err);
    }
  }

  // Update local memory & storage
  localUsers.set(playerId, merged);
  const allUsers = getPersisted('users');
  allUsers[playerId] = merged;
  setPersisted('users', allUsers);

  if (localChannel) {
    localChannel.postMessage({ type: 'USER_UPDATE', id: playerId, data: merged });
  }
  notifyListeners(`user_${playerId}`, merged);
  notifyListeners('all_users', allUsers);

  return merged;
}

export async function getUserData(playerId) {
  if (!playerId) return null;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', playerId));
      if (snap.exists()) {
        const data = snap.data();
        localUsers.set(playerId, data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getUserData error:', err);
    }
  }

  return localUsers.get(playerId) || getPersisted('users')[playerId] || null;
}

export async function searchPlayerInDb(queryText) {
  const queryClean = String(queryText || '').trim().toUpperCase();
  if (!queryClean) return [];

  // Try direct ID lookup first
  const directUser = await getUserData(queryClean);
  if (directUser) {
    return [directUser];
  }

  // If in Firestore, query matching playerId prefix or exact match
  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const results = [];
      snap.forEach((d) => {
        const u = d.data();
        if (
          u.playerId?.toUpperCase().includes(queryClean) ||
          u.displayName?.toUpperCase().includes(queryClean)
        ) {
          results.push(u);
        }
      });
      return results;
    } catch (e) {
      console.warn('Search query error in Firestore:', e);
    }
  }

  // Fallback search in local store
  const allUsers = getPersisted('users');
  const results = [];
  for (const u of Object.values(allUsers)) {
    if (
      u.playerId?.toUpperCase().includes(queryClean) ||
      u.displayName?.toUpperCase().includes(queryClean)
    ) {
      results.push(u);
    }
  }
  return results;
}

export async function followUserInDb(currentUserId, targetProfile) {
  if (!currentUserId || !targetProfile?.playerId || currentUserId === targetProfile.playerId) {
    return false;
  }
  const targetId = targetProfile.playerId;

  // 1. Update current user's "following" map
  const currentUser = (await getUserData(currentUserId)) || { playerId: currentUserId };
  const currentFollowing = { ...(currentUser.following || {}) };
  currentFollowing[targetId] = {
    playerId: targetId,
    displayName: targetProfile.displayName,
    avatar: targetProfile.avatar,
    followedAt: Date.now(),
  };

  // 2. Update target user's "followers" map
  const targetUser = (await getUserData(targetId)) || { ...targetProfile };
  const targetFollowers = { ...(targetUser.followers || {}) };
  targetFollowers[currentUserId] = {
    playerId: currentUserId,
    displayName: currentUser.displayName || 'Player',
    avatar: currentUser.avatar || 'fox',
    followedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        [`following.${targetId}`]: currentFollowing[targetId],
        updatedAt: Date.now(),
      });
      await updateDoc(doc(db, 'users', targetId), {
        [`followers.${currentUserId}`]: targetFollowers[currentUserId],
        updatedAt: Date.now(),
      });
    } catch (e) {
      // If doc doesn't exist yet, write with setDoc
      try {
        await setDoc(doc(db, 'users', currentUserId), { following: currentFollowing }, { merge: true });
        await setDoc(doc(db, 'users', targetId), { followers: targetFollowers }, { merge: true });
      } catch (err) {
        console.warn('Follow Firestore setDoc fallback:', err);
      }
    }
  }

  // Local fallback updates
  currentUser.following = currentFollowing;
  targetUser.followers = targetFollowers;

  localUsers.set(currentUserId, currentUser);
  localUsers.set(targetId, targetUser);

  const all = getPersisted('users');
  all[currentUserId] = currentUser;
  all[targetId] = targetUser;
  setPersisted('users', all);

  if (localChannel) {
    localChannel.postMessage({ type: 'USER_UPDATE', id: currentUserId, data: currentUser });
    localChannel.postMessage({ type: 'USER_UPDATE', id: targetId, data: targetUser });
  }

  notifyListeners(`user_${currentUserId}`, currentUser);
  notifyListeners(`user_${targetId}`, targetUser);
  notifyListeners('all_users', all);

  // Check if mutual follow now exists -> automatically initialize deterministic conversation
  const targetFollowingMe = Boolean(targetUser.following && targetUser.following[currentUserId]);
  if (targetFollowingMe) {
    await getOrCreateConversationInDb(currentUser, targetUser);
  }

  return true;
}

export async function unfollowUserInDb(currentUserId, targetId) {
  if (!currentUserId || !targetId) return false;

  const currentUser = (await getUserData(currentUserId)) || {};
  const targetUser = (await getUserData(targetId)) || {};

  if (currentUser.following) {
    delete currentUser.following[targetId];
  }
  if (targetUser.followers) {
    delete targetUser.followers[currentUserId];
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        [`following.${targetId}`]: deleteField(),
        updatedAt: Date.now(),
      });
      await updateDoc(doc(db, 'users', targetId), {
        [`followers.${currentUserId}`]: deleteField(),
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Unfollow firestore update error:', e);
    }
  }

  localUsers.set(currentUserId, currentUser);
  localUsers.set(targetId, targetUser);

  const all = getPersisted('users');
  all[currentUserId] = currentUser;
  all[targetId] = targetUser;
  setPersisted('users', all);

  if (localChannel) {
    localChannel.postMessage({ type: 'USER_UPDATE', id: currentUserId, data: currentUser });
    localChannel.postMessage({ type: 'USER_UPDATE', id: targetId, data: targetUser });
  }

  notifyListeners(`user_${currentUserId}`, currentUser);
  notifyListeners(`user_${targetId}`, targetUser);
  notifyListeners('all_users', all);

  return true;
}

export function subscribeToUserSocial(userId, callback) {
  if (!userId) return () => {};

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        doc(db, 'users', userId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            localUsers.set(userId, data);
            callback(data);
          } else {
            callback(null);
          }
        },
        () => {
          const fallback = localUsers.get(userId) || getPersisted('users')[userId] || null;
          callback(fallback);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = `user_${userId}`;
  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(callback);

  const current = localUsers.get(userId) || getPersisted('users')[userId] || null;
  callback(current);

  return () => {
    activeListeners.get(key)?.delete(callback);
  };
}

/* ==========================================================================
   2. MUTUAL-FOLLOW PERMANENT CONVERSATIONS (INBOX & MESSAGING)
   ========================================================================== */

export async function getOrCreateConversationInDb(userA, userB) {
  const userAId = userA?.playerId;
  const userBId = userB?.playerId;
  if (!userAId || !userBId) return null;

  const convId = getConversationId(userAId, userBId);

  if (isFirebaseConfigured && db) {
    try {
      const convRef = doc(db, 'conversations', convId);
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        return { convId, data: snap.data() };
      }

      const newConv = {
        convId,
        participants: {
          [userAId]: true,
          [userBId]: true,
        },
        participantProfiles: {
          [userAId]: {
            playerId: userAId,
            displayName: userA.displayName || 'Player',
            avatar: userA.avatar || 'fox',
          },
          [userBId]: {
            playerId: userBId,
            displayName: userB.displayName || 'Player',
            avatar: userB.avatar || 'fox',
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessage: null,
        messages: {},
        readState: {},
        typing: {},
      };

      await setDoc(convRef, newConv);
      return { convId, data: newConv };
    } catch (e) {
      console.warn('Firestore getOrCreateConversation error:', e);
    }
  }

  // Local fallback
  const convs = getPersisted('conversations');
  if (convs[convId]) {
    return { convId, data: convs[convId] };
  }

  const newConv = {
    convId,
    participants: {
      [userAId]: true,
      [userBId]: true,
    },
    participantProfiles: {
      [userAId]: {
        playerId: userAId,
        displayName: userA.displayName || 'Player',
        avatar: userA.avatar || 'fox',
      },
      [userBId]: {
        playerId: userBId,
        displayName: userB.displayName || 'Player',
        avatar: userB.avatar || 'fox',
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: null,
    messages: {},
    readState: {},
    typing: {},
  };

  convs[convId] = newConv;
  setPersisted('conversations', convs);
  localConversations.set(convId, newConv);

  if (localChannel) {
    localChannel.postMessage({ type: 'CONV_UPDATE', id: convId, data: newConv });
  }
  notifyListeners(`conv_${convId}`, newConv);
  notifyListeners('all_conversations', convs);

  return { convId, data: newConv };
}

export async function sendChatMessageToDb(convId, messageData) {
  if (!convId || !messageData) return null;

  const msgId = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullMsg = {
    ...messageData,
    id: msgId,
    type: 'text',
    timestamp: messageData.timestamp || Date.now(),
    reactions: messageData.reactions || {},
    seenBy: { [messageData.senderId]: Date.now() },
    replyTo: messageData.replyTo ? {
      messageId: messageData.replyTo.messageId || null,
      senderId: messageData.replyTo.senderId || null,
      senderName: messageData.replyTo.senderName || 'Player',
      textPreview: String(messageData.replyTo.textPreview || messageData.replyTo.text || '').substring(0, 150),
    } : null,
  };

  const lastMessagePreview = {
    text: fullMsg.text || '',
    senderId: fullMsg.senderId,
    senderName: fullMsg.senderName || 'Player',
    timestamp: fullMsg.timestamp,
    replyTo: fullMsg.replyTo ? {
      senderName: fullMsg.replyTo.senderName || 'Player',
      textPreview: fullMsg.replyTo.textPreview,
    } : null,
  };

  if (isFirebaseConfigured && db) {
    try {
      const convRef = doc(db, 'conversations', convId);
      await updateDoc(convRef, {
        [`messages.${msgId}`]: fullMsg,
        lastMessage: lastMessagePreview,
        updatedAt: Date.now(),
      });
      return msgId;
    } catch (err) {
      console.warn('Firestore send message error, updating local:', err);
    }
  }

  // Local fallback
  const convs = getPersisted('conversations');
  const conv = convs[convId] || localConversations.get(convId) || { messages: {}, typing: {}, readState: {} };
  conv.messages = conv.messages || {};
  conv.messages[msgId] = fullMsg;
  conv.lastMessage = lastMessagePreview;
  conv.updatedAt = Date.now();

  convs[convId] = conv;
  setPersisted('conversations', convs);
  localConversations.set(convId, conv);

  if (localChannel) {
    localChannel.postMessage({ type: 'CONV_UPDATE', id: convId, data: conv });
  }
  notifyListeners(`conv_${convId}`, conv);
  notifyListeners('all_conversations', convs);

  return msgId;
}

export async function addReactionToMessageInDb(convId, messageId, playerId, reactionEmoji) {
  if (!convId || !messageId || !playerId) return;

  if (isFirebaseConfigured && db) {
    try {
      const convRef = doc(db, 'conversations', convId);
      if (!reactionEmoji) {
        await updateDoc(convRef, {
          [`messages.${messageId}.reactions.${playerId}`]: deleteField(),
          updatedAt: Date.now(),
        });
      } else {
        await updateDoc(convRef, {
          [`messages.${messageId}.reactions.${playerId}`]: reactionEmoji,
          updatedAt: Date.now(),
        });
      }
      return true;
    } catch (e) {
      console.warn('Firestore reaction error:', e);
    }
  }

  // Local fallback
  const convs = getPersisted('conversations');
  const conv = convs[convId] || localConversations.get(convId);
  if (conv?.messages?.[messageId]) {
    conv.messages[messageId].reactions = conv.messages[messageId].reactions || {};
    if (!reactionEmoji) {
      delete conv.messages[messageId].reactions[playerId];
    } else {
      conv.messages[messageId].reactions[playerId] = reactionEmoji;
    }
    conv.updatedAt = Date.now();
    convs[convId] = conv;
    setPersisted('conversations', convs);
    localConversations.set(convId, conv);

    if (localChannel) localChannel.postMessage({ type: 'CONV_UPDATE', id: convId, data: conv });
    notifyListeners(`conv_${convId}`, conv);
    notifyListeners('all_conversations', convs);
  }
  return true;
}

export async function markConversationSeenInDb(convId, playerId) {
  if (!convId || !playerId) return;

  if (isFirebaseConfigured && db) {
    try {
      const convSnap = await getDoc(doc(db, 'conversations', convId));
      if (convSnap.exists()) {
        const data = convSnap.data();
        const messages = data.messages || {};
        const updates = {};
        let count = 0;

        for (const [msgId, msg] of Object.entries(messages)) {
          if (msg.senderId !== playerId && (!msg.seenBy || !msg.seenBy[playerId])) {
            updates[`messages.${msgId}.seenBy.${playerId}`] = Date.now();
            count++;
          }
        }

        updates[`readState.${playerId}`] = {
          lastReadAt: Date.now(),
        };

        if (count > 0 || !data.readState?.[playerId]) {
          updates.updatedAt = Date.now();
          await updateDoc(doc(db, 'conversations', convId), updates);
        }
      }
    } catch (err) {
      console.warn('Mark seen error:', err);
    }
    return;
  }

  // Local fallback
  const convs = getPersisted('conversations');
  const conv = convs[convId] || localConversations.get(convId);
  if (conv?.messages) {
    for (const msg of Object.values(conv.messages)) {
      if (msg.senderId !== playerId) {
        msg.seenBy = msg.seenBy || {};
        msg.seenBy[playerId] = Date.now();
      }
    }
    conv.readState = conv.readState || {};
    conv.readState[playerId] = { lastReadAt: Date.now() };
    convs[convId] = conv;
    setPersisted('conversations', convs);
    localConversations.set(convId, conv);

    if (localChannel) localChannel.postMessage({ type: 'CONV_UPDATE', id: convId, data: conv });
    notifyListeners(`conv_${convId}`, conv);
    notifyListeners('all_conversations', convs);
  }
}

export async function setTypingInDb(convId, playerId, isTyping) {
  if (!convId || !playerId) return;

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        [`typing.${playerId}`]: isTyping ? Date.now() : null,
      });
      return;
    } catch (e) {}
  }

  const convs = getPersisted('conversations');
  const conv = convs[convId] || localConversations.get(convId);
  if (conv) {
    conv.typing = conv.typing || {};
    conv.typing[playerId] = isTyping ? Date.now() : null;
    convs[convId] = conv;
    setPersisted('conversations', convs);
    localConversations.set(convId, conv);

    if (localChannel) localChannel.postMessage({ type: 'CONV_UPDATE', id: convId, data: conv });
    notifyListeners(`conv_${convId}`, conv);
  }
}

export function subscribeToConversation(convId, callback) {
  if (!convId) return () => {};

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        doc(db, 'conversations', convId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            localConversations.set(convId, data);
            callback(data);
          } else {
            callback(null);
          }
        },
        () => {
          const fallback = localConversations.get(convId) || getPersisted('conversations')[convId] || null;
          callback(fallback);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = `conv_${convId}`;
  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(callback);

  const current = localConversations.get(convId) || getPersisted('conversations')[convId] || null;
  callback(current);

  return () => {
    activeListeners.get(key)?.delete(callback);
  };
}

export function subscribeUserConversations(userId, callback) {
  if (!userId) return () => {};

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where(`participants.${userId}`, '==', true)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push(d.data()));
          callback(list);
        },
        () => {
          const all = getPersisted('conversations');
          const list = Object.values(all).filter((c) => c.participants && c.participants[userId]);
          callback(list);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = 'all_conversations';
  const handler = (allConvs) => {
    const list = Object.values(allConvs || getPersisted('conversations')).filter(
      (c) => c.participants && c.participants[userId]
    );
    callback(list);
  };

  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(handler);

  const all = getPersisted('conversations');
  handler(all);

  return () => {
    activeListeners.get(key)?.delete(handler);
  };
}

/* ==========================================================================
   3. 2-PLAYER TIC TAC TOE & LUDO PRIVATE MATCHES
   ========================================================================== */

export const createAll4InitialLudoTokens = () => ({
  red: [
    { id: 0, step: -1, color: 'red' },
    { id: 1, step: -1, color: 'red' },
    { id: 2, step: -1, color: 'red' },
    { id: 3, step: -1, color: 'red' },
  ],
  green: [
    { id: 0, step: -1, color: 'green' },
    { id: 1, step: -1, color: 'green' },
    { id: 2, step: -1, color: 'green' },
    { id: 3, step: -1, color: 'green' },
  ],
  blue: [
    { id: 0, step: -1, color: 'blue' },
    { id: 1, step: -1, color: 'blue' },
    { id: 2, step: -1, color: 'blue' },
    { id: 3, step: -1, color: 'blue' },
  ],
  yellow: [
    { id: 0, step: -1, color: 'yellow' },
    { id: 1, step: -1, color: 'yellow' },
    { id: 2, step: -1, color: 'yellow' },
    { id: 3, step: -1, color: 'yellow' },
  ],
});

export async function createPrivatePairInDb(pairId, player1Profile, gameType = 'tictactoe') {
  const isLudo = gameType === 'ludo';

  const pairData = {
    pairId,
    gameType: isLudo ? 'ludo' : 'tictactoe',
    status: 'waiting', // 'waiting' | 'paired' | 'closed'
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hostId: player1Profile.playerId,
    participants: {
      [player1Profile.playerId]: true,
    },
    players: {
      player1: {
        playerId: player1Profile.playerId,
        displayName: player1Profile.displayName,
        avatar: player1Profile.avatar,
        role: 'player1',
        color: isLudo ? null : 'X',
        connected: true,
        joinedAt: Date.now(),
      },
      player2: null,
    },
  };

  const initialGame = isLudo
    ? {
        pairId,
        gameType: 'ludo',
        colorSelection: {},
        tokens: createAll4InitialLudoTokens(),
        players: {
          player1: {
            playerId: player1Profile.playerId,
            displayName: player1Profile.displayName,
            avatar: player1Profile.avatar,
            color: null,
          },
          player2: null,
        },
        currentTurn: null,
        startingPlayer: null,
        turnPhase: 'waitingForRoll', // 'waitingForRoll' | 'waitingForMove' | 'game_over'
        diceValue: null,
        diceRolled: false,
        validTokenIds: [],
        status: 'waiting', // 'waiting' | 'color_selection' | 'playing' | 'finished'
        round: 1,
        winner: null,
        winnerColor: null,
        player1Wins: 0,
        player2Wins: 0,
        lastMove: null,
        updatedAt: Date.now(),
      }
    : {
        pairId,
        gameType: 'tictactoe',
        board: Array(9).fill(null),
        players: {
          player1: {
            playerId: player1Profile.playerId,
            displayName: player1Profile.displayName,
            avatar: player1Profile.avatar,
            color: 'X',
          },
          player2: null,
        },
        currentTurn: player1Profile.playerId,
        startingPlayer: player1Profile.playerId,
        status: 'waiting', // 'waiting' | 'playing' | 'finished'
        round: 1,
        winner: null,
        winningLine: null,
        player1Wins: 0,
        player2Wins: 0,
        draws: 0,
        nextGameAt: null,
        updatedAt: Date.now(),
      };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'privatePairs', pairId), pairData);
      await setDoc(doc(db, 'games', pairId), initialGame);
      return { pairData, initialGame };
    } catch (err) {
      console.error('Firestore create pair error:', err);
      throw err;
    }
  }

  // Local fallback
  localPairs.set(pairId, pairData);
  localGames.set(pairId, initialGame);
  const allP = getPersisted('pairs');
  allP[pairId] = pairData;
  setPersisted('pairs', allP);

  const allG = getPersisted('games');
  allG[pairId] = initialGame;
  setPersisted('games', allG);

  if (localChannel) {
    localChannel.postMessage({ type: 'PAIR_UPDATE', id: pairId, data: pairData });
    localChannel.postMessage({ type: 'GAME_UPDATE', id: pairId, data: initialGame });
  }

  return { pairData, initialGame };
}

export async function getPrivatePairFromDb(pairId) {
  if (!pairId) return null;
  const cleanId = pairId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'privatePairs', cleanId));
      if (snap.exists()) return snap.data();
    } catch (err) {
      console.warn('Firestore get pair error:', err);
    }
  }
  return localPairs.get(cleanId) || getPersisted('pairs')[cleanId] || null;
}

export async function joinPrivatePairInDb(pairId, player2Profile) {
  const cleanId = pairId.trim().toUpperCase();
  const pair = await getPrivatePairFromDb(cleanId);

  if (!pair) {
    throw new Error('Private Match not found. Please verify the code.');
  }

  const p1 = pair.players?.player1;
  const p2 = pair.players?.player2;
  const isP1 = p1?.playerId === player2Profile.playerId;
  const isP2 = p2?.playerId === player2Profile.playerId;

  if (isP1) {
    return { pairId: cleanId, isHost: true, gameType: pair.gameType };
  }
  if (isP2) {
    return { pairId: cleanId, isHost: false, gameType: pair.gameType };
  }

  if (p2 && p2.playerId !== player2Profile.playerId) {
    throw new Error('This match is already locked to 2 approved players.');
  }

  const isLudo = pair.gameType === 'ludo';

  const player2Data = {
    playerId: player2Profile.playerId,
    displayName: player2Profile.displayName,
    avatar: player2Profile.avatar,
    role: 'player2',
    color: isLudo ? null : 'O',
    connected: true,
    joinedAt: Date.now(),
  };

  const updates = {
    status: 'paired',
    [`participants.${player2Profile.playerId}`]: true,
    'players.player2': player2Data,
    updatedAt: Date.now(),
  };

  const gameUpdates = {
    status: isLudo ? 'color_selection' : 'playing',
    'players.player2': {
      playerId: player2Profile.playerId,
      displayName: player2Profile.displayName,
      avatar: player2Profile.avatar,
      color: isLudo ? null : 'O',
    },
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'privatePairs', cleanId), updates);
      await updateDoc(doc(db, 'games', cleanId), gameUpdates);
      return { pairId: cleanId, isHost: false, gameType: pair.gameType };
    } catch (err) {
      console.error('Join private pair error:', err);
      throw err;
    }
  }

  // Local fallback
  const existingPair = localPairs.get(cleanId) || getPersisted('pairs')[cleanId] || pair;
  existingPair.status = 'paired';
  existingPair.participants[player2Profile.playerId] = true;
  existingPair.players.player2 = player2Data;
  existingPair.updatedAt = Date.now();
  localPairs.set(cleanId, existingPair);

  const existingGame = localGames.get(cleanId) || getPersisted('games')[cleanId] || {};
  existingGame.status = isLudo ? 'color_selection' : 'playing';
  existingGame.players = existingGame.players || {};
  existingGame.players.player2 = {
    playerId: player2Profile.playerId,
    displayName: player2Profile.displayName,
    avatar: player2Profile.avatar,
    color: isLudo ? null : 'O',
  };
  localGames.set(cleanId, existingGame);

  if (localChannel) {
    localChannel.postMessage({ type: 'PAIR_UPDATE', id: cleanId, data: existingPair });
    localChannel.postMessage({ type: 'GAME_UPDATE', id: cleanId, data: existingGame });
  }

  notifyListeners(`pair_${cleanId}`, existingPair);
  notifyListeners(`game_${cleanId}`, existingGame);

  return { pairId: cleanId, isHost: false, gameType: pair.gameType };
}

export function subscribeToPrivatePair(pairId, callback) {
  if (!pairId) return () => {};
  const cleanId = pairId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        doc(db, 'privatePairs', cleanId),
        (snap) => {
          callback(snap.exists() ? snap.data() : null);
        },
        () => {
          const fallback = localPairs.get(cleanId) || getPersisted('pairs')[cleanId] || null;
          callback(fallback);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = `pair_${cleanId}`;
  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(callback);

  const current = localPairs.get(cleanId) || getPersisted('pairs')[cleanId] || null;
  callback(current);

  return () => {
    activeListeners.get(key)?.delete(callback);
  };
}

export async function updatePrivatePairInDb(pairId, updates) {
  if (!pairId) return false;
  const cleanId = pairId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const firestoreUpdates = normalizeFirestoreUpdates({
        ...updates,
        updatedAt: Date.now(),
      });
      await updateDoc(doc(db, 'privatePairs', cleanId), firestoreUpdates);
    } catch (err) {
      console.warn('Firestore pair update error:', err);
    }
  }

  const existing = localPairs.get(cleanId) || getPersisted('pairs')[cleanId] || {};
  const merged = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    const parts = key.split(/[/.]/);
    if (parts.length === 1) merged[parts[0]] = value;
    else if (parts.length === 2) merged[parts[0]] = { ...(merged[parts[0]] || {}), [parts[1]]: value };
    else if (parts.length === 3) {
      merged[parts[0]] = merged[parts[0]] || {};
      merged[parts[0]][parts[1]] = { ...(merged[parts[0]][parts[1]] || {}), [parts[2]]: value };
    }
  }
  merged.updatedAt = Date.now();
  localPairs.set(cleanId, merged);

  const allP = getPersisted('pairs');
  allP[cleanId] = merged;
  setPersisted('pairs', allP);

  if (localChannel) {
    localChannel.postMessage({ type: 'PAIR_UPDATE', id: cleanId, data: merged });
  }
  notifyListeners(`pair_${cleanId}`, merged);
  return true;
}

export async function setPlayerPresenceInMatch(pairId, playerId, isConnected) {
  if (!pairId || !playerId) return;
  const cleanId = pairId.trim().toUpperCase();
  const pair = await getPrivatePairFromDb(cleanId);
  if (!pair?.players) return;

  const isP1 = pair.players.player1?.playerId === playerId;
  const isP2 = pair.players.player2?.playerId === playerId;

  if (isP1) {
    await updatePrivatePairInDb(cleanId, {
      'players.player1.connected': isConnected,
      'players.player1.lastHeartbeat': Date.now(),
    });
  } else if (isP2) {
    await updatePrivatePairInDb(cleanId, {
      'players.player2.connected': isConnected,
      'players.player2.lastHeartbeat': Date.now(),
    });
  }
}

export async function playerLeaveMatchInDb(pairId, leavingPlayerId) {
  if (!pairId || !leavingPlayerId) return false;
  const cleanId = pairId.trim().toUpperCase();

  const pair = await getPrivatePairFromDb(cleanId);
  if (!pair) return false;

  const p1 = pair.players?.player1;
  const p2 = pair.players?.player2;
  const isP1 = p1?.playerId === leavingPlayerId;
  const isP2 = p2?.playerId === leavingPlayerId;

  if (!isP1 && !isP2) return false;

  const remainingPlayer = isP1 ? p2 : p1;
  const remainingPlayerId = remainingPlayer?.playerId;

  let gameData = null;
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'games', cleanId));
      if (snap.exists()) gameData = snap.data();
    } catch (e) {}
  }
  if (!gameData) {
    gameData = localGames.get(cleanId) || getPersisted('games')[cleanId] || {};
  }

  // If already finished with opponent_left, don't re-process duplicate
  if (gameData?.status === 'finished' && gameData?.finishReason === 'opponent_left') {
    return true;
  }

  const updates = {
    status: 'finished',
    finishReason: 'opponent_left',
    winner: remainingPlayerId || null,
    winnerId: remainingPlayerId || null,
    leftPlayerId: leavingPlayerId,
    nextGameAt: null,
    updatedAt: Date.now(),
  };

  if (remainingPlayerId) {
    if (isP1) {
      updates.player2Wins = (gameData.player2Wins || 0) + 1;
    } else {
      updates.player1Wins = (gameData.player1Wins || 0) + 1;
    }
  }

  await updateGameInDb(cleanId, updates);

  // Record win/loss statistics exactly once in career stats and permanent head-to-head
  if (p1 && p2 && remainingPlayerId) {
    try {
      await recordMatchResultInDb({
        matchId: `${cleanId}_leave_${gameData.round || 1}_${leavingPlayerId}`,
        pairId: cleanId,
        gameType: pair.gameType || 'tictactoe',
        round: gameData.round || 1,
        player1: p1,
        player2: p2,
        winnerId: remainingPlayerId,
        isDraw: false,
      });
    } catch (err) {
      console.warn('Record leave match stats error:', err);
    }
  }

  return true;
}

export async function playerDisconnectTimeoutInDb(pairId, disconnectedPlayerId) {
  if (!pairId || !disconnectedPlayerId) return false;
  const cleanId = pairId.trim().toUpperCase();

  const pair = await getPrivatePairFromDb(cleanId);
  if (!pair) return false;

  const p1 = pair.players?.player1;
  const p2 = pair.players?.player2;
  const isP1 = p1?.playerId === disconnectedPlayerId;
  const isP2 = p2?.playerId === disconnectedPlayerId;

  if (!isP1 && !isP2) return false;

  const remainingPlayer = isP1 ? p2 : p1;
  const remainingPlayerId = remainingPlayer?.playerId;

  let gameData = null;
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'games', cleanId));
      if (snap.exists()) gameData = snap.data();
    } catch (e) {}
  }
  if (!gameData) {
    gameData = localGames.get(cleanId) || getPersisted('games')[cleanId] || {};
  }

  if (gameData?.status === 'finished') {
    return true; // Already finished
  }

  const updates = {
    status: 'finished',
    finishReason: 'opponent_disconnected',
    winner: remainingPlayerId || null,
    winnerId: remainingPlayerId || null,
    disconnectedPlayerId: disconnectedPlayerId,
    nextGameAt: null,
    updatedAt: Date.now(),
  };

  if (remainingPlayerId) {
    if (isP1) {
      updates.player2Wins = (gameData.player2Wins || 0) + 1;
    } else {
      updates.player1Wins = (gameData.player1Wins || 0) + 1;
    }
  }

  await updateGameInDb(cleanId, updates);

  if (p1 && p2 && remainingPlayerId) {
    try {
      await recordMatchResultInDb({
        matchId: `${cleanId}_disconnect_${gameData.round || 1}_${disconnectedPlayerId}`,
        pairId: cleanId,
        gameType: pair.gameType || 'tictactoe',
        round: gameData.round || 1,
        player1: p1,
        player2: p2,
        winnerId: remainingPlayerId,
        isDraw: false,
      });
    } catch (err) {
      console.warn('Record disconnect match stats error:', err);
    }
  }

  return true;
}

export async function updateGameInDb(pairId, updates) {
  if (!pairId) return false;
  const cleanId = pairId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const firestoreUpdates = normalizeFirestoreUpdates({
        ...updates,
        updatedAt: Date.now(),
      });
      await updateDoc(doc(db, 'games', cleanId), firestoreUpdates);
      return true;
    } catch (err) {
      console.error('Firestore game update error:', err);
      throw err;
    }
  }

  const existing = localGames.get(cleanId) || getPersisted('games')[cleanId] || {};
  const merged = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    const parts = key.split(/[/.]/);
    if (parts.length === 1) {
      if (key === 'tokens' && typeof value === 'object' && value !== null) {
        merged.tokens = {
          ...(existing.tokens || createAll4InitialLudoTokens()),
          ...value,
        };
      } else {
        merged[parts[0]] = value;
      }
    } else if (parts.length === 2) {
      merged[parts[0]] = { ...(merged[parts[0]] || {}), [parts[1]]: value };
    } else if (parts.length === 3) {
      merged[parts[0]] = merged[parts[0]] || {};
      merged[parts[0]][parts[1]] = { ...(merged[parts[0]][parts[1]] || {}), [parts[2]]: value };
    }
  }
  merged.updatedAt = Date.now();
  localGames.set(cleanId, merged);

  const allG = getPersisted('games');
  allG[cleanId] = merged;
  setPersisted('games', allG);

  if (localChannel) {
    localChannel.postMessage({ type: 'GAME_UPDATE', id: cleanId, data: merged });
  }
  notifyListeners(`game_${cleanId}`, merged);
  return true;
}

export function subscribeToGame(pairId, callback) {
  if (!pairId) return () => {};
  const cleanId = pairId.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        doc(db, 'games', cleanId),
        (snap) => {
          callback(snap.exists() ? snap.data() : null);
        },
        () => {
          const fallback = localGames.get(cleanId) || getPersisted('games')[cleanId] || null;
          callback(fallback);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = `game_${cleanId}`;
  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(callback);

  const current = localGames.get(cleanId) || getPersisted('games')[cleanId] || null;
  callback(current);

  return () => {
    activeListeners.get(key)?.delete(callback);
  };
}

/* ==========================================================================
   4. PERMANENT HEAD-TO-HEAD PLAYER RELATIONSHIPS & MATCH STATS
   ========================================================================== */

/**
 * Derives mutual friends from a user's profile
 */
export function getMutualFriends(userData) {
  if (!userData) return [];
  const following = userData.following || {};
  const followers = userData.followers || {};

  const friends = [];
  const seen = new Set();

  for (const [pId, info] of Object.entries(following)) {
    if (followers[pId] && !seen.has(pId)) {
      seen.add(pId);
      friends.push({
        playerId: pId,
        displayName: info.displayName || followers[pId]?.displayName || 'Player',
        avatar: info.avatar || followers[pId]?.avatar || 'fox',
        friendedAt: Math.max(info.followedAt || 0, followers[pId]?.followedAt || 0),
      });
    }
  }

  return friends;
}

/**
 * Creates or retrieves a permanent relationship record between two Player IDs
 */
export async function getOrCreateRelationshipInDb(userA, userB) {
  if (!userA?.playerId || !userB?.playerId) return null;
  const relId = getRelationshipId(userA.playerId, userB.playerId);
  if (!relId) return null;

  const idA = String(userA.playerId).trim().toUpperCase();
  const idB = String(userB.playerId).trim().toUpperCase();

  // Try Firestore
  if (isFirebaseConfigured && db) {
    try {
      const relRef = doc(db, 'playerRelationships', relId);
      const snap = await getDoc(relRef);
      if (snap.exists()) {
        const data = snap.data();
        localRelationships.set(relId, data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore relationship fetch warning:', e);
    }
  }

  // Check local fallback
  const existingLocal = localRelationships.get(relId) || getPersisted('relationships')[relId];
  if (existingLocal) return existingLocal;

  // Initialize new permanent relationship
  const newRelationship = {
    relationshipId: relId,
    players: {
      [idA]: true,
      [idB]: true,
    },
    participantProfiles: {
      [idA]: {
        playerId: idA,
        displayName: userA.displayName || 'Player 1',
        avatar: userA.avatar || 'fox',
      },
      [idB]: {
        playerId: idB,
        displayName: userB.displayName || 'Player 2',
        avatar: userB.avatar || 'cat',
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stats: {
      totalMatches: 0,
      [idA]: { wins: 0 },
      [idB]: { wins: 0 },
      draws: 0,
    },
    games: {
      tictactoe: {
        matchesPlayed: 0,
        [idA]: { wins: 0 },
        [idB]: { wins: 0 },
        draws: 0,
      },
      ludo: {
        matchesPlayed: 0,
        [idA]: { wins: 0 },
        [idB]: { wins: 0 },
      },
    },
    matchHistory: [],
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'playerRelationships', relId), newRelationship, { merge: true });
    } catch (e) {
      console.warn('Failed to create relationship in Firestore:', e);
    }
  }

  localRelationships.set(relId, newRelationship);
  const allRel = getPersisted('relationships');
  allRel[relId] = newRelationship;
  setPersisted('relationships', allRel);

  if (localChannel) {
    localChannel.postMessage({ type: 'REL_UPDATE', id: relId, data: newRelationship });
  }
  notifyListeners(`rel_${relId}`, newRelationship);

  return newRelationship;
}

/**
 * Subscribes to real-time updates for a specific player relationship
 */
export function subscribeToRelationship(arg1, arg2, arg3) {
  let cleanId = null;
  let callback = null;

  if (typeof arg2 === 'function') {
    cleanId = (arg1 || '').trim().toUpperCase();
    callback = arg2;
  } else if (typeof arg3 === 'function') {
    cleanId = getRelationshipId(arg1, arg2);
    callback = arg3;
  }

  if (!cleanId || !callback) return () => {};

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        doc(db, 'playerRelationships', cleanId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            localRelationships.set(cleanId, data);
            callback(data);
          } else {
            callback(null);
          }
        },
        () => {
          const fallback = localRelationships.get(cleanId) || getPersisted('relationships')[cleanId] || null;
          callback(fallback);
        }
      );
      return unsub;
    } catch (e) {}
  }

  const key = `rel_${cleanId}`;
  if (!activeListeners.has(key)) activeListeners.set(key, new Set());
  activeListeners.get(key).add(callback);

  const current = localRelationships.get(cleanId) || getPersisted('relationships')[cleanId] || null;
  callback(current);

  return () => {
    activeListeners.get(key)?.delete(callback);
  };
}

/**
 * Fetches all permanent relationships for a player
 */
export async function getUserRelationshipsInDb(playerId) {
  if (!playerId) return [];
  const cleanId = String(playerId).trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'playerRelationships'),
        where(`players.${cleanId}`, '==', true)
      );
      const snap = await getDocs(q);
      const results = [];
      snap.forEach((d) => results.push(d.data()));
      return results;
    } catch (e) {
      console.warn('Firestore user relationships query warning:', e);
    }
  }

  const allRel = getPersisted('relationships');
  return Object.values(allRel).filter((r) => r.players && r.players[cleanId]);
}

/**
 * Record a completed match result exactly once across:
 * 1. Player A user statistics
 * 2. Player B user statistics
 * 3. Permanent head-to-head relationship
 */
export async function recordMatchResultInDb({
  matchId,
  pairId,
  gameType,
  player1,
  player2,
  winnerId,
  isDraw = false,
  round = 1,
}) {
  if (!player1?.playerId || !player2?.playerId) return false;

  const id1 = String(player1.playerId).trim().toUpperCase();
  const id2 = String(player2.playerId).trim().toUpperCase();
  const gType = (gameType || 'tictactoe').toLowerCase();
  const winId = winnerId ? String(winnerId).trim().toUpperCase() : null;

  const uniqueMatchKey = matchId || `${pairId || 'match'}_${gType}_r${round}_${id1}_${id2}`;

  if (processedMatches.has(uniqueMatchKey)) {
    return false; // Already processed, guarantee strictly once!
  }
  processedMatches.add(uniqueMatchKey);

  // 1. Get or create head-to-head relationship
  const rel = await getOrCreateRelationshipInDb(player1, player2);
  const relId = rel?.relationshipId || getRelationshipId(id1, id2);

  // 2. Compute updated relationship stats
  const relStats = { ...(rel?.stats || {}) };
  relStats.totalMatches = (relStats.totalMatches || 0) + 1;
  relStats[id1] = { wins: (relStats[id1]?.wins || 0) + (winId === id1 ? 1 : 0) };
  relStats[id2] = { wins: (relStats[id2]?.wins || 0) + (winId === id2 ? 1 : 0) };
  if (isDraw || winId === 'DRAW') {
    relStats.draws = (relStats.draws || 0) + 1;
  }

  const gameCategory = gType === 'ludo' ? 'ludo' : 'tictactoe';
  const relGames = { ...(rel?.games || {}) };
  const currentCategoryStats = { ...(relGames[gameCategory] || {}) };

  currentCategoryStats.matchesPlayed = (currentCategoryStats.matchesPlayed || 0) + 1;
  currentCategoryStats[id1] = {
    wins: (currentCategoryStats[id1]?.wins || 0) + (winId === id1 ? 1 : 0),
  };
  currentCategoryStats[id2] = {
    wins: (currentCategoryStats[id2]?.wins || 0) + (winId === id2 ? 1 : 0),
  };
  if (isDraw || winId === 'DRAW') {
    currentCategoryStats.draws = (currentCategoryStats.draws || 0) + 1;
  }
  relGames[gameCategory] = currentCategoryStats;

  const matchRecord = {
    matchId: uniqueMatchKey,
    pairId: pairId || null,
    gameType: gType,
    round,
    players: {
      [id1]: { displayName: player1.displayName || 'Player 1', avatar: player1.avatar || 'fox' },
      [id2]: { displayName: player2.displayName || 'Player 2', avatar: player2.avatar || 'cat' },
    },
    winner: winId,
    isDraw: Boolean(isDraw || winId === 'DRAW'),
    completedAt: Date.now(),
  };

  const updatedHistory = [matchRecord, ...(rel?.matchHistory || [])].slice(0, 50);

  const updatedRelationship = {
    ...rel,
    updatedAt: Date.now(),
    stats: relStats,
    games: relGames,
    matchHistory: updatedHistory,
  };

  // 3. Update both players' individual user statistics in Firestore & local
  async function updateUserStats(pId, isWinner) {
    const uData = (await getUserData(pId)) || { playerId: pId };
    const currentStats = uData.stats || {
      matchesPlayed: 0,
      matchesWon: 0,
      tttMatches: 0,
      tttWins: 0,
      tttLosses: 0,
      tttDraws: 0,
      ludoMatches: 0,
      ludoWins: 0,
      ludoLosses: 0,
    };

    const isThisDraw = Boolean(isDraw || winId === 'DRAW');
    const isThisLoss = !isWinner && !isThisDraw;

    const newStats = {
      ...currentStats,
      matchesPlayed: (currentStats.matchesPlayed || 0) + 1,
      matchesWon: (currentStats.matchesWon || 0) + (isWinner ? 1 : 0),
      // TTT specific
      tttMatches: (currentStats.tttMatches || currentStats.ticTacToePlayed || 0) + (gameCategory === 'tictactoe' ? 1 : 0),
      tttWins: (currentStats.tttWins || currentStats.ticTacToeWon || 0) + (gameCategory === 'tictactoe' && isWinner ? 1 : 0),
      tttLosses: (currentStats.tttLosses || 0) + (gameCategory === 'tictactoe' && isThisLoss ? 1 : 0),
      tttDraws: (currentStats.tttDraws || 0) + (gameCategory === 'tictactoe' && isThisDraw ? 1 : 0),
      // Ludo specific
      ludoMatches: (currentStats.ludoMatches || currentStats.ludoPlayed || 0) + (gameCategory === 'ludo' ? 1 : 0),
      ludoWins: (currentStats.ludoWins || currentStats.ludoWon || 0) + (gameCategory === 'ludo' && isWinner ? 1 : 0),
      ludoLosses: (currentStats.ludoLosses || 0) + (gameCategory === 'ludo' && isThisLoss ? 1 : 0),
      // Backward compatibility aliases
      ticTacToePlayed: (currentStats.tttMatches || currentStats.ticTacToePlayed || 0) + (gameCategory === 'tictactoe' ? 1 : 0),
      ticTacToeWon: (currentStats.tttWins || currentStats.ticTacToeWon || 0) + (gameCategory === 'tictactoe' && isWinner ? 1 : 0),
      ludoPlayed: (currentStats.ludoMatches || currentStats.ludoPlayed || 0) + (gameCategory === 'ludo' ? 1 : 0),
      ludoWon: (currentStats.ludoWins || currentStats.ludoWon || 0) + (gameCategory === 'ludo' && isWinner ? 1 : 0),
    };

    await writeUserData(pId, { stats: newStats });
  }

  try {
    await Promise.all([
      updateUserStats(id1, winId === id1),
      updateUserStats(id2, winId === id2),
    ]);
  } catch (e) {
    console.warn('Failed to update individual user stats:', e);
  }

  // 4. Save updated relationship in Firestore & local stores
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'playerRelationships', relId), updatedRelationship, { merge: true });
    } catch (e) {
      console.warn('Failed to update relationship in Firestore:', e);
    }
  }

  localRelationships.set(relId, updatedRelationship);
  const allRel = getPersisted('relationships');
  allRel[relId] = updatedRelationship;
  setPersisted('relationships', allRel);

  if (localChannel) {
    localChannel.postMessage({ type: 'REL_UPDATE', id: relId, data: updatedRelationship });
  }
  notifyListeners(`rel_${relId}`, updatedRelationship);

  return updatedRelationship;
}

/**
 * Convenience export aliases and helpers for Profile and Social interactions
 */
export const subscribeToUserProfileInDb = (playerId, callback) => {
  return subscribeToUserSocial(playerId, callback);
};

export const subscribeToRelationshipInDb = (relationshipId, callback) => {
  return subscribeToRelationship(relationshipId, callback);
};

export const subscribeToSocialInDb = (playerId, callback) => {
  return subscribeToUserSocial(playerId, (userData) => {
    if (!userData) {
      callback({ following: [], followers: [], friends: [] });
      return;
    }
    const following = Object.keys(userData.following || {});
    const followers = Object.keys(userData.followers || {});
    const friends = following.filter((id) => followers.includes(id));
    callback({ following, followers, friends });
  });
};

export async function followPlayerInDb(followerProfile, targetProfile) {
  return followUserInDb(followerProfile.playerId, targetProfile);
}

export async function unfollowPlayerInDb(followerId, targetId) {
  return unfollowUserInDb(followerId, targetId);
}

export async function saveUserProfileToDb(profile) {
  if (!profile?.playerId) return null;
  return writeUserData(profile.playerId, profile);
}

export async function getAllUsersFromDb() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = [];
      snap.forEach((d) => list.push(d.data()));
      return list;
    } catch (e) {}
  }
  const allUsers = getPersisted('users');
  return Object.values(allUsers);
}

/**
 * Atomic Ludo Color Reservation
 * Uses Firestore runTransaction to prevent race conditions when two players choose colors.
 */
export async function reserveLudoColorInDb(pairId, playerId, chosenColor, playerProfile) {
  if (!pairId || !playerId || !chosenColor) return { success: false };
  const cleanId = pairId.trim().toUpperCase();

  const createInitial4Tokens = () => [
    { id: 0, step: -1 },
    { id: 1, step: -1 },
    { id: 2, step: -1 },
    { id: 3, step: -1 },
  ];

  if (isFirebaseConfigured && db) {
    try {
      const gameRef = doc(db, 'games', cleanId);
      const pairRef = doc(db, 'privatePairs', cleanId);

      const result = await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) {
          throw new Error('Game session not found');
        }
        const game = gameSnap.data();
        const colorSelection = game.colorSelection || {};

        // 1. Check whether chosenColor is taken by another player
        const existingReservation = colorSelection[chosenColor];
        if (existingReservation && existingReservation.playerId && existingReservation.playerId !== playerId) {
          throw new Error(`Color ${chosenColor} is already reserved by ${existingReservation.displayName || 'opponent'}`);
        }

        // 2. Release any previous color held by this player
        const updatedColorSelection = { ...colorSelection };
        for (const [col, res] of Object.entries(updatedColorSelection)) {
          if (res?.playerId === playerId) {
            delete updatedColorSelection[col];
          }
        }

        // 3. Reserve the selected color
        updatedColorSelection[chosenColor] = {
          playerId,
          displayName: playerProfile?.displayName || 'Player',
          avatar: playerProfile?.avatar || 'fox',
          selectedAt: Date.now(),
        };

        const isP1 = game.players?.player1?.playerId === playerId;
        const p1 = game.players?.player1 ? { ...game.players.player1 } : null;
        const p2 = game.players?.player2 ? { ...game.players.player2 } : null;

        if (isP1 && p1) {
          p1.color = chosenColor;
        } else if (p2) {
          p2.color = chosenColor;
        }

        const p1Color = isP1 ? chosenColor : p1?.color;
        const p2Color = !isP1 ? chosenColor : p2?.color;

        // 4. Check if both players have selected distinct colors
        const bothSelected = Boolean(p1Color && p2Color && p1Color !== p2Color);

        // Red starts first if present, otherwise Player 1 starts
        let starterId = p1?.playerId || playerId;
        if (p1Color === 'red') {
          starterId = p1?.playerId;
        } else if (p2Color === 'red') {
          starterId = p2?.playerId;
        }

        const updates = {
          colorSelection: updatedColorSelection,
          'players.player1': p1,
          'players.player2': p2,
          status: bothSelected ? 'playing' : 'color_selection',
          updatedAt: Date.now(),
        };

        if (bothSelected) {
          updates.tokens = createAll4InitialLudoTokens();
          updates.currentTurn = starterId;
          updates.startingPlayer = starterId;
          updates.turnPhase = 'waitingForRoll';
          updates.diceValue = null;
          updates.pendingDice = [];
          updates.selectedDiceIndex = 0;
          updates.consecutiveSixes = 0;
          updates.bonusRolls = 0;
          updates.diceRolled = false;
          updates.validTokenIds = [];
          updates.isMandatoryCapture = false;
          updates.capturingTokenIds = [];
        }

        transaction.update(gameRef, normalizeFirestoreUpdates(updates));
        return { success: true, bothSelected, color: chosenColor };
      });

      return result;
    } catch (err) {
      console.warn('Firestore color reservation transaction notice:', err);
    }
  }

  // Local / offline fallback with atomic check
  const existingGame = localGames.get(cleanId) || getPersisted('games')[cleanId] || {};
  const colorSelection = existingGame.colorSelection || {};

  const existingRes = colorSelection[chosenColor];
  if (existingRes && existingRes.playerId && existingRes.playerId !== playerId) {
    return { success: false, reason: 'taken' };
  }

  const updatedColorSelection = { ...colorSelection };
  for (const [col, res] of Object.entries(updatedColorSelection)) {
    if (res?.playerId === playerId) {
      delete updatedColorSelection[col];
    }
  }
  updatedColorSelection[chosenColor] = {
    playerId,
    displayName: playerProfile?.displayName || 'Player',
    avatar: playerProfile?.avatar || 'fox',
    selectedAt: Date.now(),
  };

  const isP1 = existingGame.players?.player1?.playerId === playerId;
  const p1 = existingGame.players?.player1 ? { ...existingGame.players.player1 } : null;
  const p2 = existingGame.players?.player2 ? { ...existingGame.players.player2 } : null;

  if (isP1 && p1) {
    p1.color = chosenColor;
  } else if (p2) {
    p2.color = chosenColor;
  }

  const p1Color = isP1 ? chosenColor : p1?.color;
  const p2Color = !isP1 ? chosenColor : p2?.color;
  const bothSelected = Boolean(p1Color && p2Color && p1Color !== p2Color);

  let starterId = p1?.playerId || playerId;
  if (p1Color === 'red') {
    starterId = p1?.playerId;
  } else if (p2Color === 'red') {
    starterId = p2?.playerId;
  }

  const updates = {
    colorSelection: updatedColorSelection,
    players: {
      player1: p1,
      player2: p2,
    },
    status: bothSelected ? 'playing' : 'color_selection',
    updatedAt: Date.now(),
  };

  if (bothSelected) {
    updates.tokens = createAll4InitialLudoTokens();
    updates.currentTurn = starterId;
    updates.startingPlayer = starterId;
    updates.turnPhase = 'waitingForRoll';
    updates.diceValue = null;
    updates.pendingDice = [];
    updates.selectedDiceIndex = 0;
    updates.consecutiveSixes = 0;
    updates.bonusRolls = 0;
    updates.diceRolled = false;
    updates.validTokenIds = [];
    updates.isMandatoryCapture = false;
    updates.capturingTokenIds = [];
  }

  await updateGameInDb(cleanId, updates);
  return { success: true, bothSelected, color: chosenColor };
}

