/**
 * Ludo Player Info Card Component
 * Displays Player Profile, Color badge, Turn indicator, Goal progress, Active tokens,
 * and the player's dedicated Color Dice roller.
 */
import React from 'react';
import { Flame, Swords, Shield } from 'lucide-react';
import { getAvatarById } from '../data/avatars';
import { GOAL_STEP } from '../utils/ludoBoardPath';
import LudoDice from './LudoDice';

export default function LudoPlayerInfo({
  player,
  color = 'red',
  isCurrentTurn,
  isMe,
  myColor,
  turnPhase,
  diceValue,
  pendingDice = [],
  selectedDiceIndex = 0,
  animatingDiceValue,
  isRolling,
  isFinished,
  isMandatoryCapture,
  tokens = [],
  onRoll,
  onSelectPendingDice,
}) {
  const isRed = color === 'red';
  const avatar = getAvatarById(player?.avatar || (isRed ? 'fox' : 'bear'));

  const inGoal = tokens.filter((t) => t.step === GOAL_STEP).length;
  const inYard = tokens.filter((t) => t.step === -1).length;
  const onTrack = 4 - inGoal - inYard;

  return (
    <div
      id={`ludo-player-card-${color}`}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
        isCurrentTurn && !isFinished
          ? isRed
            ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/40'
            : 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40'
          : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-lg sm:text-xl shadow-md ring-2 ${
                  isRed ? 'ring-rose-500' : 'ring-amber-400'
                }`}
              >
                <span>{avatar.emoji}</span>
              </div>
              <span
                className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
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
                  <span className="text-[10px] text-white/50 font-mono font-bold shrink-0">(You)</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/60 mt-0.5">
                <span>Goal: {inGoal}/4</span>
                <span>•</span>
                <span>Active: {onTrack}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Turn Status Alert */}
        {isCurrentTurn && !isFinished && (
          <div
            className={`mt-2 text-center py-0.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse ${
              isRed ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isMandatoryCapture ? (
              <>
                <Swords className="w-3 h-3 text-rose-400" />
                <span>Mandatory Capture</span>
              </>
            ) : (
              <>
                <Flame className={`w-3 h-3 ${isRed ? 'text-rose-400' : 'text-amber-400'}`} />
                <span>{isMe ? 'Your Turn' : 'Opponent Turn'}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Embedded Player Dice Area */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-center">
        <LudoDice
          diceValue={diceValue}
          pendingDice={pendingDice}
          selectedDiceIndex={selectedDiceIndex}
          animatingValue={animatingDiceValue}
          isRolling={isRolling}
          isMyTurn={isCurrentTurn}
          turnPhase={turnPhase}
          myColor={myColor}
          playerColor={color}
          disabled={isFinished}
          onRoll={onRoll}
          onSelectPendingDice={onSelectPendingDice}
        />
      </div>
    </div>
  );
}
