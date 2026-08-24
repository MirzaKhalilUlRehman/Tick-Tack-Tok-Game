/**
 * Ludo 15x15 Interactive Board Component with Embedded Home Dice
 * Fully supports 2-Player Ludo across all 4 classic colors (Red, Green, Blue, Yellow).
 * Renders individual color dice physically inside each color's home yard.
 */
import React from 'react';
import { Star, ArrowRight, Trophy, Swords, Crown, Shield } from 'lucide-react';
import LudoToken from './LudoToken';
import LudoHomeDice from './LudoHomeDice';
import {
  TRACK_COORDINATES,
  HOME_LANES,
  PLAYER_OFFSETS,
  TOTAL_TRACK_CELLS,
  GOAL_STEP,
  stepToGlobalTrackIndex,
} from '../utils/ludoBoardPath';

export default function LudoBoard({
  tokens = {},
  activeColors = ['red', 'yellow'],
  player1,
  player2,
  myId,
  myColor,
  currentTurn,
  currentTurnColor,
  turnPhase,
  diceValue,
  animatingDiceValue,
  isRolling,
  pendingDice = [],
  selectedDiceIndex = 0,
  validTokenIds = [],
  isMandatoryCapture = false,
  capturingTokenIds = [],
  movingTokenId,
  selectedScoreTokenId = null,
  tokenScoreOptions = [],
  onRoll,
  onSelectPendingDice,
  onTokenClick,
  onSelectTokenScore,
}) {
  const isMyTurn = currentTurn === myId;

  // Helper to get tokens for a specific color with guaranteed 4 tokens
  const getColorTokens = (color) => {
    const list = tokens[color];
    if (Array.isArray(list) && list.length === 4) return list;
    if (Array.isArray(list) && list.length > 0) {
      const map = new Map();
      list.forEach((t, i) => map.set(typeof t?.id === 'number' ? t.id : i, t));
      return [0, 1, 2, 3].map((id) => {
        const existing = map.get(id);
        return {
          id,
          step: existing && typeof existing.step === 'number' ? existing.step : -1,
          color: existing?.color || color,
        };
      });
    }
    return [
      { id: 0, step: -1, color },
      { id: 1, step: -1, color },
      { id: 2, step: -1, color },
      { id: 3, step: -1, color },
    ];
  };

  // Helper to check if a specific color is active in this 2-player match
  const isColorActive = (color) => {
    return activeColors.includes(color) || (player1?.color === color) || (player2?.color === color);
  };

  // Get player associated with a color
  const getPlayerForColor = (color) => {
    if (player1?.color === color) return player1;
    if (player2?.color === color) return player2;
    return null;
  };

  // Handle Yard Token Click
  const handleYardClick = (color) => {
    if (color !== myColor || !isMyTurn) return;
    const yardTokens = getColorTokens(color).filter((t) => t.step === -1);
    const movable = yardTokens.filter((t) => validTokenIds.includes(t.id));

    if (movable.length > 0) {
      onTokenClick(movable[0].id, color);
    }
  };

  // Handle Track Cell Click
  const handleCellClick = (tokensOnCell, cellColor) => {
    if (!isMyTurn) return;
    const myTokensOnCell = tokensOnCell.filter((t) => t.color === myColor);
    const movable = myTokensOnCell.filter((t) => validTokenIds.includes(t.id));

    if (movable.length > 0) {
      onTokenClick(movable[0].id, myColor);
    }
  };

  // Calculate tokens reached goal
  const getGoalCount = (color) => {
    return getColorTokens(color).filter((t) => t.step === GOAL_STEP).length;
  };

  /**
   * Renders a 6x6 Home Yard with 4 Token Slots and Center Home Dice
   */
  const renderHomeYard = (color, id, title, colClass, gradientClass, borderClass, textClass) => {
    const active = isColorActive(color);
    const player = getPlayerForColor(color);
    const isThisPlayerTurn = currentTurnColor === color;
    const isThisMyColor = myColor === color;
    const colorTokens = getColorTokens(color);
    const yardTokens = colorTokens.filter((t) => t.step === -1);
    const isColorTurnToMove = isMyTurn && isThisMyColor && (turnPhase === 'waitingForMove' || turnPhase === 'move');
    const colorYardMovable = isColorTurnToMove ? yardTokens.filter((t) => validTokenIds.includes(t.id)) : [];

    return (
      <div
        id={id}
        onClick={() => active && isColorTurnToMove && colorYardMovable.length > 0 && handleYardClick(color)}
        className={`${colClass} rounded-2xl ${gradientClass} ${borderClass} p-1.5 sm:p-2.5 flex flex-col justify-between relative shadow-inner select-none transition-all ${
          active
            ? isThisPlayerTurn
              ? 'ring-2 ring-white/60 shadow-xl'
              : 'opacity-90'
            : 'opacity-35 grayscale-[40%]'
        } ${active && isColorTurnToMove && colorYardMovable.length > 0 ? 'cursor-pointer hover:border-white ring-2 ring-white/70' : ''}`}
      >
        {/* Yard Header */}
        <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-0.5">
          <div className="flex items-center gap-1">
            <span className={textClass}>{title}</span>
            {active && isColorTurnToMove && isMandatoryCapture && colorYardMovable.some((t) => capturingTokenIds.includes(t.id)) && (
              <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400 animate-pulse" />
            )}
          </div>
          {active && player && (
            <span className={`text-[7px] sm:text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 ${textClass} truncate max-w-[65px] sm:max-w-[75px]`}>
              {player.displayName} {player.playerId === myId ? '(You)' : ''}
            </span>
          )}
          {!active && (
            <span className="text-[7px] sm:text-[8px] text-white/30 font-mono">Inactive</span>
          )}
        </div>

        {/* 4 Goti Arena (2x2 Grid at the top area) */}
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 bg-black/45 rounded-xl border border-white/10 items-center justify-items-center my-0.5">
          {/* 1. Slot 0 (Top-Left) */}
          {renderYardSlot(color, 0, colorTokens, active, isColorTurnToMove)}

          {/* 2. Slot 1 (Top-Right) */}
          {renderYardSlot(color, 1, colorTokens, active, isColorTurnToMove)}

          {/* 3. Slot 2 (Bottom-Left) */}
          {renderYardSlot(color, 2, colorTokens, active, isColorTurnToMove)}

          {/* 4. Slot 3 (Bottom-Right) */}
          {renderYardSlot(color, 3, colorTokens, active, isColorTurnToMove)}
        </div>

        {/* Bottom Area: Physical Home Dice for this Color */}
        <div className="w-full flex flex-col items-center justify-center pt-0.5">
          {active ? (
            <LudoHomeDice
              color={color}
              diceValue={diceValue}
              animatingValue={animatingDiceValue}
              isRolling={isRolling}
              isMyTurn={isMyTurn}
              isThisColorTurn={isThisPlayerTurn}
              isMyColor={isThisMyColor}
              turnPhase={turnPhase}
              pendingDice={pendingDice}
              selectedDiceIndex={selectedDiceIndex}
              onRoll={onRoll}
              onSelectPendingDice={onSelectPendingDice}
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-dashed border-white/15 flex items-center justify-center opacity-30">
              <span className="text-[8px] sm:text-[10px]">🎲</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Helper to render individual token yard slot
   */
  const renderYardSlot = (color, idx, colorTokens, active, isColorTurnToMove) => {
    if (!active) {
      return (
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-dashed border-white/10" />
      );
    }

    const token = colorTokens.find((t) => t.id === idx) || { id: idx, step: -1, color };
    const inYard = token && token.step === -1;
    const isMovable = isColorTurnToMove && inYard && validTokenIds.includes(idx);
    const isCapturing = inYard && capturingTokenIds.includes(idx);

    return (
      <div
        id={`${color}-yard-slot-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isMovable) onTokenClick(idx, color);
        }}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
          inYard
            ? 'bg-white/10 border border-white/30'
            : 'bg-white/5 border border-dashed border-white/10'
        } ${
          isMovable
            ? 'ring-3 ring-white ring-offset-1 ring-offset-black scale-120 cursor-pointer animate-bounce z-30'
            : ''
        }`}
      >
        {inYard && (
          <LudoToken
            token={token}
            color={color}
            isMovable={isMovable}
            isCapturing={isCapturing}
            isMoving={movingTokenId === idx && myColor === color}
            isSelectedForScore={selectedScoreTokenId === idx && myColor === color}
            scoreOptions={selectedScoreTokenId === idx && myColor === color ? tokenScoreOptions : []}
            onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(idx, diceIndex)}
            onClick={(e) => {
              if (e?.stopPropagation) e.stopPropagation();
              onTokenClick(idx, color);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      id="ludo-board-wrapper"
      className="w-full max-w-[340px] sm:max-w-[430px] md:max-w-[470px] aspect-square rounded-3xl bg-slate-950 p-2 sm:p-2.5 border-2 border-white/15 shadow-2xl relative select-none overflow-hidden"
    >
      {/* 15x15 Grid Layout */}
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 gap-[1px] sm:gap-[1.5px] bg-slate-900/90 rounded-2xl p-1 border border-white/10 relative">
        {/* 1. TOP-LEFT: RED YARD (6x6) */}
        {renderHomeYard(
          'red',
          'red-home-yard',
          'Red Base',
          'col-start-1 col-end-7 row-start-1 row-end-7',
          'bg-gradient-to-br from-rose-600/30 to-rose-950/80',
          'border-2 border-rose-500/50',
          'text-rose-300'
        )}

        {/* 2. TOP-RIGHT: GREEN YARD (6x6) */}
        {renderHomeYard(
          'green',
          'green-home-yard',
          'Green Base',
          'col-start-10 col-end-16 row-start-1 row-end-7',
          'bg-gradient-to-br from-emerald-600/30 to-emerald-950/80',
          'border-2 border-emerald-500/50',
          'text-emerald-300'
        )}

        {/* 3. BOTTOM-LEFT: BLUE YARD (6x6) */}
        {renderHomeYard(
          'blue',
          'blue-home-yard',
          'Blue Base',
          'col-start-1 col-end-7 row-start-10 row-end-16',
          'bg-gradient-to-br from-cyan-600/30 to-cyan-950/80',
          'border-2 border-cyan-500/50',
          'text-cyan-300'
        )}

        {/* 4. BOTTOM-RIGHT: YELLOW YARD (6x6) */}
        {renderHomeYard(
          'yellow',
          'yellow-home-yard',
          'Yellow Base',
          'col-start-10 col-end-16 row-start-10 row-end-16',
          'bg-gradient-to-br from-amber-500/30 to-amber-950/80',
          'border-2 border-amber-400/50',
          'text-amber-300'
        )}

        {/* 5. CENTER GOAL AREA (3x3 - rows 7..9, cols 7..9) */}
        <div
          id="center-goal-area"
          className="col-start-7 col-end-10 row-start-7 row-end-10 rounded-xl bg-slate-900 border-2 border-indigo-500/40 relative overflow-hidden flex items-center justify-center shadow-2xl"
        >
          {/* Red Triangle (Left) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2 bg-rose-600/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
          >
            {getGoalCount('red') > 0 && (
              <span className="text-[10px] sm:text-xs font-black text-rose-300 ml-0.5">{getGoalCount('red')}</span>
            )}
          </div>

          {/* Green Triangle (Top) */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 bg-emerald-600/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
          >
            {getGoalCount('green') > 0 && (
              <span className="text-[10px] sm:text-xs font-black text-emerald-300 -mt-2">{getGoalCount('green')}</span>
            )}
          </div>

          {/* Yellow Triangle (Right) */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 bg-amber-500/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }}
          >
            {getGoalCount('yellow') > 0 && (
              <span className="text-[10px] sm:text-xs font-black text-amber-300 mr-0.5">{getGoalCount('yellow')}</span>
            )}
          </div>

          {/* Blue Triangle (Bottom) */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-cyan-600/30 flex items-center justify-center"
            style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
          >
            {getGoalCount('blue') > 0 && (
              <span className="text-[10px] sm:text-xs font-black text-cyan-300 mt-2">{getGoalCount('blue')}</span>
            )}
          </div>

          {/* Center Trophy Emblem */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-900 border border-white/40 flex items-center justify-center text-amber-300 z-10 shadow-lg">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
          </div>
        </div>

        {/* 6. TRACK CELLS & TOKENS RENDERING (52 Track Cells) */}
        {TRACK_COORDINATES.map((cell, trackIdx) => {
          const isRedStart = trackIdx === 0;
          const isGreenStart = trackIdx === 13;
          const isYellowStart = trackIdx === 26;
          const isBlueStart = trackIdx === 39;
          const isSafe = cell.safe;

          // Collect tokens currently on this track cell
          const tokensOnCell = [];
          activeColors.forEach((col) => {
            const colToks = getColorTokens(col);
            colToks.forEach((t) => {
              if (t.step >= 0 && t.step <= 50) {
                const trackPos = stepToGlobalTrackIndex(col, t.step);
                if (trackPos === trackIdx) {
                  tokensOnCell.push({ ...t, color: col });
                }
              }
            });
          });

          const myTokensHere = tokensOnCell.filter((t) => t.color === myColor);
          const hasMultipleMyTokens = myTokensHere.length > 1;
          const anyMovableHere = isMyTurn && myTokensHere.some((t) => validTokenIds.includes(t.id));

          return (
            <div
              key={`track-cell-${trackIdx}`}
              onClick={() => anyMovableHere && handleCellClick(tokensOnCell, myColor)}
              style={{
                gridColumnStart: cell.c + 1,
                gridRowStart: cell.r + 1,
              }}
              className={`rounded-[3px] sm:rounded-md flex items-center justify-center relative transition-all ${
                isRedStart
                  ? 'bg-rose-600/50 border border-rose-400/80 shadow-sm shadow-rose-600/30'
                  : isGreenStart
                  ? 'bg-emerald-600/50 border border-emerald-400/80 shadow-sm shadow-emerald-600/30'
                  : isYellowStart
                  ? 'bg-amber-500/50 border border-amber-400/80 shadow-sm shadow-amber-500/30'
                  : isBlueStart
                  ? 'bg-cyan-600/50 border border-cyan-400/80 shadow-sm shadow-cyan-600/30'
                  : isSafe
                  ? 'bg-indigo-950/60 border border-indigo-500/40'
                  : 'bg-white/[0.04] border border-white/5'
              } ${anyMovableHere ? 'cursor-pointer hover:ring-2 hover:ring-white z-20' : ''}`}
            >
              {/* Safe Star Indicator */}
              {isSafe && tokensOnCell.length === 0 && (
                <Star className="w-2 h-2 sm:w-3 sm:h-3 text-indigo-400/70" />
              )}

              {/* Start Arrows */}
              {isRedStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2 h-2 text-rose-300 rotate-0" />
              )}
              {isGreenStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2 h-2 text-emerald-300 rotate-90" />
              )}
              {isYellowStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2 h-2 text-amber-300 rotate-180" />
              )}
              {isBlueStart && tokensOnCell.length === 0 && (
                <ArrowRight className="w-2 h-2 text-cyan-300 -rotate-90" />
              )}

              {/* Stacked Tokens on Cell */}
              {tokensOnCell.map((tok, i) => {
                const isTokMyTurn = isMyTurn && tok.color === myColor;
                const isMovable = isTokMyTurn && validTokenIds.includes(tok.id);
                const isCapturing = isMovable && capturingTokenIds.includes(tok.id);

                return (
                  <LudoToken
                    key={`tok-${tok.color}-${tok.id}`}
                    token={tok}
                    color={tok.color}
                    isMovable={isMovable}
                    isCapturing={isCapturing}
                    stackCount={tokensOnCell.length}
                    isMoving={movingTokenId === tok.id && myColor === tok.color}
                    isSelectedForScore={selectedScoreTokenId === tok.id && myColor === tok.color}
                    scoreOptions={selectedScoreTokenId === tok.id && myColor === tok.color ? tokenScoreOptions : []}
                    onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(tok.id, diceIndex)}
                    onClick={(e) => {
                      onTokenClick(tok.id, tok.color);
                    }}
                    stackOffset={{
                      x: tokensOnCell.length > 1 ? (i - (tokensOnCell.length - 1) / 2) * 3 : 0,
                      y: tokensOnCell.length > 1 ? (i - (tokensOnCell.length - 1) / 2) * 3 : 0,
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* 7. HOME STRETCH LANES (Red, Green, Yellow, Blue) */}
        {/* Red Home Stretch (Left arm) */}
        {HOME_LANES.red.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = getColorTokens('red').find((t) => t.step === stepNum);
          const isMovable = isMyTurn && myColor === 'red' && tokenOnLane && validTokenIds.includes(tokenOnLane.id);
          const isCapturing = isMovable && capturingTokenIds.includes(tokenOnLane?.id);

          return (
            <div
              key={`red-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[3px] sm:rounded-md bg-rose-600/40 border border-rose-500/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="red"
                  isMovable={isMovable}
                  isCapturing={isCapturing}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'red'}
                  isSelectedForScore={selectedScoreTokenId === tokenOnLane.id && myColor === 'red'}
                  scoreOptions={selectedScoreTokenId === tokenOnLane.id && myColor === 'red' ? tokenScoreOptions : []}
                  onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(tokenOnLane.id, diceIndex)}
                  onClick={() => onTokenClick(tokenOnLane.id, 'red')}
                />
              )}
            </div>
          );
        })}

        {/* Green Home Stretch (Top arm) */}
        {HOME_LANES.green.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = getColorTokens('green').find((t) => t.step === stepNum);
          const isMovable = isMyTurn && myColor === 'green' && tokenOnLane && validTokenIds.includes(tokenOnLane.id);
          const isCapturing = isMovable && capturingTokenIds.includes(tokenOnLane?.id);

          return (
            <div
              key={`green-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[3px] sm:rounded-md bg-emerald-600/40 border border-emerald-500/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="green"
                  isMovable={isMovable}
                  isCapturing={isCapturing}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'green'}
                  isSelectedForScore={selectedScoreTokenId === tokenOnLane.id && myColor === 'green'}
                  scoreOptions={selectedScoreTokenId === tokenOnLane.id && myColor === 'green' ? tokenScoreOptions : []}
                  onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(tokenOnLane.id, diceIndex)}
                  onClick={() => onTokenClick(tokenOnLane.id, 'green')}
                />
              )}
            </div>
          );
        })}

        {/* Yellow Home Stretch (Right arm) */}
        {HOME_LANES.yellow.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = getColorTokens('yellow').find((t) => t.step === stepNum);
          const isMovable = isMyTurn && myColor === 'yellow' && tokenOnLane && validTokenIds.includes(tokenOnLane.id);
          const isCapturing = isMovable && capturingTokenIds.includes(tokenOnLane?.id);

          return (
            <div
              key={`yellow-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[3px] sm:rounded-md bg-amber-500/40 border border-amber-400/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="yellow"
                  isMovable={isMovable}
                  isCapturing={isCapturing}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'yellow'}
                  isSelectedForScore={selectedScoreTokenId === tokenOnLane.id && myColor === 'yellow'}
                  scoreOptions={selectedScoreTokenId === tokenOnLane.id && myColor === 'yellow' ? tokenScoreOptions : []}
                  onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(tokenOnLane.id, diceIndex)}
                  onClick={() => onTokenClick(tokenOnLane.id, 'yellow')}
                />
              )}
            </div>
          );
        })}

        {/* Blue Home Stretch (Bottom arm) */}
        {HOME_LANES.blue.slice(0, 5).map((laneCell, laneIdx) => {
          const stepNum = 51 + laneIdx;
          const tokenOnLane = getColorTokens('blue').find((t) => t.step === stepNum);
          const isMovable = isMyTurn && myColor === 'blue' && tokenOnLane && validTokenIds.includes(tokenOnLane.id);
          const isCapturing = isMovable && capturingTokenIds.includes(tokenOnLane?.id);

          return (
            <div
              key={`blue-home-lane-${laneIdx}`}
              style={{
                gridColumnStart: laneCell.c + 1,
                gridRowStart: laneCell.r + 1,
              }}
              className="rounded-[3px] sm:rounded-md bg-cyan-600/40 border border-cyan-500/60 flex items-center justify-center relative shadow-sm"
            >
              {tokenOnLane && (
                <LudoToken
                  token={tokenOnLane}
                  color="blue"
                  isMovable={isMovable}
                  isCapturing={isCapturing}
                  isMoving={movingTokenId === tokenOnLane.id && myColor === 'blue'}
                  isSelectedForScore={selectedScoreTokenId === tokenOnLane.id && myColor === 'blue'}
                  scoreOptions={selectedScoreTokenId === tokenOnLane.id && myColor === 'blue' ? tokenScoreOptions : []}
                  onSelectScore={(diceIndex) => onSelectTokenScore && onSelectTokenScore(tokenOnLane.id, diceIndex)}
                  onClick={() => onTokenClick(tokenOnLane.id, 'blue')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
