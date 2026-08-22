/**
 * 2-Player Private Match Session Service for KM
 * Manages Tic Tac Toe match lifecycle.
 */
import { generateRoomId } from '../utils/idGenerator';
import {
  createPrivatePairInDb,
  getPrivatePairFromDb,
  joinPrivatePairInDb,
  subscribeToPrivatePair,
  subscribeToGame,
  updateGameInDb,
} from '../firebase/database';

export async function createPrivatePair(player1Profile) {
  const pairId = generateRoomId();
  const { pairData, initialGame } = await createPrivatePairInDb(pairId, player1Profile);
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

export async function leavePrivatePair(pairId, playerId) {
  try {
    const pair = await getPrivatePairFromDb(pairId);
    if (!pair) return;
    await updateGameInDb(pairId, { status: 'waiting' });
  } catch (e) {
    console.error('Error leaving private match:', e);
  }
}
