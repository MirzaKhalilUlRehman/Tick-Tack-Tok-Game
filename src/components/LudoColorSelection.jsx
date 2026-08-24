/**
 * Ludo 4-Color Atomic Selection Component
 * Allows 2 players to choose their active color (Red, Green, Blue, Yellow) in real-time.
 * Atomic Firebase transaction prevents race conditions.
 */
import React, { useState } from 'react';
import { Crown, Check, Sparkles, Shield, Lock, Loader2, AlertCircle } from 'lucide-react';
import { getAvatarById } from '../data/avatars';

const LUDO_COLORS = [
  {
    id: 'red',
    name: 'Red',
    label: 'Red Base',
    position: 'Top-Left Base',
    dot: '🔴',
    badge: 'Starts 1st',
    bgGradient: 'from-rose-600/30 to-rose-950/80',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-400',
    activeRing: 'ring-rose-400',
    btnBg: 'bg-rose-600 hover:bg-rose-500',
    iconBg: 'from-rose-500 to-rose-700',
  },
  {
    id: 'green',
    name: 'Green',
    label: 'Green Base',
    position: 'Top-Right Base',
    dot: '🟢',
    badge: 'Classic',
    bgGradient: 'from-emerald-600/30 to-emerald-950/80',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-400',
    activeRing: 'ring-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-500',
    iconBg: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'blue',
    name: 'Blue',
    label: 'Blue Base',
    position: 'Bottom-Left Base',
    dot: '🔵',
    badge: 'Classic',
    bgGradient: 'from-cyan-600/30 to-cyan-950/80',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-400',
    activeRing: 'ring-cyan-400',
    btnBg: 'bg-cyan-600 hover:bg-cyan-500',
    iconBg: 'from-cyan-500 to-cyan-700',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    label: 'Yellow Base',
    position: 'Bottom-Right Base',
    dot: '🟡',
    badge: 'Classic',
    bgGradient: 'from-amber-500/30 to-amber-950/80',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    activeRing: 'ring-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    iconBg: 'from-amber-400 to-amber-600',
  },
];

