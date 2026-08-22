/**
 * Tic Tac Toe Game Service
 * Handles real-time moves, win detection, score tracking,
 * and synchronized automatic next-round transitions with alternating starting player.
 */
import { updateGameInDb } from '../firebase/database';
import { checkTicTacToeWinner } from '../utils/gameHelpers';
import { updateStoredStats } from '../utils/storage';

export const COUNTDOWN_DURATION_SEC = 5;

/**
 * Executes a move in the 3x3 grid
 */
export async function makeTicTacToeMove(pairId, gameData, cellIndex, playerId, players) {
  if (!gameData || gameData.status !== 'playing') {
    throw new Error('Game is not currently active');
  }

  if (gameData.currentTurn !== playerId) {
    throw new Error('It is not your turn');
  }

  if (gameData.board[cellIndex] !== null && gameData.board[cellIndex] !== '') {
    throw new Error('Square is already occupied');
  }

  const p1 = players?.player1;
  const p2 = players?.player2;
  const isP1 = p1?.playerId === playerId;
  const symbol = isP1 ? 'X' : 'O';
  const nextTurnId = isP1 ? p2?.playerId : p1?.playerId;

  const newBoard = [...gameData.board];
  newBoard[cellIndex] = symbol;

  const result = checkTicTacToeWinner(newBoard);

  if (result) {
    let winnerId = null;
    let p1Wins = gameData.player1Wins || 0;
    let p2Wins = gameData.player2Wins || 0;
    let draws = gameData.draws || 0;

    if (result.winner === 'X') {
      winnerId = p1?.playerId;
      p1Wins += 1;
    } else if (result.winner === 'O') {
      winnerId = p2?.playerId;
      p2Wins += 1;
    } else {
      winnerId = 'draw';
      draws += 1;
    }

    // Update local user statistics
    if (winnerId === playerId) {
      updateStoredStats((s) => ({ ...s, tttWins: (s.tttWins || 0) + 1 }));
    } else if (winnerId === 'draw') {
      updateStoredStats((s) => ({ ...s, tttDraws: (s.tttDraws || 0) + 1 }));
    } else {
      updateStoredStats((s) => ({ ...s, tttLosses: (s.tttLosses || 0) + 1 }));
    }

    const nextGameAt = Date.now() + COUNTDOWN_DURATION_SEC * 1000;

    await updateGameInDb(pairId, {
      board: newBoard,
      status: 'finished',
      winner: winnerId,
      winningLine: result.line || null,
      player1Wins: p1Wins,
      player2Wins: p2Wins,
      draws: draws,
      nextGameAt: nextGameAt,
    });
  } else {
    // Regular turn advancement
    await updateGameInDb(pairId, {
      board: newBoard,
      currentTurn: nextTurnId,
    });
  }
}

/**
 * Automatically resets the board and starts the next round with alternating starting player
 */
export async function startNextRound(pairId, gameData, players) {
  if (!gameData || gameData.status !== 'finished') return;

  const p1 = players?.player1;
  const p2 = players?.player2;
  const p1Id = p1?.playerId;
  const p2Id = p2?.playerId;

  const currentRound = gameData.round || 1;
  const nextRound = currentRound + 1;

  // Alternate starting player:
  // Round 1: Player 1
  // Round 2: Player 2
  // Round 3: Player 1, etc.
  const nextStarterId = nextRound % 2 === 1 ? p1Id : p2Id;

  await updateGameInDb(pairId, {
    board: Array(9).fill(null),
    currentTurn: nextStarterId,
    startingPlayer: nextStarterId,
    status: 'playing',
    winner: null,
    winningLine: null,
    round: nextRound,
    nextGameAt: null,
  });
}
