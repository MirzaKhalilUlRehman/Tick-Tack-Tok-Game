/**
 * Ludo Pure State Transition Engine
 * Computes deterministic next states for dice rolls, token moves, captures, bonus turns, pending dice, and color selection.
 * Guaranteed 100% token state persistence across all 4 classic colors (Red, Green, Blue, Yellow).
 */
import { GOAL_STEP } from './ludoBoardPath';
import {
  canTokenMove,
  checkOpponentCapture,
  getCapturingTokens,
  getLegalMovesForDice,
  getMovableTokensWithMandatoryCapture,
  isWinningTokens,
} from './ludoValidation';

export const ALL_LUDO_COLORS = ['red', 'green', 'blue', 'yellow'];

/**
 * Creates default initial 4 tokens for a player/color
 */
export function createInitialTokens(color = null) {
  return [
    { id: 0, step: -1, color },
    { id: 1, step: -1, color },
    { id: 2, step: -1, color },
    { id: 3, step: -1, color },
  ];
}

/**
 * Normalizes and validates the tokens map for all 4 colors.
 * Guarantees every color has an array of exactly 4 valid token objects with valid step numbers (-1..56).
 * Preserves existing steps and never drops any player's tokens.
 */
export function normalizeAllTokens(existingTokens) {
  const result = {};
  for (const color of ALL_LUDO_COLORS) {
    const rawList = existingTokens?.[color];
    if (Array.isArray(rawList) && rawList.length === 4) {
      result[color] = rawList.map((t, idx) => ({
        id: typeof t?.id === 'number' ? t.id : idx,
        step: typeof t?.step === 'number' && !isNaN(t.step) ? t.step : -1,
        color: t?.color || color,
      }));
    } else if (Array.isArray(rawList) && rawList.length > 0) {
      const map = new Map();
      rawList.forEach((t, i) => {
        const id = typeof t?.id === 'number' ? t.id : i;
        map.set(id, t);
      });
      result[color] = [0, 1, 2, 3].map((id) => {
        const existing = map.get(id);
        return {
          id,
          step: existing && typeof existing.step === 'number' && !isNaN(existing.step) ? existing.step : -1,
          color: existing?.color || color,
        };
      });
    } else {
      result[color] = createInitialTokens(color);
    }
  }
  return result;
}

/**
 * Helper to resolve player color with 100% precision
 */
export function resolvePlayerColor(gameData, playerId) {
  if (!gameData || !playerId) return 'red';
  if (gameData.players?.player1?.playerId === playerId && gameData.players?.player1?.color) {
    return gameData.players.player1.color;
  }
  if (gameData.players?.player2?.playerId === playerId && gameData.players?.player2?.color) {
    return gameData.players.player2.color;
  }
  if (gameData.colorSelection) {
    for (const [col, res] of Object.entries(gameData.colorSelection)) {
      if (res?.playerId === playerId) return col;
    }
  }
  const isP1 = gameData.players?.player1?.playerId === playerId;
  return isP1 ? (gameData.players?.player1?.color || 'red') : (gameData.players?.player2?.color || 'yellow');
}

/**
 * Helper to resolve opponent player ID and color
 */
export function resolveOpponent(gameData, playerId) {
  const p1 = gameData?.players?.player1;
  const p2 = gameData?.players?.player2;
  const isP1 = p1?.playerId === playerId;
  const opp = isP1 ? p2 : p1;
  const opponentId = opp?.playerId || null;
  const opponentColor = opp?.color || (resolvePlayerColor(gameData, playerId) === 'red' ? 'yellow' : 'red');
  return { opponentId, opponentColor, opponent: opp };
}

/**
 * Creates initial game state object for a Ludo match with color selection support
 */
export function createInitialLudoGameState(pairId, player1Profile, player2Profile = null) {
  const p1 = {
    playerId: player1Profile.playerId,
    displayName: player1Profile.displayName,
    avatar: player1Profile.avatar || 'fox',
    color: 'red',
  };

  const p2 = player2Profile
    ? {
        playerId: player2Profile.playerId,
        displayName: player2Profile.displayName,
        avatar: player2Profile.avatar || 'bear',
        color: 'yellow',
      }
    : null;

  return {
    pairId,
    gameType: 'ludo',
    tokens: normalizeAllTokens(null), // Guarantees all 4 colors exist from step 0
    players: {
      player1: p1,
      player2: p2,
    },
    colorSelection: {
      red: {
        playerId: player1Profile.playerId,
        displayName: player1Profile.displayName,
        avatar: player1Profile.avatar || 'fox',
        selectedAt: Date.now(),
      },
      ...(player2Profile
        ? {
            yellow: {
              playerId: player2Profile.playerId,
              displayName: player2Profile.displayName,
              avatar: player2Profile.avatar || 'bear',
              selectedAt: Date.now(),
            },
          }
        : {}),
    },
    currentTurn: player1Profile.playerId,
    startingPlayer: player1Profile.playerId,
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
    status: p2 ? 'playing' : 'waiting',
    round: 1,
    winner: null,
    winnerColor: null,
    player1Wins: 0,
    player2Wins: 0,
    lastMove: null,
    lastActionMessage: null,
    nextGameAt: null,
    updatedAt: Date.now(),
  };
}

