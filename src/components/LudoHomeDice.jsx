/**
 * Ludo Home Dice Component
 * Rendered physically inside each color's home base on the board.
 * Active and clickable only when it's that player's turn.
 */
import React from 'react';
import { Sparkles, Dice5 } from 'lucide-react';

const DOTS_MAP = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const COLOR_CONFIG = {
  red: {
    name: 'Red',
    dotColor: 'bg-rose-600',
    ringColor: 'ring-rose-400',
    glowColor: 'shadow-rose-500/40',
    btnBg: 'bg-rose-600 text-white',
    activeText: 'text-rose-300',
  },
  green: {
    name: 'Green',
    dotColor: 'bg-emerald-600',
    ringColor: 'ring-emerald-400',
    glowColor: 'shadow-emerald-500/40',
    btnBg: 'bg-emerald-600 text-white',
    activeText: 'text-emerald-300',
  },
  blue: {
    name: 'Blue',
    dotColor: 'bg-cyan-600',
    ringColor: 'ring-cyan-400',
    glowColor: 'shadow-cyan-500/40',
    btnBg: 'bg-cyan-600 text-white',
    activeText: 'text-cyan-300',
  },
  yellow: {
    name: 'Yellow',
    dotColor: 'bg-amber-600',
    ringColor: 'ring-amber-400',
    glowColor: 'shadow-amber-500/40',
    btnBg: 'bg-amber-500 text-slate-950',
    activeText: 'text-amber-300',
  },
};

export default function LudoHomeDice({
  color = 'red',
  diceValue,
  animatingValue,
  isRolling = false,
  isMyTurn = false,
  isThisColorTurn = false,
  isMyColor = false,
  turnPhase = 'waitingForRoll',
  pendingDice = [],
  selectedDiceIndex = 0,
  onRoll,
  onSelectPendingDice,
}) {
  const config = COLOR_CONFIG[color] || COLOR_CONFIG.red;

  // STRICT TURN SEPARATION: Only the current active color's dice displays active values/animations
  const displayVal = isThisColorTurn
    ? (animatingValue || diceValue || (pendingDice.length > 0 ? pendingDice[selectedDiceIndex] : null) || 1)
    : 1;
  const dots = DOTS_MAP[displayVal] || DOTS_MAP[1];

  // Rolling animation strictly restricted to current player's own active color
  const activeRolling = isRolling && isThisColorTurn && isMyColor;

  // Can roll only if it's my turn, my color, this color's turn, in roll phase, and not already rolling
  const canRoll = isMyTurn && isMyColor && isThisColorTurn && (turnPhase === 'waitingForRoll' || turnPhase === 'roll') && !activeRolling;

  return (
    <div
      id={`ludo-home-dice-${color}`}
      className="flex flex-col items-center justify-center gap-1 select-none"
    >
      {/* 3D Dice Face */}
      <div
        onClick={canRoll ? onRoll : undefined}
        className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 aspect-square grid grid-cols-3 grid-rows-3 p-0.5 sm:p-1 bg-gradient-to-br from-white via-slate-100 to-slate-200 rounded-lg sm:rounded-xl shadow-md border border-white/90 transition-all duration-300 relative ${
          activeRolling
            ? 'rotate-[360deg] scale-110 shadow-2xl animate-spin'
            : canRoll
            ? `cursor-pointer ring-2 sm:ring-3 ${config.ringColor} ring-offset-1 sm:ring-offset-2 ring-offset-slate-950 scale-105 hover:scale-110 active:scale-95 animate-pulse shadow-xl ${config.glowColor}`
            : isThisColorTurn
            ? 'ring-1 sm:ring-2 ring-white/50 opacity-95'
            : 'opacity-40 cursor-default'
        }`}
      >
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
            return (
              <div key={`dot-${color}-${r}-${c}`} className="flex items-center justify-center">
                {hasDot && (
                  <div
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                      isThisColorTurn
                        ? displayVal === 6
                          ? 'bg-rose-600 shadow-sm'
                          : config.dotColor
                        : 'bg-slate-400/60'
                    }`}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Small Roll badge overlay when active */}
        {canRoll && (
          <span className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 px-1 py-0.2 rounded-md bg-white text-slate-950 text-[6px] sm:text-[8px] font-black font-mono shadow-md border border-slate-300 uppercase tracking-tighter">
            Roll
          </span>
        )}
      </div>

      {/* Available Dice Badges when multiple dice have been rolled (e.g. [6, 4]) */}
      {isThisColorTurn && pendingDice && pendingDice.length > 1 && (
        <div className="flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-white/20 shadow-md">
          {pendingDice.map((val, idx) => (
            <span
              key={`home-pending-chip-${color}-${idx}-${val}`}
              className="px-1.5 py-0.2 rounded-md text-[9px] font-black font-mono bg-white/20 text-white shadow-sm ring-1 ring-white/30"
            >
              {val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
