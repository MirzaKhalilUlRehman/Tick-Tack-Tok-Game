/**
 * Game calculation utilities
 */

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
  [0, 4, 8], // diagonal 1
  [2, 4, 6], // diagonal 2
];

export function checkTicTacToeWinner(board) {
  if (!board || !Array.isArray(board)) return null;

  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const [a, b, c] = WINNING_COMBINATIONS[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: [a, b, c],
      };
    }
  }

  const isFull = board.every((cell) => cell !== null && cell !== '');
  if (isFull) {
    return {
      winner: 'draw',
      line: null,
    };
  }

  return null;
}
