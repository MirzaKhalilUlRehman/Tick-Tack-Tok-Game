/**
 * Ludo Game Service & Rules Engine for KM
 * Supports 2-Player Real-Time Ludo (Red vs Yellow) with synchronized turns, locks, and stats recording.
 */
import { updateGameInDb, recordMatchResultInDb, reserveLudoColorInDb } from '../firebase/database';
import { updateStoredStats } from '../utils/storage';
import {
  TRACK_COORDINATES,
  HOME_LANES,
  BASE_YARD_SLOTS,
  PLAYER_OFFSETS,
  TOTAL_TRACK_CELLS,
  GOAL_STEP,
  getTokenGridCoordinates,
  isCellSafe,
  stepToGlobalTrackIndex,
} from '../utils/ludoBoardPath';
import {
  getValidMovableTokens,
  canTokenMove,
  isWinningTokens,
  getCapturingTokens,
  getMovableTokensWithMandatoryCapture,
  getLegalMovesForDice,
  getStackedTokensMap,
} from '../utils/ludoValidation';
import {
  createInitialTokens,
  createInitialLudoGameState,
  computeRollDiceState,
  computeMoveTokenState,
  normalizeAllTokens,
  resolvePlayerColor,
  resolveOpponent,
  ALL_LUDO_COLORS,
} from '../utils/ludoLogic';

const ludoLocks = new Set();

// Re-export for component consumption
export {
  TRACK_COORDINATES,
  HOME_LANES,
  BASE_YARD_SLOTS,
  PLAYER_OFFSETS,
  TOTAL_TRACK_CELLS,
  GOAL_STEP,
  getTokenGridCoordinates,
  getTokenGridCoordinates as getTokenCoordinates,
  isCellSafe,
  isCellSafe as isSafeCell,
  stepToGlobalTrackIndex,
  getValidMovableTokens,
  canTokenMove,
  isWinningTokens,
  isWinningTokens as checkLudoWin,
  getCapturingTokens,
  getMovableTokensWithMandatoryCapture,
  getLegalMovesForDice,
  getStackedTokensMap,
  createInitialTokens,
  createInitialLudoGameState,
  normalizeAllTokens,
  resolvePlayerColor,
  resolveOpponent,
  ALL_LUDO_COLORS,
  reserveLudoColorInDb,
};

/**
 * Atomically selects player color (Red, Green, Blue, or Yellow) with Firestore runTransaction
 */
export async function selectLudoColor(pairId, gameData, playerId, chosenColor, playerProfile) {
  if (!pairId || !playerId || !chosenColor) return { success: false };
  return reserveLudoColorInDb(pairId, playerId, chosenColor, playerProfile);
}

/**
 * Selects a specific pending die value from pendingDice queue
 */
export async function selectPendingDiceIndex(pairId, gameData, playerId, diceIndex) {
  if (!gameData || gameData.currentTurn !== playerId) return;
  const pendingDice = gameData.pendingDice || [];
  if (diceIndex < 0 || diceIndex >= pendingDice.length) return;

  const targetDieValue = pendingDice[diceIndex];
  const playerColor = resolvePlayerColor(gameData, playerId);
  const { opponentColor } = resolveOpponent(gameData, playerId);

  const allTokens = normalizeAllTokens(gameData?.tokens);
  const playerTokens = allTokens[playerColor];
  const opponentTokens = allTokens[opponentColor];

  const legalMoves = getLegalMovesForDice(
    playerColor,
    playerTokens,
    [targetDieValue],
    opponentColor,
    opponentTokens
  );

  await updateGameInDb(pairId, {
    selectedDiceIndex: diceIndex,
    diceValue: targetDieValue,
    validTokenIds: legalMoves.validTokenIds,
    isMandatoryCapture: false,
    capturingTokenIds: legalMoves.capturingTokenIds,
    lastActionMessage: null,
    updatedAt: Date.now(),
  });
}

/**
 * Rolls the dice for the active player
 */
export async function rollLudoDice(pairId, gameData, playerId) {
  if (!gameData || gameData.status !== 'playing') {
    throw new Error('Game is not currently active');
  }

  if (gameData.currentTurn !== playerId) {
    throw new Error('It is not your turn to roll');
  }

  const turnPhase = gameData.turnPhase;
  if (turnPhase !== 'waitingForRoll' && turnPhase !== 'roll') {
    throw new Error('Dice has already been rolled for this turn');
  }

  const lockKey = `${pairId}_roll_${gameData.round || 1}_${playerId}`;
  if (ludoLocks.has(lockKey)) return null;
  ludoLocks.add(lockKey);

  try {
    // Generate cryptographically fair 1-6 roll
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const updates = computeRollDiceState(gameData, playerId, diceValue);

    await updateGameInDb(pairId, updates);

    return { diceValue, updates };
  } finally {
    setTimeout(() => {
      ludoLocks.delete(lockKey);
    }, 1200);
  }
}

