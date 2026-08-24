/**
 * Ludo Game Status Banner Component
 * Displays clear feedback on current turn, dice rolls, mandatory capture rules,
 * movable tokens, and waiting states.
 */
import React from 'react';
import { Loader2, Swords } from 'lucide-react';

function getAvailableDiceMessage(pendingDice, diceValue) {
  const currentDice = Array.isArray(pendingDice) && pendingDice.length > 0
    ? pendingDice
    : (diceValue ? [diceValue] : []);

  if (currentDice.length === 0) {
    return 'Select a valid piece to move';
  }
  if (currentDice.length === 1) {
    return `Rolled a ${currentDice[0]} — select a valid piece`;
  }
  if (currentDice.length === 2) {
    return `You have ${currentDice[0]} and ${currentDice[1]} moves available`;
  }
  // 3 or more (e.g. [6, 6, 4])
  const last = currentDice[currentDice.length - 1];
  const prefix = currentDice.slice(0, -1).join(', ');
  return `You have ${prefix}, and ${last} moves available`;
}

export default function LudoGameStatus({
  isMyTurn,
  turnPhase,
  diceValue,
  pendingDice = [],
  isMandatoryCapture = false,
  myColor,
  opponentName,
}) {
  if (isMyTurn) {
    const isMovePhase = turnPhase === 'waitingForMove' || turnPhase === 'move';
    const isRollPhase = turnPhase === 'waitingForRoll' || turnPhase === 'roll';

    return (
      <div className="text-center sm:text-left select-none">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          {isMandatoryCapture ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
          <h3 className="text-sm sm:text-base font-black font-display text-white flex items-center gap-1.5">
            {isRollPhase ? (
              pendingDice && pendingDice.length > 0 ? '🎲 Extra Roll Granted!' : '🎲 Your Turn to Roll'
            ) : isMovePhase ? (
              isMandatoryCapture ? (
                <>
                  <Swords className="w-4 h-4 text-rose-400 animate-bounce" />
                  <span className="text-rose-300">Mandatory Capture!</span>
                </>
              ) : (
                '👉 Tap a Glowing Token to Move'
              )
            ) : (
              '⏳ No Valid Moves (Passing turn...)'
            )}
          </h3>
        </div>

        <p className="text-xs text-white/70 mt-0.5 font-sans">
          {isRollPhase ? (
            pendingDice && pendingDice.length > 0 ? (
              `Rolled a 6! Click your player dice for your extra roll.`
            ) : (
              'Click your player dice to roll and make your move'
            )
          ) : isMovePhase ? (
            isMandatoryCapture ? (
              <span className="text-rose-200 font-semibold">
                Capture available — you must capture the opponent's token.
              </span>
            ) : (
              getAvailableDiceMessage(pendingDice, diceValue)
            )
          ) : (
            pendingDice && pendingDice.length > 1 ? (
              `Rolled ${pendingDice.join(', ')}. No valid moves available.`
            ) : (
              `Rolled a ${diceValue || 1}. Cannot move any token.`
            )
          )}
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


