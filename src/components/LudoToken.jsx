/**
 * Ludo Token Component
 * Renders individual Red/Yellow player token with glowing movable states and bounce animations.
 */
import React from 'react';

export default function LudoToken({
  token,
  color,
  isMovable,
  isMoving,
  onClick,
  stackOffset = { x: 0, y: 0 },
}) {
  const isRed = color === 'red';

  return (
    <div
      id={`ludo-token-${color}-${token.id}`}
      onClick={isMovable ? onClick : undefined}
      style={{
        transform: `translate(${stackOffset.x}px, ${stackOffset.y}px)`,
      }}
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md font-black text-[9px] sm:text-[10px] select-none transition-all ${
        isRed
          ? 'bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-400 text-white'
          : 'bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 text-slate-950'
      } ${
        isMovable
          ? 'ring-4 ring-white ring-offset-1 ring-offset-black scale-125 cursor-pointer animate-bounce z-30'
          : isMoving
          ? 'scale-110 opacity-80 z-20'
          : 'z-10'
      }`}
    >
      <span>{token.id + 1}</span>
    </div>
  );
}
