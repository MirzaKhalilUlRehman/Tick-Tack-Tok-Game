/**
 * Ludo Game Result Component
 * Shows victory/defeat banner, automatic synchronized next game countdown, and rematch controls.
 */
import React from 'react';
import { Trophy, Crown, RotateCcw } from 'lucide-react';

export default function LudoResult({
  winnerId,
  winnerColor,
  myId,
  winnerName,
  countdown,
  onReset,
}) {
  const isWinner = winnerId === myId;

  return (
    <div
      id="ludo-match-result-card"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none w-full"
    >
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
            isWinner
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300'
              : 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-300'
          }`}
        >
          {isWinner ? <Trophy className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black font-display text-white">
            {isWinner
              ? '🎉 Victory! You Won the Match!'
              : `👑 ${winnerName || (winnerColor ? winnerColor.toUpperCase() : 'Opponent')} Won the Match`}
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            {countdown !== null
              ? `Next round starting automatically in ${countdown}s...`
              : 'All 4 tokens safely reached the goal'}
          </p>
        </div>
      </div>

      <button
        id="ludo-result-rematch-button"
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Next Match</span>
      </button>
    </div>
  );
}