export default function LudoColorSelection({
  pairId,
  gameData,
  playerProfile,
  onSelectColor,
}) {
  const [isReserving, setIsReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const myId = playerProfile?.playerId;
  const p1 = gameData?.players?.player1;
  const p2 = gameData?.players?.player2;
  const isP1 = p1?.playerId === myId;

  const colorSelection = gameData?.colorSelection || {};

  // Determine current player's chosen color
  let myChosenColor = null;
  if (isP1 && p1?.color) myChosenColor = p1.color;
  else if (!isP1 && p2?.color) myChosenColor = p2.color;
  else {
    for (const [col, res] of Object.entries(colorSelection)) {
      if (res?.playerId === myId) {
        myChosenColor = col;
        break;
      }
    }
  }

  // Determine opponent's chosen color
  const opponent = isP1 ? p2 : p1;
  const opponentId = opponent?.playerId;
  let opponentChosenColor = null;
  if (opponent?.color) opponentChosenColor = opponent.color;
  else if (opponentId) {
    for (const [col, res] of Object.entries(colorSelection)) {
      if (res?.playerId === opponentId) {
        opponentChosenColor = col;
        break;
      }
    }
  }

  const p1Avatar = getAvatarById(p1?.avatar || 'fox');
  const p2Avatar = getAvatarById(p2?.avatar || 'bear');

  const handleCardClick = async (colorId) => {
    if (isReserving) return;
    if (colorId === myChosenColor) return;

    // Check if taken by opponent
    const res = colorSelection[colorId];
    if (res && res.playerId && res.playerId !== myId) {
      setErrorMessage(`${res.displayName || 'Opponent'} has already chosen ${colorId.toUpperCase()}.`);
      return;
    }

    setErrorMessage(null);
    setIsReserving(true);
    try {
      const result = await onSelectColor(colorId);
      if (result && result.success === false) {
        setErrorMessage(`That color was just taken. Please choose another.`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to select color. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div
      id="ludo-color-selection-screen"
      className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 text-center select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>2-Player Ludo Match Setup</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black font-display text-white">
          Choose Your Color
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-md mx-auto">
          Each player selects 1 of the 4 classic colors. The match begins immediately when both players are ready!
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 Ludo Colors Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {LUDO_COLORS.map((col) => {
          const reservation = colorSelection[col.id];
          const isSelectedByMe = myChosenColor === col.id || (reservation && reservation.playerId === myId);
          const isTakenByOpponent = (opponentChosenColor === col.id) || (reservation && reservation.playerId && reservation.playerId !== myId);
          const isAvailable = !isSelectedByMe && !isTakenByOpponent;

          const takerName = isTakenByOpponent
            ? (reservation?.displayName || opponent?.displayName || 'Opponent')
            : null;

          return (
            <div
              key={`color-card-${col.id}`}
              id={`select-${col.id}-color-card`}
              onClick={() => isAvailable && handleCardClick(col.id)}
              className={`relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden text-left ${
                isSelectedByMe
                  ? `bg-gradient-to-br ${col.bgGradient} ${col.borderColor} shadow-xl ring-2 ${col.activeRing}`
                  : isTakenByOpponent
                  ? 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'
                  : `bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06] cursor-pointer hover:scale-[1.02] active:scale-[0.98]`
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${col.iconBg} flex items-center justify-center text-white shadow-lg border border-white/20 font-black text-sm`}
                >
                  {col.dot}
                </div>

                {isSelectedByMe && (
                  <span className={`w-6 h-6 rounded-full ${col.id === 'yellow' ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-950'} flex items-center justify-center shadow-md font-bold`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}

                {isTakenByOpponent && (
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white/40 flex items-center justify-center border border-white/10">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-black font-display text-white">
                    {col.name}
                  </span>
                  {col.id === 'red' && <Crown className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <p className="text-[11px] text-white/50 font-mono mt-0.5">
                  {col.position}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-white/40 font-mono text-[10px]">Status</span>
                {isSelectedByMe ? (
                  <span className={`font-black uppercase tracking-wider text-[10px] ${col.textColor}`}>
                    ✓ Selected by You
                  </span>
                ) : isTakenByOpponent ? (
                  <span className="font-bold text-white/40 text-[10px] truncate max-w-[100px]">
                    Taken ({takerName})
                  </span>
                ) : (
                  <span className="font-bold text-indigo-300 text-[10px] hover:underline">
                    Available • Tap to Pick
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Players Connected Status */}
      <div className="flex items-center justify-between py-2 px-4 bg-black/30 rounded-2xl border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p1Avatar.color} flex items-center justify-center text-xs ring-1 ring-white/20`}>
            <span>{p1Avatar.emoji}</span>
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-[11px] truncate max-w-[90px]">
              {p1?.displayName || 'Player 1'} {isP1 && '(You)'}
            </div>
            <div className="text-[10px] font-mono text-white/60 uppercase">
              {p1?.color ? `🔴 ${p1.color}` : 'Choosing...'}
            </div>
          </div>
        </div>

        <span className="text-white/30 font-black text-xs font-mono">VS</span>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="font-bold text-white text-[11px] truncate max-w-[90px]">
              {p2?.displayName || 'Player 2'} {!isP1 && '(You)'}
            </div>
            <div className="text-[10px] font-mono text-white/60 uppercase">
              {p2?.color ? `🟡 ${p2.color}` : 'Choosing...'}
            </div>
          </div>
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p2Avatar.color} flex items-center justify-center text-xs ring-1 ring-white/20`}>
            <span>{p2Avatar.emoji}</span>
          </div>
        </div>
      </div>

      {/* Waiting Feedback */}
      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
        {isReserving ? (
          <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Reserving color in real-time...</span>
          </div>
        ) : myChosenColor && !opponentChosenColor ? (
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>You picked <strong>{myChosenColor.toUpperCase()}</strong>. Waiting for {opponent?.displayName || 'opponent'} to pick...</span>
          </div>
        ) : !myChosenColor ? (
          <p className="text-xs text-white/70">
            👉 Please tap any available color card above to lock in your color.
          </p>
        ) : (
          <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Both players ready! Entering game arena...</span>
          </div>
        )}
      </div>
    </div>
  );
}
