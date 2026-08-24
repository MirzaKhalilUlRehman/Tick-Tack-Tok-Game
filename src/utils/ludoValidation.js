/**
 * Ludo Game Validation Utilities
 * Validates moves, turn states, token legality, and match parameters.
 */
import { GOAL_STEP, isCellSafe, stepToGlobalTrackIndex } from './ludoBoardPath';

/**
 * Validates if a specific token can legally move with the given dice roll
 */
export function canTokenMove(token, diceValue) {
  if (!token || !diceValue || diceValue < 1 || diceValue > 6) return false;

  // 1. Token in yard (-1) requires an exact 6 to enter step 0
  if (token.step === -1) {
    return diceValue === 6;
  }

  // 2. Token in goal (56) cannot move anymore
  if (token.step === GOAL_STEP) {
    return false;
  }

  // 3. Token on track / lane cannot overshoot the goal
  if (token.step + diceValue > GOAL_STEP) {
    return false;
  }

  return true;
}

/**
 * Returns an array of token IDs that are legally movable with the current dice value
 */
export function getValidMovableTokens(tokens, diceValue) {
  if (!tokens || !diceValue) return [];
  const valid = [];

  tokens.forEach((token) => {
    if (canTokenMove(token, diceValue)) {
      valid.push(token.id);
    }
  });

  return valid;
}

/**
 * Checks if moving a token to a new position captures any opponent token
 * Returns array of captured opponent token objects/IDs
 */
export function checkOpponentCapture(playerColor, newStep, opponentColor, opponentTokens) {
  if (newStep < 0 || newStep > 50 || !opponentTokens) return [];
  if (isCellSafe(playerColor, newStep)) return [];

  const myTrackIndex = stepToGlobalTrackIndex(playerColor, newStep);
  if (myTrackIndex === null) return [];

  const captured = [];
  opponentTokens.forEach((oppToken) => {
    if (oppToken.step >= 0 && oppToken.step <= 50) {
      const oppTrackIndex = stepToGlobalTrackIndex(opponentColor, oppToken.step);
      if (oppTrackIndex === myTrackIndex) {
        captured.push(oppToken);
      }
    }
  });

  return captured;
}

/**
 * Returns an array of tokens that result in capturing an opponent token with the given dice roll
 */
export function getCapturingTokens(playerColor, tokens, diceValue, opponentColor, opponentTokens) {
  if (!tokens || !diceValue || !opponentTokens || !opponentColor) return [];

  const capturing = [];
  tokens.forEach((token) => {
    if (!canTokenMove(token, diceValue)) return;

    const newStep = token.step === -1 ? 0 : token.step + diceValue;
    const captured = checkOpponentCapture(playerColor, newStep, opponentColor, opponentTokens);
    if (captured.length > 0) {
      capturing.push(token);
    }
  });

  return capturing;
}

/**
 * Enforces the Mandatory Capture Rule:
 * If any capturing move is available with the given dice roll, the player MUST make a capturing move.
 * Returns { validTokenIds, isMandatoryCapture, capturingTokenIds }
 */
export function getMovableTokensWithMandatoryCapture(
  playerColor,
  playerTokens,
  diceValue,
  opponentColor,
  opponentTokens
) {
  if (!playerTokens || !diceValue) {
    return { validTokenIds: [], isMandatoryCapture: false, capturingTokenIds: [] };
  }

  // 1. Get all standard legally movable tokens
  const allMovable = playerTokens.filter((t) => canTokenMove(t, diceValue));
  if (allMovable.length === 0) {
    return { validTokenIds: [], isMandatoryCapture: false, capturingTokenIds: [] };
  }

  // 2. Check for capturing moves
  const capturingTokens = getCapturingTokens(
    playerColor,
    playerTokens,
    diceValue,
    opponentColor,
    opponentTokens
  );

  const capturingTokenIds = capturingTokens.map((t) => t.id);

  return {
    validTokenIds: allMovable.map((t) => t.id),
    isMandatoryCapture: false,
    capturingTokenIds,
  };
}

/**
 * Computes legal move choices for all tokens of a player given an array of available dice.
 * Evaluates:
 * 1. Yard tokens (step === -1) -> only legal if die === 6
 * 2. Active board tokens (step >= 0) -> legal if step + die <= GOAL_STEP (56)
 * 3. Completed tokens (step === 56) -> cannot move
 *
 * Returns:
 * - validTokenIds: array of token IDs that can legally move with at least one available die
 * - movesByToken: map of tokenId -> array of { diceIndex, diceValue, newStep, isCapture }
 * - hasAnyLegalMove: boolean
 * - capturingTokenIds: array of token IDs that result in capture
 */
export function getLegalMovesForDice(
  playerColor,
  playerTokens,
  availableDice,
  opponentColor = null,
  opponentTokens = []
) {
  if (
    !playerTokens ||
    !Array.isArray(playerTokens) ||
    !availableDice ||
    !Array.isArray(availableDice) ||
    availableDice.length === 0
  ) {
    return {
      validTokenIds: [],
      movesByToken: {},
      hasAnyLegalMove: false,
      capturingTokenIds: [],
    };
  }

  const validTokenIdsSet = new Set();
  const capturingTokenIdsSet = new Set();
  const movesByToken = {};

  playerTokens.forEach((token) => {
    movesByToken[token.id] = [];

    availableDice.forEach((diceVal, diceIdx) => {
      if (canTokenMove(token, diceVal)) {
        const newStep = token.step === -1 ? 0 : token.step + diceVal;
        const captures = opponentColor && opponentTokens
          ? checkOpponentCapture(playerColor, newStep, opponentColor, opponentTokens)
          : [];
        const isCapture = captures.length > 0;

        movesByToken[token.id].push({
          diceIndex: diceIdx,
          diceValue: diceVal,
          newStep,
          isCapture,
        });

        validTokenIdsSet.add(token.id);
        if (isCapture) {
          capturingTokenIdsSet.add(token.id);
        }
      }
    });
  });

  const validTokenIds = Array.from(validTokenIdsSet);
  const capturingTokenIds = Array.from(capturingTokenIdsSet);

  return {
    validTokenIds,
    movesByToken,
    hasAnyLegalMove: validTokenIds.length > 0,
    capturingTokenIds,
  };
}

/**
 * Returns tokens grouped by step / location to identify stacked pieces
 */
export function getStackedTokensMap(tokens) {
  if (!tokens) return {};
  const map = {};
  tokens.forEach((t) => {
    const key = t.step;
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  return map;
}

/**
 * Validates if all 4 tokens have reached the goal (step 56)
 */
export function isWinningTokens(tokens) {
  if (!tokens || tokens.length < 4) return false;
  return tokens.every((t) => t.step === GOAL_STEP);
}
