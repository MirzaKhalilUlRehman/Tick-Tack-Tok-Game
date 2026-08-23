/**
 * Ludo Player Info Card Component
 * Displays Player Profile, Color badge, Turn indicator, Goal progress, and Active tokens.
 */
import React from 'react';
import { Flame } from 'lucide-react';
import { getAvatarById } from '../data/avatars';
import { GOAL_STEP } from '../utils/ludoBoardPath';

export default function LudoPlayerInfo({
  player,
  color,
  isCurrentTurn,
  isMe,
  tokens = [],
  isFinished,
}) {
  const isRed = color === 'red';
  const avatar = getAvatarById(player?.avatar || (isRed ? 'fox' : 'bear'));

  const inGoal = tokens.filter((t) => t.step === GOAL_STEP).length;
  const inYard = tokens.filter((t) => t.step === -1).length;
  const onTrack = 4 - inGoal - inYard;

  return (
    <div
      id={`ludo-player-card-${color}`}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
        isCurrentTurn && !isFinished
          ? isRed
            ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/40'
            : 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40'
          : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-xl shadow-md ring-2 ${
              isRed ? 'ring-rose-500' : 'ring-amber-400'
            }`}
          >
            <span>{avatar.emoji}</span>
          </div>
          <span
            className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${
              isRed ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950 font-bold'
            }`}
          >
            {isRed ? 'RED' : 'YEL'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm font-black font-display text-white truncate">
              {player?.displayName || (isRed ? 'Player 1' : 'Player 2')}
            </span>
            {isMe && (
              <span className="text-[10px] text-white/50 font-mono font-bold">(You)</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/60 mt-0.5">
            <span>Goal: {inGoal}/4</span>
            <span>•</span>
            <span>Active: {onTrack}</span>
          </div>
        </div>
      </div>

      {isCurrentTurn && !isFinished && (
        <div
          className={`mt-2 text-center py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse ${
            isRed ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          <Flame className={`w-3 h-3 ${isRed ? 'text-rose-400' : 'text-amber-400'}`} />
          <span>Turn to Move</span>
        </div>
      )}
    </div>
  );
}
