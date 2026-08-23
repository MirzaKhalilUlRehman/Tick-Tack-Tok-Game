/**
 * Ludo Dice Component
 * Interactive animated 3D dice with dot positions and roll trigger.
 */
import React from 'react';

export default function LudoDice({
  diceValue,
  animatingValue,
  isRolling,
  isMyTurn,
  turnPhase,
  myColor,
  disabled,
  onRoll,
}) {
  const displayVal = animatingValue || diceValue || 1;

  const dotsMap = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };

  const dots = dotsMap[displayVal] || dotsMap[1];
  const canRoll = isMyTurn && (turnPhase === 'waitingForRoll' || turnPhase === 'roll') && !isRolling && !disabled;

  return (
    <div className="flex items-center gap-3 select-none">
      {/* 3D Dice Face */}
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 grid grid-cols-3 grid-rows-3 p-1.5 sm:p-2 bg-gradient-to-br from-white via-slate-100 to-slate-300 rounded-2xl shadow-xl border border-white/80 transition-transform duration-200 ${
          isRolling ? 'rotate-180 scale-110' : ''
        }`}
      >
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
            return (
              <div key={`dot-${r}-${c}`} className="flex items-center justify-center">
                {hasDot && (
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                      displayVal === 6
                        ? 'bg-rose-600 shadow-sm shadow-rose-600/50'
                        : isMyTurn && myColor === 'red'
                        ? 'bg-rose-700'
                        : isMyTurn && myColor === 'yellow'
                        ? 'bg-amber-600'
                        : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Roll Action Button */}
      <button
        id="ludo-dice-roll-button"
        type="button"
        disabled={!canRoll}
        onClick={onRoll}
        className={`px-5 py-3.5 rounded-2xl font-black font-display text-xs sm:text-sm tracking-wide transition-all shadow-xl cursor-pointer ${
          canRoll
            ? myColor === 'red'
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 hover:scale-105 active:scale-95 animate-pulse'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/40 hover:scale-105 active:scale-95 animate-pulse'
            : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed opacity-60'
        }`}
      >
        {isRolling ? 'Rolling...' : canRoll ? 'Roll Dice' : 'Waiting'}
      </button>
    </div>
  );
}
