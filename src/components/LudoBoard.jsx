/**
 * Ludo 15x15 Interactive Board Component
 * Renders the responsive 15x15 grid, home yards, safe stars, home lanes, center goal, and tokens.
 */
import React from 'react';
import { Star, ArrowRight, Trophy } from 'lucide-react';
import LudoToken from './LudoToken';
import {
  TRACK_COORDINATES,
  HOME_LANES,
  PLAYER_OFFSETS,
  TOTAL_TRACK_CELLS,
  GOAL_STEP,
} from '../utils/ludoBoardPath';

export default function LudoBoard({
  redTokens = [],
  yellowTokens = [],
  validTokenIds = [],
  myColor,
  isMyTurn,
  turnPhase,
  movingTokenId,
  onTokenClick,
}) {
  const isRedTurn = isMyTurn && myColor === 'red' && (turnPhase === 'waitingForMove' || turnPhase === 'move');
  const isYellowTurn = isMyTurn && myColor === 'yellow' && (turnPhase === 'waitingForMove' || turnPhase === 'move');

  const redInGoal = redTokens.filter((t) => t.step === GOAL_STEP).length;
  const yellowInGoal = yellowTokens.filter((t) => t.step === GOAL_STEP).length;

  return (
    <div
      id="ludo-board-wrapper"
      className="w-full max-w-[340px] sm:max-w-[460px] md:max-w-[500px] aspect-square rounded-3xl bg-slate-950 p-2 sm:p-3 border-2 border-white/15 shadow-2xl relative select-none overflow-hidden"
    >
      {/* 15x15 Grid Layout */}
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 gap-[1.5px] bg-slate-900/90 rounded-2xl p-1 border border-white/10 relative">
        {/* 1. TOP-LEFT: RED YARD (6x6) */}
        <div
          id="red-home-yard"
          className="col-span-6 row-span-6 rounded-2xl bg-gradient-to-br from-rose-600/30 to-rose-950/80 border-2 border-rose-500/50 p-2 sm:p-3 flex flex-col justify-between relative shadow-inner"
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase text-rose-300 tracking-wider">
            <span>Red Base</span>
            <span className="text-[10px] text-rose-400/80 font-mono">P1</span>
          </div>

          {/* 4 Token Slots inside Red Base */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-1.5 sm:p-2.5 bg-black/40 rounded-xl border border-rose-500/30">
            {[0, 1, 2, 3].map((idx) => {
              const token = redTokens.find((t) => t.id === idx);
              const inYard = token && token.step === -1;
              const isMovable = isRedTurn && inYard && validTokenIds.includes(idx);

              return (
                <div
                  key={`red-yard-slot-${idx}`}
                  onClick={() => isMovable && onTokenClick(idx, 'red')}
                  className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                    inYard
                      ? 'bg-rose-500/20 border border-rose-400/40'
                      : 'bg-white/5 border border-dashed border-white/10'
                  } ${
                    isMovable
                      ? 'ring-4 ring-rose-400 ring-offset-2 ring-offset-black scale-110 cursor-pointer animate-bounce z-20'
                      : ''
                  }`}
                >
                  {inYard && (
                    <LudoToken
                      token={token}
                      color="red"
                      isMovable={isMovable}
                      isMoving={movingTokenId === idx && myColor === 'red'}
                      onClick={() => onTokenClick(idx, 'red')}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-rose-300/60 text-center font-mono">
            Roll 6 to enter
          </div>
        </div>

        {/* 2. TOP-RIGHT: GREEN YARD (6x6 Decorative Classic) */}
        <div
          id="green-home-yard"
          className="col-span-6 row-span-6 rounded-2xl bg-gradient-to-br from-emerald-600/15 to-emerald-950/40 border border-emerald-500/20 p-2 sm:p-3 flex flex-col justify-between opacity-50"
        >
          <div className="text-[10px] sm:text-xs font-bold uppercase text-emerald-400/60 tracking-wider">
            Green Zone
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-black/20 rounded-xl border border-emerald-500/10">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={`green-slot-${idx}`}
                className="aspect-square rounded-full bg-emerald-500/5 border border-dashed border-emerald-500/20"
              />
            ))}
          </div>
          <div className="text-[9px] text-emerald-400/40 text-center font-mono">Classic Track</div>
        </div>

        {/* 3. BOTTOM-LEFT: BLUE YARD (6x6 Decorative Classic) */}
        <div
          id="blue-home-yard"
          className="col-span-6 row-span-6 rounded-2xl bg-gradient-to-br from-cyan-600/15 to-cyan-950/40 border border-cyan-500/20 p-2 sm:p-3 flex flex-col justify-between opacity-50"
        >
          <div className="text-[10px] sm:text-xs font-bold uppercase text-cyan-400/60 tracking-wider">
            Blue Zone
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-black/20 rounded-xl border border-cyan-500/10">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={`blue-slot-${idx}`}
                className="aspect-square rounded-full bg-cyan-500/5 border border-dashed border-cyan-500/20"
              />
            ))}
          </div>
          <div className="text-[9px] text-cyan-400/40 text-center font-mono">Classic Track</div>
        </div>

        {/* 4. BOTTOM-RIGHT: YELLOW YARD (6x6) */}
        <div
          id="yellow-home-yard"
          className="col-span-6 row-span-6 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-950/80 border-2 border-amber-400/50 p-2 sm:p-3 flex flex-col justify-between relative shadow-inner"
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase text-amber-300 tracking-wider">
            <span>Yellow Base</span>
            <span className="text-[10px] text-amber-400/80 font-mono">P2</span>
          </div>

          {/* 4 Token Slots inside Yellow Base */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-1.5 sm:p-2.5 bg-black/40 rounded-xl border border-amber-500/30">
            {[0, 1, 2, 3].map((idx) => {
              const token = yellowTokens.find((t) => t.id === idx);
              const inYard = token && token.step === -1;
              const isMovable = isYellowTurn && inYard && validTokenIds.includes(idx);

              return (
                <div
                  key={`yellow-yard-slot-${idx}`}
                  onClick={() => isMovable && onTokenClick(idx, 'yellow')}
                  className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                    inYard
                      ? 'bg-amber-500/20 border border-amber-400/40'
                      : 'bg-white/5 border border-dashed border-white/10'
                  } ${
                    isMovable
                      ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-black scale-110 cursor-pointer animate-bounce z-20'
                      : ''
                  }`}
                >
                  {inYard && (
                    <LudoToken
                      token={token}
                      color="yellow"
                      isMovable={isMovable}
                      isMoving={movingTokenId === idx && myColor === 'yellow'}
                      onClick={() => onTokenClick(idx, 'yellow')}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-amber-300/60 text-center font-mono">
            Roll 6 to enter
          </div>
        </div>

        {/* 5. CENTER GOAL AREA (3x3 - rows 6..8, cols 6..8) */}
        <div
          id="center-goal-area"
          className="col-start-7 col-end-10 row-start-7 row-end-10 rounded-xl bg-slate-900 border-2 border-indigo-500/40 relative overflow-hidden flex items-center justify-center shadow-2xl"
        >
          {/* Red Triangle (Left) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2 bg-rose-600/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
          >
            {redInGoal > 0 && (
              <span className="text-xs font-black text-rose-300 ml-1">{redInGoal}</span>
            )}
          </div>

          {/* Yellow Triangle (Right) */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 bg-amber-500/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }}
          >
            {yellowInGoal > 0 && (
              <span className="text-xs font-black text-amber-300 mr-1">{yellowInGoal}</span>
            )}
          </div>

          {/* Top Triangle */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 bg-emerald-600/20"
            style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
          />

          {/* Bottom Triangle */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-cyan-600/20"
            style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
          />

          {/* Center Crown / Trophy */}
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-900 border border-white/40 flex items-center justify-center text-amber-300 z-10 shadow-lg">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
          </div>
        </div>

        {/* 6. TRACK CELLS & TOKENS RENDERING */}
        {TRACK_COORDINATES.map((cell, trackIdx) => {
          const isRedStart = trackIdx === 0;
          const isYellowStart = trackIdx === 26;
          const isSafe = cell.safe;

          // Collect tokens currently situated on this track cell
          const tokensOnCell = [];

          redTokens.forEach((t) => {
            if (t.step >= 0 && t.step <= 50) {
              const stepTrack = (PLAYER_OFFSETS.red + t.step) % TOTAL_TRACK_CELLS;
              if (stepTrack === trackIdx) {
                tokensOnCell.push({ ...t, color: 'red' });
              }
            }
          });

          yellowTokens.forEach((t) => {
            if (t.step >= 0 && t.step <= 50) {
              const stepTrack = (PLAYER_OFFSETS.yellow + t.step) % TOTAL_TRACK_CELLS;
              if (stepTrack === trackIdx) {
                tokensOnCell.push({ ...t, color: 'yellow' });
              }
            }
          });

          return (
            <div
              key={`track-cell-${trackIdx}`}
              style={{
                gridColumnStart: cell.c + 1,
                gridRowStart: cell.r + 1,
              }}
              className={`rounded-[4px] sm:rounded-md flex items-center justify-center relative transition-all ${
                isRedStart
                  ? 'bg-rose-600/50 border border-rose-400/80 shadow-sm shadow-rose-600/30'
                  : isYellowStart
                  ? 'bg-amber-500/50 border border-amber-400/80 shadow-sm shadow-amber-500/30'
                  : isSafe
                  ? 'bg-indigo-950/60 border border-indigo-500/40'
                  : 'bg-white/[0.04] border border-white/5'
              }`}
            >
              {/* Safe Star Indicator */}
              {isSafe && tokensOnCell.length === 0 && (
                <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-indigo-400/70" />
              )}

              {/* Start Arrow Indicators */}
              {isRedStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2.5 h-2.5 text-rose-300 rotate-0" />
              )}
              {isYellowStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2.5 h-2.5 text-amber-300 rotate-180" />
              )}

              {/* Stacked Tokens */}
              {tokensOnCell.map((tok, i) => {
                const isMovable =
                  tok.color === 'red'
                    ? isRedTurn && validTokenIds.includes(tok.id)
                    : isYellowTurn && validTokenIds.includes(tok.id);

                return (
                  <LudoToken
                    key={`tok-${tok.color}-${tok.id}`}
                    token={tok}
                    color={tok.color}
                    isMovable={isMovable}
                    isMoving={movingTokenId === tok.id && myColor === tok.color}
                    onClick={() => onTokenClick(tok.id, tok.color)}
                    stackOffset={{
                      x: tokensOnCell.length > 1 ? (i - 0.5) * 4 : 0,
                      y: tokensOnCell.length > 1 ? (i - 0.5) * 4 : 0,
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* 7. RED HOME STRETCH LANE (5 cells leading to center) */}
        {HOME_LANES.red.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = redTokens.find((t) => t.step === stepNum);
          const isMovable = isRedTurn && tokenOnLane && validTokenIds.includes(tokenOnLane.id);

          return (
            <div
              key={`red-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[4px] sm:rounded-md bg-rose-600/40 border border-rose-500/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="red"
                  isMovable={isMovable}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'red'}
                  onClick={() => onTokenClick(tokenOnLane.id, 'red')}
                />
              )}
            </div>
          );
        })}

        {/* 8. YELLOW HOME STRETCH LANE (5 cells leading to center) */}
        {HOME_LANES.yellow.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = yellowTokens.find((t) => t.step === stepNum);
          const isMovable = isYellowTurn && tokenOnLane && validTokenIds.includes(tokenOnLane.id);

          return (
            <div
              key={`yellow-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[4px] sm:rounded-md bg-amber-500/40 border border-amber-400/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="yellow"
                  isMovable={isMovable}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'yellow'}
                  onClick={() => onTokenClick(tokenOnLane.id, 'yellow')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
