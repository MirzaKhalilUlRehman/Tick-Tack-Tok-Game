/**
 * 2-Player Private Match Session Service for KM
 * Manages Tic Tac Toe & Ludo match lifecycle.
 */
import { generateRoomId } from '../utils/idGenerator';
import {
  createPrivatePairInDb,
  getPrivatePairFromDb,
  joinPrivatePairInDb,
  subscribeToPrivatePair,
  subscribeToGame,
  updateGameInDb,
  playerLeaveMatchInDb,
  playerDisconnectTimeoutInDb,
  setPlayerPresenceInMatch,
} from '../firebase/database';

export async function createPrivatePair(player1Profile, gameType = 'tictactoe') {
  const pairId = generateRoomId();
  const { pairData, initialGame } = await createPrivatePairInDb(pairId, player1Profile, gameType);
  return { pairId, pairData, initialGame };
}

export async function joinPrivatePair(pairId, player2Profile) {
  return await joinPrivatePairInDb(pairId, player2Profile);
}

export async function getPrivatePair(pairId) {
  return await getPrivatePairFromDb(pairId);
}

export function subscribePrivatePair(pairId, callback) {
  return subscribeToPrivatePair(pairId, callback);
}

export function subscribeGameSession(pairId, callback) {
  return subscribeToGame(pairId, callback);
}

export async function leaveMatchIntentionally(pairId, leavingPlayerId) {
  try {
    return await playerLeaveMatchInDb(pairId, leavingPlayerId);
  } catch (e) {
    console.error('Error in leaveMatchIntentionally:', e);
    return false;
  }
}

export async function handleOpponentDisconnectTimeout(pairId, disconnectedPlayerId) {
  try {
    return await playerDisconnectTimeoutInDb(pairId, disconnectedPlayerId);
  } catch (e) {
    console.error('Error in handleOpponentDisconnectTimeout:', e);
    return false;
  }
}

export async function setMatchPresence(pairId, playerId, isConnected) {
  try {
    return await setPlayerPresenceInMatch(pairId, playerId, isConnected);
  } catch (e) {
    console.error('Error in setMatchPresence:', e);
  }
}

export async function leavePrivatePair(pairId, playerId) {
  try {
    return await playerLeaveMatchInDb(pairId, playerId);
  } catch (e) {
    console.error('Error leaving private match:', e);
  }
}