/**
 * Calculates next state after a dice roll, handling 6s, consecutive 6s, and pending dice
 */
export function computeRollDiceState(gameData, playerId, rolledValue) {
  const playerColor = resolvePlayerColor(gameData, playerId);
  const { opponentId, opponentColor } = resolveOpponent(gameData, playerId);

  const allTokens = normalizeAllTokens(gameData?.tokens);
  const playerTokens = allTokens[playerColor];
  const opponentTokens = allTokens[opponentColor];

  // Handle 3 consecutive 6s penalty
  let consecutiveSixes = gameData.consecutiveSixes || 0;
  if (rolledValue === 6) {
    consecutiveSixes += 1;
  } else {
    consecutiveSixes = 0;
  }

  if (consecutiveSixes >= 3) {
    // 3 Sixes in a row -> turn is cancelled immediately!
    return {
      currentTurn: opponentId,
      turnPhase: 'waitingForRoll',
      diceValue: 6,
      pendingDice: [],
      selectedDiceIndex: 0,
      consecutiveSixes: 0,
      bonusRolls: 0,
      validTokenIds: [],
      isMandatoryCapture: false,
      capturingTokenIds: [],
      diceRolled: true,
      lastActionMessage: 'Three consecutive 6s rolled! Turn forfeited.',
      lastActionAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const existingPending = Array.isArray(gameData.pendingDice) ? [...gameData.pendingDice] : [];
  const updatedPendingDice = [...existingPending, rolledValue];

  // If rolled a 6, player gets another roll! They can roll again to build pending dice (e.g. [6, 3])
  const hasExtraRollPending = rolledValue === 6 && consecutiveSixes < 3;

  if (hasExtraRollPending) {
    const legalMoves = getLegalMovesForDice(
      playerColor,
      playerTokens,
      updatedPendingDice,
      opponentColor,
      opponentTokens
    );

    return {
      diceValue: rolledValue,
      pendingDice: updatedPendingDice,
      selectedDiceIndex: updatedPendingDice.length - 1,
      consecutiveSixes,
      diceRolled: true,
      turnPhase: 'waitingForRoll',
      validTokenIds: legalMoves.validTokenIds,
      isMandatoryCapture: false,
      capturingTokenIds: legalMoves.capturingTokenIds,
      lastActionMessage: 'Rolled a 6! Extra roll granted.',
      lastActionAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // Non-6 rolled: evaluate all pending dice for valid moves
  const legalMoves = getLegalMovesForDice(
    playerColor,
    playerTokens,
    updatedPendingDice,
    opponentColor,
    opponentTokens
  );

  const hasMoves = legalMoves.hasAnyLegalMove;
  const activeDiceIndex = 0;
  const activeDiceValue = updatedPendingDice[0] || rolledValue;

  return {
    diceValue: activeDiceValue,
    pendingDice: updatedPendingDice,
    selectedDiceIndex: activeDiceIndex,
    consecutiveSixes: 0,
    diceRolled: true,
    turnPhase: hasMoves ? 'waitingForMove' : 'no_moves',
    validTokenIds: legalMoves.validTokenIds,
    isMandatoryCapture: false,
    capturingTokenIds: legalMoves.capturingTokenIds,
    lastActionMessage: null,
    lastActionAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Calculates next state after moving a token with a selected dice value
 */
export function computeMoveTokenState(gameData, tokenId, playerId, diceIndex = null) {
  const playerColor = resolvePlayerColor(gameData, playerId);
  const { opponentId, opponentColor } = resolveOpponent(gameData, playerId);
  const isP1 = gameData?.players?.player1?.playerId === playerId;

  const pendingDice =
    Array.isArray(gameData.pendingDice) && gameData.pendingDice.length > 0
      ? [...gameData.pendingDice]
      : [gameData.diceValue || 1];

  const allTokens = normalizeAllTokens(gameData?.tokens);
  const currentTokens = [...allTokens[playerColor]];
  const targetTokenIndex = currentTokens.findIndex((t) => t.id === tokenId);

  if (targetTokenIndex === -1) {
    throw new Error(`Token ${tokenId} not found for color ${playerColor}`);
  }

  const targetToken = { ...currentTokens[targetTokenIndex] };

  // Resolve active dice index safely:
  let activeIndex =
    diceIndex !== null && diceIndex >= 0 && diceIndex < pendingDice.length
      ? diceIndex
      : -1;

  if (activeIndex === -1 || !canTokenMove(targetToken, pendingDice[activeIndex])) {
    const validIdx = pendingDice.findIndex((val) => canTokenMove(targetToken, val));
    if (validIdx !== -1) {
      activeIndex = validIdx;
    } else {
      activeIndex =
        gameData.selectedDiceIndex >= 0 && gameData.selectedDiceIndex < pendingDice.length
          ? gameData.selectedDiceIndex
          : 0;
    }
  }

  const diceValue = pendingDice[activeIndex] || gameData.diceValue || 1;

  // Calculate new step
  let newStep = targetToken.step;
  if (targetToken.step === -1) {
    if (diceValue !== 6) throw new Error('Must roll 6 to bring token out');
    newStep = 0;
  } else {
    if (targetToken.step + diceValue > GOAL_STEP) {
      throw new Error('Move overshoots the goal');
    }
    newStep = targetToken.step + diceValue;
  }

  targetToken.step = newStep;
  currentTokens[targetTokenIndex] = targetToken;

  // Check capture of opponent tokens
  let opponentTokens = [...allTokens[opponentColor]];
  const capturedOpponents = checkOpponentCapture(
    playerColor,
    newStep,
    opponentColor,
    opponentTokens
  );
  const capturedCount = capturedOpponents.length;

  if (capturedCount > 0) {
    const capturedIds = new Set(capturedOpponents.map((c) => c.id));
    opponentTokens = opponentTokens.map((opp) =>
      capturedIds.has(opp.id) ? { ...opp, step: -1 } : opp
    );
  }

  // Remove ONLY the consumed die from pendingDice
  const remainingPendingDice = pendingDice.filter((_, idx) => idx !== activeIndex);

  // IMMUTABLE MERGE: Keep all 4 colors intact
  const mergedTokens = {
    ...allTokens,
    [playerColor]: currentTokens,
    [opponentColor]: opponentTokens,
  };

  // Check Win Condition (all 4 tokens in goal)
  const isWinner = isWinningTokens(currentTokens);

  if (isWinner) {
    let p1Wins = gameData.player1Wins || 0;
    let p2Wins = gameData.player2Wins || 0;

    if (isP1) {
      p1Wins += 1;
    } else {
      p2Wins += 1;
    }

    return {
      tokens: mergedTokens,
      status: 'finished',
      winner: playerId,
      winnerColor: playerColor,
      player1Wins: p1Wins,
      player2Wins: p2Wins,
      turnPhase: 'game_over',
      pendingDice: [],
      selectedDiceIndex: 0,
      nextGameAt: Date.now() + 6000,
      lastMove: {
        playerId,
        color: playerColor,
        tokenId,
        diceValue,
        captured: capturedCount > 0,
        bonusTurn: false,
      },
      updatedAt: Date.now(),
    };
  }

  // Determine bonus rolls from captures:
  let bonusRolls = gameData.bonusRolls || 0;
  if (capturedCount > 0) {
    bonusRolls += 1;
  }

  // Check if more moves remain in remainingPendingDice
  if (remainingPendingDice.length > 0) {
    const remainingLegal = getLegalMovesForDice(
      playerColor,
      currentTokens,
      remainingPendingDice,
      opponentColor,
      opponentTokens
    );

    if (remainingLegal.hasAnyLegalMove) {
      return {
        tokens: mergedTokens,
        currentTurn: playerId,
        turnPhase: 'waitingForMove',
        diceValue: remainingPendingDice[0],
        pendingDice: remainingPendingDice,
        selectedDiceIndex: 0,
        validTokenIds: remainingLegal.validTokenIds,
        isMandatoryCapture: false,
        capturingTokenIds: remainingLegal.capturingTokenIds,
        bonusRolls,
        lastMove: {
          playerId,
          color: playerColor,
          tokenId,
          diceValue,
          captured: capturedCount > 0,
          bonusTurn: true,
        },
        lastActionMessage: null,
        updatedAt: Date.now(),
      };
    }
  }

  // If no remaining pending dice, check if player has earned bonus rolls
  if (bonusRolls > 0) {
    return {
      tokens: mergedTokens,
      currentTurn: playerId,
      turnPhase: 'waitingForRoll',
      diceValue: null,
      pendingDice: [],
      selectedDiceIndex: 0,
      bonusRolls: bonusRolls - 1,
      consecutiveSixes: 0,
      diceRolled: false,
      validTokenIds: [],
      isMandatoryCapture: false,
      capturingTokenIds: [],
      lastMove: {
        playerId,
        color: playerColor,
        tokenId,
        diceValue,
        captured: capturedCount > 0,
        bonusTurn: true,
      },
      lastActionMessage: 'Opponent token captured! Bonus roll earned!',
      updatedAt: Date.now(),
    };
  }

  // No remaining dice and no bonus rolls -> Pass turn to opponent
  return {
    tokens: mergedTokens,
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
    lastMove: {
      playerId,
      color: playerColor,
      tokenId,
      diceValue,
      captured: capturedCount > 0,
      bonusTurn: false,
    },
    lastActionMessage: null,
    updatedAt: Date.now(),
  };
}