/**
 * Moves a selected token for the active player
 */
export async function moveLudoToken(pairId, gameData, tokenId, playerId, diceIndex = null) {
  if (!gameData || gameData.status !== 'playing') {
    throw new Error('Game is not currently active');
  }

  if (gameData.currentTurn !== playerId) {
    throw new Error('It is not your turn');
  }

  const turnPhase = gameData.turnPhase;
  if (turnPhase !== 'waitingForMove' && turnPhase !== 'move') {
    throw new Error('Please roll the dice first');
  }

  const lockKey = `${pairId}_move_${gameData.round || 1}_${tokenId}`;
  if (ludoLocks.has(lockKey)) return;
  ludoLocks.add(lockKey);

  try {
    const isP1 = gameData.players?.player1?.playerId === playerId;
    const updates = computeMoveTokenState(gameData, tokenId, playerId, diceIndex);

    if (updates.status === 'finished') {
      const p1 = gameData.players?.player1;
      const p2 = gameData.players?.player2;

      if (isP1) {
        updateStoredStats((s) => ({ ...s, ludoWins: (s.ludoWins || 0) + 1 }));
      } else {
        updateStoredStats((s) => ({ ...s, ludoLosses: (s.ludoLosses || 0) + 1 }));
      }

      // Record career stats & permanent head-to-head match history in Firebase
      try {
        if (p1 && p2) {
          await recordMatchResultInDb({
            matchId: `${pairId}_ludo_r${gameData.round || 1}`,
            pairId,
            gameType: 'ludo',
            round: gameData.round || 1,
            player1: p1,
            player2: p2,
            winnerId: playerId,
            isDraw: false,
          });
        }
      } catch (err) {
        console.warn('Record Ludo match result warning:', err);
      }
    }

    await updateGameInDb(pairId, updates);
  } finally {
    setTimeout(() => {
      ludoLocks.delete(lockKey);
    }, 1200);
  }
}

/**
 * Passes the turn when no valid moves are possible
 */
export async function passLudoTurn(pairId, gameData) {
  if (!gameData || gameData.status !== 'playing') return;

  const currentTurn = gameData.currentTurn;
  const lockKey = `${pairId}_pass_${gameData.round || 1}_${currentTurn}`;
  if (ludoLocks.has(lockKey)) return;
  ludoLocks.add(lockKey);

  try {
    const isP1 = gameData.players?.player1?.playerId === currentTurn;
    const opponentId = isP1
      ? gameData.players?.player2?.playerId
      : gameData.players?.player1?.playerId;

    await updateGameInDb(pairId, {
      currentTurn: opponentId,
      turnPhase: 'waitingForRoll',
      diceValue: null,
      pendingDice: [],
      selectedDiceIndex: 0,
      consecutiveSixes: 0,
      bonusRolls: 0,
      diceRolled: false,
      validTokenIds: [],
      isMandatoryCapture: false,
      capturingTokenIds: [],
      lastActionMessage: null,
      updatedAt: Date.now(),
    });
  } finally {
    setTimeout(() => {
      ludoLocks.delete(lockKey);
    }, 1500);
  }
}

/**
 * Starts next Ludo round / match with reset board
 */
export async function resetLudoGame(pairId, gameData) {
  if (!gameData) return;

  const currentRound = gameData.round || 1;
  const lockKey = `${pairId}_ludo_reset_${currentRound}`;
  if (ludoLocks.has(lockKey)) return;
  ludoLocks.add(lockKey);

  try {
    const p1Id = gameData.players?.player1?.playerId;
    const p2Id = gameData.players?.player2?.playerId;
    const nextRound = currentRound + 1;

    // Alternate starting player each round
    const nextStarterId = nextRound % 2 === 1 ? p1Id : p2Id;
    const p1Color = gameData.players?.player1?.color || 'red';
    const p2Color = gameData.players?.player2?.color || 'yellow';

    await updateGameInDb(pairId, {
      tokens: normalizeAllTokens(null),
      currentTurn: nextStarterId,
      startingPlayer: nextStarterId,
      status: 'playing',
      winner: null,
      winnerColor: null,
      turnPhase: 'waitingForRoll',
      diceValue: null,
      pendingDice: [],
      selectedDiceIndex: 0,
      consecutiveSixes: 0,
      bonusRolls: 0,
      diceRolled: false,
      validTokenIds: [],
      isMandatoryCapture: false,
      capturingTokenIds: [],
      round: nextRound,
      lastMove: null,
      lastActionMessage: null,
      nextGameAt: null,
      updatedAt: Date.now(),
    });
  } finally {
    setTimeout(() => {
      ludoLocks.delete(lockKey);
    }, 2500);
  }
}
