/**
 * Ludo Pure State Transition Engine
 * Computes deterministic next states for dice rolls, token moves, captures, bonus turns, and round initializations.
 */
import { GOAL_STEP } from './ludoBoardPath';
import { getValidMovableTokens, checkOpponentCapture, isWinningTokens } from './ludoValidation';

/**
 * Creates default initial tokens for a player
 */
export function createInitialTokens() {
  return [
    { id: 0, step: -1 },
    { id: 1, step: -1 },
    { id: 2, step: -1 },
    { id: 3, step: -1 },
  ];
}

/**
 * Creates initial game state object for a Ludo match
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
    tokens: {
      red: createInitialTokens(),
      yellow: createInitialTokens(),
    },
    players: {
      player1: p1,
      player2: p2,
    },
    currentTurn: player1Profile.playerId,
    startingPlayer: player1Profile.playerId,
    turnPhase: 'waitingForRoll', // 'waitingForRoll' | 'waitingForMove' | 'no_moves' | 'game_over'
    diceValue: null,
    diceRolled: false,
    validTokenIds: [],
    status: p2 ? 'playing' : 'waiting', // 'waiting' | 'playing' | 'finished'
    round: 1,
    winner: null,
    winnerColor: null,
    player1Wins: 0,
    player2Wins: 0,
    lastMove: null,
    nextGameAt: null,
    updatedAt: Date.now(),
  };
}

/**
 * Calculates next state after a dice roll
 */
export function computeRollDiceState(gameData, playerId, rolledValue) {
  const isP1 = gameData.players?.player1?.playerId === playerId;
  const playerColor = isP1 ? 'red' : 'yellow';
  const playerTokens = gameData.tokens?.[playerColor] || createInitialTokens();

  const validTokenIds = getValidMovableTokens(playerTokens, rolledValue);
  const hasMoves = validTokenIds.length > 0;

  return {
    diceValue: rolledValue,
    diceRolled: true,
    turnPhase: hasMoves ? 'waitingForMove' : 'no_moves',
    validTokenIds,
    lastActionAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Calculates next state after moving a token
 */
export function computeMoveTokenState(gameData, tokenId, playerId) {
  const diceValue = gameData.diceValue;
  const isP1 = gameData.players?.player1?.playerId === playerId;
  const playerColor = isP1 ? 'red' : 'yellow';
  const opponentColor = isP1 ? 'yellow' : 'red';
  const opponentId = isP1
    ? gameData.players?.player2?.playerId
    : gameData.players?.player1?.playerId;

  const currentTokens = [...(gameData.tokens?.[playerColor] || createInitialTokens())];
  const targetTokenIndex = currentTokens.findIndex((t) => t.id === tokenId);

  if (targetTokenIndex === -1) {
    throw new Error('Token not found');
  }

  const targetToken = { ...currentTokens[targetTokenIndex] };

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
  let opponentTokens = [...(gameData.tokens?.[opponentColor] || createInitialTokens())];
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

  // Check Win Condition
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
      tokens: {
        [playerColor]: currentTokens,
        [opponentColor]: opponentTokens,
      },
      status: 'finished',
      winner: playerId,
      winnerColor: playerColor,
      player1Wins: p1Wins,
      player2Wins: p2Wins,
      turnPhase: 'game_over',
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

  // Determine bonus turn:
  // Rolling 6 or Capturing opponent grants bonus turn!
  const grantsBonusTurn = diceValue === 6 || capturedCount > 0;
  const nextTurnId = grantsBonusTurn ? playerId : opponentId;

  return {
    tokens: {
      [playerColor]: currentTokens,
      [opponentColor]: opponentTokens,
    },
    currentTurn: nextTurnId,
    turnPhase: 'waitingForRoll',
    diceValue: null,
    diceRolled: false,
    validTokenIds: [],
    lastMove: {
      playerId,
      color: playerColor,
      tokenId,
      diceValue,
      captured: capturedCount > 0,
      bonusTurn: grantsBonusTurn,
    },
    updatedAt: Date.now(),
  };
}
