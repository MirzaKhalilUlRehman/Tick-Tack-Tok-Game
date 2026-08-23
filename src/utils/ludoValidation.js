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
 * Validates if all 4 tokens have reached the goal (step 56)
 */
export function isWinningTokens(tokens) {
  if (!tokens || tokens.length < 4) return false;
  return tokens.every((t) => t.step === GOAL_STEP);
}
