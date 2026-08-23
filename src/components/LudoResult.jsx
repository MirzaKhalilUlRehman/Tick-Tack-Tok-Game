/**
 * Ludo Game Result Component
 * Shows victory/defeat banner, automatic synchronized next game countdown, rematch controls,
 * and clear finish reason display (Opponent Left / Disconnected / Standard Goal).
 */
import React from 'react';
import { Trophy, Crown, RotateCcw, AlertCircle, LogOut } from 'lucide-react';

export default function LudoResult({
  winnerId,
  winnerColor,
  myId,
  winnerName,
  countdown,
  finishReason = null,
  onReset,
}) {
  const isWinner = winnerId === myId;
  const isOpponentLeft = finishReason === 'opponent_left';
  const isOpponentDisconnected = finishReason === 'opponent_disconnected';

  return (
    <div
      id="ludo-match-result-card"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none w-full p-4 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-200"
    >
      <div className="flex items-center gap-3.5 text-center sm:text-left">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
            isWinner
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30'
              : isOpponentLeft
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
              : 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-300'
          }`}
        >
          {isWinner ? (
            <Trophy className="w-6 h-6" />
          ) : isOpponentLeft ? (
            <LogOut className="w-6 h-6" />
          ) : (
            <Crown className="w-6 h-6" />
          )}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black font-display text-white">
            {isWinner ? (
              isOpponentLeft ? (
                'Opponent Left — 🏆 You Won!'
              ) : isOpponentDisconnected ? (
                'Opponent Disconnected — 🏆 You Won!'
              ) : (
                '🎉 Victory! You Won the Match!'
              )
            ) : isOpponentLeft ? (
              'You Left the Match'
            ) : isOpponentDisconnected ? (
              'Connection Lost'
            ) : (
              `👑 ${winnerName || (winnerColor ? winnerColor.toUpperCase() : 'Opponent')} Won the Match`
            )}
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            {isOpponentLeft
              ? isWinner
                ? 'Opponent left the match. Full victory awarded to you.'
                : 'You abandoned the match. Victory awarded to opponent.'
              : isOpponentDisconnected
              ? isWinner
                ? 'Opponent lost connection. Victory awarded to you.'
                : 'Connection timed out.'
              : countdown !== null
              ? `Next round starting automatically in ${countdown}s...`
              : 'All 4 tokens safely reached the goal.'}
          </p>
        </div>
      </div>

      {!isOpponentLeft && !isOpponentDisconnected && (
        <button
          id="ludo-result-rematch-button"
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Next Match</span>
        </button>
      )}
    </div>
  );
}
