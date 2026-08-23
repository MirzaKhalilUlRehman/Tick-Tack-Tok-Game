/**
 * Ludo Game Status Banner Component
 * Displays clear feedback on current turn, dice rolls, movable tokens, and waiting states.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LudoGameStatus({
  isMyTurn,
  turnPhase,
  diceValue,
  myColor,
  opponentName,
}) {
  if (isMyTurn) {
    return (
      <div className="text-center sm:text-left select-none">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-sm sm:text-base font-black font-display text-white">
            {turnPhase === 'waitingForRoll' || turnPhase === 'roll'
              ? '🎲 Your Turn to Roll'
              : turnPhase === 'waitingForMove' || turnPhase === 'move'
              ? '👉 Tap a Glowing Token to Move'
              : '⏳ No Valid Moves (Passing turn...)'}
          </h3>
        </div>
        <p className="text-xs text-white/50 mt-0.5 font-sans">
          {turnPhase === 'waitingForRoll' || turnPhase === 'roll'
            ? 'Click the Roll Dice button to make your move'
            : turnPhase === 'waitingForMove' || turnPhase === 'move'
            ? `Rolled a ${diceValue}! Select any glowing piece.`
            : `Rolled a ${diceValue}. Cannot move any token.`}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center sm:text-left select-none">
      <div className="flex items-center justify-center sm:justify-start gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        <h3 className="text-sm sm:text-base font-bold font-display text-white/80">
          Waiting for {opponentName || 'Opponent'}...
        </h3>
      </div>
      <p className="text-xs text-white/40 mt-0.5 font-sans">
        Opponent is deciding their move
      </p>
    </div>
  );
}
