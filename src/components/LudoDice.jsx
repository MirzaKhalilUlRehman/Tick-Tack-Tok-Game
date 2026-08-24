/**
 * Ludo Dice Component
 * Interactive animated 3D dice with dot positions, pending dice queue chips, and roll triggers.
 */
import React from 'react';
import { Sparkles, Swords, Dice5 } from 'lucide-react';

export default function LudoDice({
  diceValue,
  pendingDice = [],
  selectedDiceIndex = 0,
  animatingValue,
  isRolling,
  isMyTurn,
  turnPhase,
  myColor,
  playerColor = 'red',
  disabled,
  onRoll,
  onSelectPendingDice,
}) {
  const displayVal = animatingValue || diceValue || (pendingDice.length > 0 ? pendingDice[selectedDiceIndex] : null) || 1;
  const isRed = playerColor === 'red';

  const dotsMap = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };

  const dots = dotsMap[displayVal] || dotsMap[1];
  const canRoll = isMyTurn && myColor === playerColor && (turnPhase === 'waitingForRoll' || turnPhase === 'roll') && !isRolling && !disabled;
  const hasRolledSix = pendingDice.includes(6);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 3D Dice Face */}
        <div
          onClick={canRoll ? onRoll : undefined}
          className={`w-11 h-11 sm:w-13 sm:h-13 grid grid-cols-3 grid-rows-3 p-1.5 bg-gradient-to-br from-white via-slate-100 to-slate-300 rounded-2xl shadow-xl border border-white/80 transition-all duration-200 ${
            isRolling ? 'rotate-180 scale-110' : ''
          } ${canRoll ? 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-white/60' : ''}`}
        >
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
              return (
                <div key={`dot-${r}-${c}`} className="flex items-center justify-center">
                  {hasDot && (
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                        displayVal === 6
                          ? 'bg-rose-600 shadow-sm shadow-rose-600/50'
                          : isRed
                          ? 'bg-rose-700'
                          : 'bg-amber-600'
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Roll Action Button */}
        {isMyTurn && myColor === playerColor && (
          <button
            id={`ludo-dice-roll-button-${playerColor}`}
            type="button"
            disabled={!canRoll}
            onClick={onRoll}
            className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl font-black font-display text-[11px] sm:text-xs tracking-wide transition-all shadow-xl cursor-pointer shrink-0 ${
              canRoll
                ? isRed
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 hover:scale-105 active:scale-95 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/40 hover:scale-105 active:scale-95 animate-pulse'
                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed opacity-60'
            }`}
          >
            {isRolling
              ? 'Rolling...'
              : canRoll
              ? hasRolledSix
                ? '🎲 Roll Again (6!)'
                : '🎲 Roll Dice'
              : 'Waiting Move'}
          </button>
        )}
      </div>

      {/* Pending Dice Selector Chips (e.g. [6, 3]) */}
      {pendingDice && pendingDice.length > 1 && isMyTurn && myColor === playerColor && (
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
          <span className="text-[10px] text-white/50 px-1 font-mono">Dice:</span>
          {pendingDice.map((val, idx) => {
            const isSelected = selectedDiceIndex === idx;
            return (
              <button
                key={`pending-die-${idx}-${val}`}
                type="button"
                onClick={() => onSelectPendingDice && onSelectPendingDice(idx)}
                className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer ${
                  isSelected
                    ? isRed
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-white'
                      : 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                ⚅ {val}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

