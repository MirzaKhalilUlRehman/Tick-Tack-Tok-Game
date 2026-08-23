/**
 * Multiplayer Tic Tac Toe Game Component
 * Features:
 * - Real-time 2-player grid sync
 * - Glowing winning line detection
 * - Alternating starting player each round
 * - Synchronized automatic next game countdown (5.. 4.. 3.. 2.. 1..)
 * - Clear "Leave Game" button with confirmation modal (opponent awarded win)
 * - Handled "Opponent Left" and "Opponent Disconnected" win states
 * - Grace period reconnection countdown
 * - Clean score tracker
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Zap,
  Crown,
  Users,
  LogOut,
  WifiOff,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getAvatarById } from '../../data/avatars';
import {
  makeTicTacToeMove,
  startNextRound,
  COUNTDOWN_DURATION_SEC,
} from '../../services/ticTacToeService';
import { useSound } from '../../hooks/useSound';

export default function TicTacToeGame({
  pairId,
  gameData = {},
  pairData = {},
  playerProfile,
  isOpponentConnected = true,
  onLeaveMatch,
  onDisconnectTimeout,
}) {
  const [countdown, setCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(null);

  const countdownIntervalRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const { playPop, playWin, playLose, playDraw, playClick } = useSound();

  const board = gameData?.board || Array(9).fill(null);
  const currentTurn = gameData?.currentTurn;
  const status = gameData?.status || 'waiting'; // 'waiting' | 'playing' | 'finished'
  const winner = gameData?.winner;
  const finishReason = gameData?.finishReason; // 'opponent_left' | 'opponent_disconnected' | null
  const winningLine = gameData?.winningLine || [];
  const round = gameData?.round || 1;
  const nextGameAt = gameData?.nextGameAt;

  const players = pairData?.players || {};
  const player1 = players?.player1;
  const player2 = players?.player2;

  const isPlayer1 = player1?.playerId === playerProfile?.playerId;
  const isPlayer2 = player2?.playerId === playerProfile?.playerId;
  const mySymbol = isPlayer1 ? 'X' : isPlayer2 ? 'O' : null;
  const isMyTurn = status === 'playing' && currentTurn === playerProfile?.playerId;

  const p1Avatar = getAvatarById(player1?.avatar || 'fox');
  const p2Avatar = getAvatarById(player2?.avatar || 'bear');

  const opponent = isPlayer1 ? player2 : player1;

  // Track opponent disconnect grace period (30s countdown before auto-win)
  useEffect(() => {
    if (status === 'playing' && opponent && !isOpponentConnected) {
      let secondsLeft = 30;
      setReconnectCountdown(secondsLeft);

      reconnectIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setReconnectCountdown(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(reconnectIntervalRef.current);
          if (onDisconnectTimeout && opponent?.playerId) {
            onDisconnectTimeout(opponent.playerId);
          }
        }
      }, 1000);

      return () => {
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
        }
      };
    } else {
      setReconnectCountdown(null);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    }
  }, [status, isOpponentConnected, opponent?.playerId, onDisconnectTimeout]);

  // Track and synchronize automatic countdown (only for normal round completions)
  useEffect(() => {
    if (status === 'finished' && nextGameAt && !finishReason) {
      hasTriggeredRef.current = false;
      const updateTimer = () => {
        const remainingMs = nextGameAt - Date.now();
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        setCountdown(seconds);

        if (seconds <= 0 && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          if (isPlayer1 || (!player1 && isPlayer2)) {
            startNextRound(pairId, gameData, players);
          }
        }
      };

      updateTimer();
      countdownIntervalRef.current = setInterval(updateTimer, 500);

      // Play outcome audio safely
      try {
        if (winner === playerProfile?.playerId) {
          playWin?.();
        } else if (winner === 'draw') {
          playDraw?.();
        } else if (winner) {
          playLose?.();
        }
      } catch (audioErr) {}

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    } else {
      setCountdown(null);
      hasTriggeredRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, [status, nextGameAt, finishReason, winner, pairId, isPlayer1, isPlayer2, round]);

  const handleCellClick = async (index) => {
    if (!isMyTurn || board[index] !== null || status !== 'playing' || isSubmitting) return;

    try {
      setIsSubmitting(true);
      playPop();
      await makeTicTacToeMove(pairId, gameData, index, playerProfile.playerId, players);
    } catch (err) {
      console.warn('Move error:', err);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 300);
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveModal(false);
    playPop();
    if (onLeaveMatch) {
      await onLeaveMatch();
    }
  };

  // Outcome messaging
  const isWinner = winner === playerProfile?.playerId;
  const isDraw = winner === 'draw';
  const isOpponentLeft = finishReason === 'opponent_left';
  const isOpponentDisconnected = finishReason === 'opponent_disconnected';

  return (
    <div
      id="tictactoe-board-container"
      className="flex flex-col items-center justify-between h-full max-w-xl mx-auto p-4 sm:p-6 select-none"
    >
      {/* Top Scoreboard Header with Leave Button */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-lg relative">
        {/* Player 1 Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
            currentTurn === player1?.playerId && status === 'playing'
              ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50'
              : ''
          }`}
        >
          <div className="relative">
            <span className="text-2xl sm:text-3xl">{p1Avatar.emoji}</span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center border border-slate-900 shadow">
              X
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center gap-1">
              <span>{player1?.displayName || 'Player 1'}</span>
              {isPlayer1 && <span className="text-[10px] text-indigo-400 font-bold">(You)</span>}
            </p>
            <p className="text-xs font-mono font-bold text-indigo-300">
              {gameData?.player1Wins || 0} Wins
            </p>
          </div>
        </div>

        {/* Round Badge & Draws */}
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Round {round}
          </span>
          <div className="flex items-center gap-1 text-xs font-mono text-white/60 font-bold mt-0.5">
            <span>VS</span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {gameData?.draws || 0} Draws
          </span>
        </div>

        {/* Player 2 Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
            currentTurn === player2?.playerId && status === 'playing'
              ? 'bg-pink-500/20 ring-1 ring-pink-500/50'
              : ''
          }`}
        >
          <div className="text-right">
            <p className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center justify-end gap-1">
              {isPlayer2 && <span className="text-[10px] text-pink-400 font-bold">(You)</span>}
              <span>{player2?.displayName || 'Waiting...'}</span>
            </p>
            <p className="text-xs font-mono font-bold text-pink-300">
              {gameData?.player2Wins || 0} Wins
            </p>
          </div>
          <div className="relative">
            <span className="text-2xl sm:text-3xl">
              {player2 ? p2Avatar.emoji : '👤'}
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center border border-slate-900 shadow">
              O
            </span>
          </div>
        </div>
      </div>

      {/* Reconnection Alert Bar if opponent drops */}
      {reconnectCountdown !== null && (
        <div className="mt-3 w-full bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-200 animate-pulse">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Opponent reconnecting... Awarding victory in{' '}
            <strong className="font-mono text-white text-sm">{reconnectCountdown}s</strong>
          </span>
        </div>
      )}

      {/* Turn & Status Announcement Banner */}
      <div className="my-3 sm:my-4 w-full text-center">
        {status === 'waiting' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold animate-pulse">
            <Users className="w-4 h-4" />
            <span>Waiting for 2nd player to enter pairing code...</span>
          </div>
        )}

        {status === 'playing' && (
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md ${
              isMyTurn
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-bounce'
                : 'bg-white/5 border border-white/10 text-white/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {isMyTurn
                ? `Your Turn! Tap a square (${mySymbol})`
                : `${
                    currentTurn === player1?.playerId
                      ? player1?.displayName || 'Player 1'
                      : player2?.displayName || 'Player 2'
                  } is thinking...`}
            </span>
          </div>
        )}

        {status === 'finished' && (
          <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-200">
            <div
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm sm:text-base font-black shadow-xl ${
                isWinner
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300'
                  : isDraw
                  ? 'bg-slate-700 text-white border border-white/20'
                  : isOpponentLeft
                  ? 'bg-rose-600 text-white shadow-rose-600/30'
                  : 'bg-rose-600 text-white shadow-rose-600/30'
              }`}
            >
              {isWinner ? (
                <Crown className="w-5 h-5" />
              ) : isOpponentLeft ? (
                <LogOut className="w-5 h-5" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
              <span>
                {isWinner
                  ? isOpponentLeft
                    ? 'Opponent Left — 🏆 You Won!'
                    : isOpponentDisconnected
                    ? 'Opponent Disconnected — 🏆 You Won!'
                    : '🎉 Victory! You Won This Round!'
                  : isOpponentLeft
                  ? 'You Left the Match'
                  : isOpponentDisconnected
                  ? 'Connection Lost'
                  : isDraw
                  ? '🤝 Match Tied! Great Game!'
                  : `Round Won by ${
                      winner === player1?.playerId
                        ? player1?.displayName || 'Player 1'
                        : player2?.displayName || 'Player 2'
                    }`}
              </span>
            </div>

            {/* Sub-explanation */}
            {isOpponentLeft && (
              <span className="text-xs text-white/60">
                {isWinner
                  ? 'Opponent left the match. Full victory awarded to you.'
                  : 'You abandoned the match. Full victory awarded to opponent.'}
              </span>
            )}

            {/* Synchronized Auto Next-Game Countdown (for normal wins) */}
            {countdown !== null && !finishReason && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/70 mt-1">
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>
                  Next game starts automatically in{' '}
                  <strong className="text-white text-sm font-black px-1.5 py-0.5 rounded bg-white/10">
                    {countdown}s
                  </strong>
                  {' '}•{' '}
                  <span className="text-indigo-300">
                    {((round + 1) % 2 === 1 ? player1?.displayName : player2?.displayName) || 'Opponent'} starts
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3x3 Tic Tac Toe Grid */}
      <div
        id="tictactoe-grid-3x3"
        className="w-full max-w-[340px] sm:max-w-[380px] aspect-square bg-slate-900/90 border border-white/15 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5"
      >
        {board.map((cell, index) => {
          const isWinningSquare = winningLine.includes(index);
          const isOccupied = cell !== null && cell !== '';

          return (
            <button
              key={index}
              id={`tictactoe-cell-${index}`}
              type="button"
              disabled={isOccupied || !isMyTurn || status !== 'playing'}
              onClick={() => handleCellClick(index)}
              className={`relative rounded-2xl flex items-center justify-center font-display font-black text-4xl sm:text-5xl transition-all duration-200 select-none cursor-pointer ${
                isWinningSquare
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/50 scale-105 z-10'
                  : isOccupied
                  ? cell === 'X'
                    ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-400 shadow-inner'
                    : 'bg-pink-950/70 border border-pink-500/40 text-pink-400 shadow-inner'
                  : isMyTurn
                  ? 'bg-white/5 border border-white/10 hover:bg-white/15 hover:border-indigo-500/50 hover:scale-[1.02] active:scale-95'
                  : 'bg-white/[0.02] border border-white/5 cursor-not-allowed opacity-60'
              }`}
            >
              {cell === 'X' && (
                <span className="animate-in zoom-in-75 duration-150 drop-shadow-md">
                  X
                </span>
              )}
              {cell === 'O' && (
                <span className="animate-in zoom-in-75 duration-150 drop-shadow-md">
                  O
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Controls & Leave Game Button */}
      <div className="mt-4 sm:mt-6 flex items-center justify-between w-full max-w-[380px] px-2 text-xs">
        <div className="text-white/40 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Alternate starts</span>
        </div>

        {status === 'playing' && (
          <button
            id="ttt-leave-game-btn"
            type="button"
            onClick={() => {
              playClick();
              setShowLeaveModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold hover:text-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Game</span>
          </button>
        )}
      </div>

      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-white font-display">
                Leave Active Game?
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                If you leave now, your opponent will immediately win the match and victory will be awarded to them.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-leave-btn"
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-leave-btn"
                type="button"
                onClick={handleConfirmLeave}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
