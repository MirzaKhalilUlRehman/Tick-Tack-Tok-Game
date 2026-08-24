/**
 * Ludo Token Component
 * Renders individual Red/Yellow player token with glowing movable states,
 * mandatory capture highlights, stacked indicators, and bounce animations.
 */
import React from 'react';
import { Swords } from 'lucide-react';

export default function LudoToken({
  token,
  color = 'red',
  isMovable,
  isMoving,
  isCapturing,
  stackCount = 1,
  onClick,
  stackOffset = { x: 0, y: 0 },
  isSelectedForScore = false,
  scoreOptions = [],
  onSelectScore,
}) {
  const colorStyles = {
    red: 'bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-400 text-white',
    green: 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-400 text-white',
    blue: 'bg-gradient-to-tr from-cyan-700 via-cyan-600 to-cyan-400 text-white',
    yellow: 'bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 text-slate-950',
  };

  const currentStyle = colorStyles[color] || colorStyles.red;

  return (
    <div
      id={`ludo-token-${color}-${token.id}`}
      onClick={
        isMovable
          ? (e) => {
              if (e?.stopPropagation) e.stopPropagation();
              if (onClick) onClick(e);
            }
          : undefined
      }
      style={{
        transform: `translate(${stackOffset.x}px, ${stackOffset.y}px)`,
      }}
      className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md font-black text-[9px] sm:text-[10px] select-none transition-all ${currentStyle} ${
        isCapturing && isMovable
          ? 'ring-4 ring-rose-500 ring-offset-1 ring-offset-black scale-135 cursor-pointer animate-bounce z-40 shadow-lg shadow-rose-500/50'
          : isSelectedForScore
          ? 'ring-4 ring-amber-300 ring-offset-1 ring-offset-black scale-130 cursor-pointer z-50 shadow-2xl'
          : isMovable
          ? 'ring-4 ring-white ring-offset-1 ring-offset-black scale-125 cursor-pointer animate-bounce z-30'
          : isMoving
          ? 'scale-110 opacity-80 z-20'
          : 'z-10'
      }`}
    >
      <span>{token.id + 1}</span>

      {/* Mandatory Capture Badge */}
      {isCapturing && isMovable && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-600 border border-white text-white flex items-center justify-center text-[7px] z-50">
          <Swords className="w-2 h-2" />
        </span>
      )}

      {/* Stack Count Indicator */}
      {stackCount > 1 && (
        <span className="absolute -bottom-1 -right-1 px-1 rounded-full bg-black/80 text-white border border-white/50 text-[7px] font-mono font-black z-40">
          x{stackCount}
        </span>
      )}

      {/* Floating score choices attached directly above this selected goti */}
      {isSelectedForScore && scoreOptions && scoreOptions.length > 1 && (
        <div
          id={`ludo-score-picker-token-${token.id}`}
          className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/95 backdrop-blur-md px-2 py-1 rounded-xl border-2 border-white shadow-2xl z-50 animate-in zoom-in-90 duration-150 ring-2 ring-black/80 pointer-events-auto cursor-default whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {scoreOptions.map((opt) => (
            <button
              key={`score-opt-${token.id}-${opt.id || opt.index}`}
              id={`score-choice-${token.id}-${opt.id || `die_${opt.index}`}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectScore) onSelectScore(opt.index);
              }}
              className={`min-w-[22px] sm:min-w-[26px] h-6 sm:h-7 px-1.5 rounded-lg font-black font-mono text-xs sm:text-sm transition-all transform hover:scale-115 active:scale-95 shadow-lg flex items-center justify-center gap-0.5 cursor-pointer border border-white/50 ${
                opt.isCapture
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-1 ring-rose-300'
                  : color === 'yellow'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-1 ring-white'
                  : color === 'green'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white ring-1 ring-white'
                  : color === 'blue'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-white ring-1 ring-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white ring-1 ring-white'
              }`}
              title={`Move Token ${token.id + 1} with score ${opt.value}`}
            >
              <span>{opt.value}</span>
              {opt.isCapture && <Swords className="w-2.5 h-2.5 text-white animate-pulse ml-0.5" />}
            </button>
          ))}
          {/* Downward pointer triangle */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-950" />
        </div>
      )}
    </div>
  );
}

