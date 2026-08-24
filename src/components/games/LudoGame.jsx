/**
 * 2-Player Multiplayer Ludo Game Component for KM
 * Features:
 * - Exactly 2 Players per match with 4-Color Selection (Red, Green, Blue, Yellow)
 * - Atomic Real-Time Color Selection prevents race conditions
 * - ONE Single Integrated Ludo Board with Embedded Physical Home Dice
 * - Individual Color Dice located inside each player's home base
 * - Mandatory Capture Rule enforcement with sound & visual prompts
 * - Stacked token picker modal
 * - Synchronized rematch and turns
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LogOut, WifiOff, AlertTriangle, Swords, Sparkles, Crown } from 'lucide-react';
import {
  rollLudoDice,
  moveLudoToken,
  passLudoTurn,
  resetLudoGame,
  selectLudoColor,
  selectPendingDiceIndex,
  getLegalMovesForDice,
} from '../../services/ludoService';
import { normalizeAllTokens } from '../../utils/ludoLogic';
import { useSound } from '../../hooks/useSound';
import LudoBoard from '../LudoBoard';
import LudoGameStatus from '../LudoGameStatus';
import LudoResult from '../LudoResult';
import LudoColorSelection from '../LudoColorSelection';
import { getAvatarById } from '../../data/avatars';

export default function LudoGame({
  pairId,
  gameData,
  pairData,
  playerProfile,
  isOpponentConnected = true,
  onLeaveMatch,
  onDisconnectTimeout,
}) {
  const [rollingDice, setRollingDice] = useState(false);
  const [movingTokenId, setMovingTokenId] = useState(null);
  const [animatingDiceValue, setAnimatingDiceValue] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(null);
  const [scorePickerToken, setScorePickerToken] = useState(null);

  const {
    playDiceRoll,
    playTokenMove,
    playTokenCapture,
    playBonusTurn,
    playWin,
    playPop,
    playClick,
  } = useSound();

  const prevWinnerRef = useRef(null);
  const prevMoveRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  const hasTriggeredResetRef = useRef(false);
  const isProcessingMoveRef = useRef(false);

  const p1 = pairData?.players?.player1 || gameData?.players?.player1;
  const p2 = pairData?.players?.player2 || gameData?.players?.player2;
  const myId = playerProfile?.playerId;

  const isPlayer1 = p1?.playerId === myId;
  const isPlayer2 = p2?.playerId === myId;

  // Determine colors of both players
  const p1Color = p1?.color || gameData?.players?.player1?.color || 'red';
  const p2Color = p2?.color || gameData?.players?.player2?.color || 'yellow';
  const myColor = isPlayer1 ? p1Color : isPlayer2 ? p2Color : 'red';
  const opponent = isPlayer1 ? p2 : p1;
  const opponentColor = isPlayer1 ? p2Color : p1Color;

  const activeColors = [p1Color, p2Color];

  const currentTurnId = gameData?.currentTurn;
  const isMyTurn = currentTurnId === myId;
  const currentTurnColor = currentTurnId === p1?.playerId ? p1Color : p2Color;

  const turnPhase = gameData?.turnPhase || 'waitingForRoll';
  const diceValue = gameData?.diceValue;
  const pendingDice = gameData?.pendingDice || [];
  const selectedDiceIndex = gameData?.selectedDiceIndex || 0;

  // Safe normalized token map guaranteeing 4 valid tokens for every color
  const safeTokens = useMemo(() => {
    return normalizeAllTokens(gameData?.tokens);
  }, [gameData?.tokens]);

  const playerTokens = safeTokens[myColor] || [];
  const opponentTokens = safeTokens[opponentColor] || [];
  const currentPending = (gameData?.pendingDice && gameData.pendingDice.length > 0)
    ? gameData.pendingDice
    : (gameData?.diceValue ? [gameData.diceValue] : []);

  const computedMovableInfo = useMemo(() => {
    if (!isMyTurn || (turnPhase !== 'waitingForMove' && turnPhase !== 'move')) {
      return {
        validTokenIds: [],
        capturingTokenIds: [],
        movesByToken: {},
        isMandatoryCapture: false,
      };
    }

    const legal = getLegalMovesForDice(
      myColor,
      playerTokens,
      currentPending,
      opponentColor,
      opponentTokens
    );

    return {
      validTokenIds: legal.validTokenIds.length > 0 ? legal.validTokenIds : (gameData?.validTokenIds || []),
      capturingTokenIds: legal.capturingTokenIds,
      movesByToken: legal.movesByToken,
      isMandatoryCapture: false,
    };
  }, [isMyTurn, turnPhase, currentPending, myColor, playerTokens, opponentColor, opponentTokens, gameData?.validTokenIds]);

  const validTokenIds = computedMovableInfo.validTokenIds;
  const isMandatoryCapture = computedMovableInfo.isMandatoryCapture;
  const capturingTokenIds = computedMovableInfo.capturingTokenIds.length > 0
    ? computedMovableInfo.capturingTokenIds
    : (gameData?.capturingTokenIds || []);

  const winnerId = gameData?.winner;
  const finishReason = gameData?.finishReason;
  const isFinished = gameData?.status === 'finished' || Boolean(winnerId);
  const isColorSelectionPhase = gameData?.status === 'color_selection' || !gameData?.status || gameData?.status === 'waiting';

  const [countdown, setCountdown] = useState(null);

  // Opponent disconnect grace countdown (30s)
  useEffect(() => {
    if (!isFinished && opponent && !isOpponentConnected) {
      let secondsLeft = 30;
      setReconnectCountdown(secondsLeft);

      reconnectIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setReconnectCountdown(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(reconnectIntervalRef.current);
          if (onDisconnectTimeout && opponent?.playerId) {
            onDisconnectTimeout(opponent.playerId);
          }
        }
      }, 1000);

      return () => {
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
        }
      };
    } else {
      setReconnectCountdown(null);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    }
  }, [isFinished, isOpponentConnected, opponent?.playerId, onDisconnectTimeout]);

  // Sound triggers for victory/loss
  useEffect(() => {
    if (winnerId && winnerId !== prevWinnerRef.current) {
      prevWinnerRef.current = winnerId;
      try {
        if (winnerId === myId) {
          playWin?.();
        }
      } catch (e) {}
    }
  }, [winnerId, myId, playWin]);

  // Synchronized Next Game Countdown
  useEffect(() => {
    const nextGameAt = gameData?.nextGameAt;
    if (isFinished && nextGameAt && !finishReason) {
      hasTriggeredResetRef.current = false;
      const updateTimer = () => {
        const remainingMs = nextGameAt - Date.now();
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        setCountdown(seconds);

        if (seconds <= 0 && !hasTriggeredResetRef.current) {
          hasTriggeredResetRef.current = true;
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          if (p1?.playerId === myId || (!p1 && p2?.playerId === myId)) {
            resetLudoGame(pairId, gameData);
          }
        }
      };

      updateTimer();
      countdownIntervalRef.current = setInterval(updateTimer, 500);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    } else {
      setCountdown(null);
      hasTriggeredResetRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, [isFinished, gameData?.nextGameAt, finishReason, pairId, p1?.playerId, p2?.playerId, myId, gameData?.round]);

  // Sound triggers for moves, captures, bonus turns
  useEffect(() => {
    const lastMove = gameData?.lastMove;
    if (lastMove && lastMove !== prevMoveRef.current) {
      prevMoveRef.current = lastMove;
      try {
        if (lastMove.captured) {
          playTokenCapture?.();
        } else if (lastMove.bonusTurn) {
          playBonusTurn?.();
        } else {
          playTokenMove?.();
        }
      } catch (e) {}
    }
  }, [gameData?.lastMove, playTokenCapture, playBonusTurn, playTokenMove]);

  // Handle auto-turn pass when no valid moves are possible
  useEffect(() => {
    if (turnPhase === 'no_moves' && isMyTurn && !isFinished) {
      const timer = setTimeout(async () => {
        try {
          await passLudoTurn(pairId, gameData);
        } catch (e) {
          console.error('Auto pass turn error:', e);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, isMyTurn, isFinished, pairId, gameData]);

  // Auto-reset score picker on turn or phase changes
  useEffect(() => {
    setScorePickerToken(null);
  }, [turnPhase, currentTurnId, isFinished]);

  // Dice roll handler
  const handleRollDice = async () => {
    const canRoll = isMyTurn && (turnPhase === 'waitingForRoll' || turnPhase === 'roll') && !rollingDice && !isFinished;
    if (!canRoll) return;

    try {
      setRollingDice(true);
      setScorePickerToken(null);
      playDiceRoll();

      // Dice roll visual animation
      let count = 0;
      const interval = setInterval(() => {
        setAnimatingDiceValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 7) {
          clearInterval(interval);
          setAnimatingDiceValue(null);
        }
      }, 55);

      await rollLudoDice(pairId, gameData, myId);
    } catch (err) {
      console.error('Dice roll error:', err);
    } finally {
      setRollingDice(false);
    }
  };

  // Executes token move with the specific chosen dice index
  const executeTokenMove = async (tokenId, diceIndex = 0) => {
    if (isProcessingMoveRef.current) return;
    isProcessingMoveRef.current = true;
    try {
      setMovingTokenId(tokenId);
      setScorePickerToken(null);
      playPop();
      await moveLudoToken(pairId, gameData, tokenId, myId, diceIndex);
    } catch (err) {
      console.error('Move token error:', err);
    } finally {
      setMovingTokenId(null);
      setTimeout(() => {
        isProcessingMoveRef.current = false;
      }, 300);
    }
  };

  // Token click handler: directly on board
  const handleTokenClick = async (tokenId, color) => {
    if (isProcessingMoveRef.current) return;
    const isMovePhase = turnPhase === 'waitingForMove' || turnPhase === 'move';
    if (!isMyTurn || !isMovePhase || isFinished) return;
    if (color !== myColor) return;

    const playerTokens = gameData?.tokens?.[myColor] || [];
    const opponentTokens = gameData?.tokens?.[opponentColor] || [];
    const currentPending = (gameData?.pendingDice && gameData.pendingDice.length > 0)
      ? gameData.pendingDice
      : (gameData?.diceValue ? [gameData.diceValue] : []);

    if (currentPending.length === 0) return;

    const legalMoves = getLegalMovesForDice(
      myColor,
      playerTokens,
      currentPending,
      opponentColor,
      opponentTokens
    );

    const tokenMoves = legalMoves.movesByToken[tokenId] || [];
    if (tokenMoves.length === 0) {
      return;
    }

    const distinctValues = new Set(tokenMoves.map((m) => m.diceValue));

    // If only one score option is legally usable (or all options have identical score value): move directly
    if (tokenMoves.length === 1 || distinctValues.size === 1) {
      await executeTokenMove(tokenId, tokenMoves[0].diceIndex);
    } else {
      // Multiple distinct scores available (e.g. [6, 4]) -> show floating score buttons above this clicked goti
      const uniqueOptions = [];
      const seen = new Set();
      for (const opt of tokenMoves) {
        if (!seen.has(opt.diceValue)) {
          seen.add(opt.diceValue);
          uniqueOptions.push({
            id: `diceResult_${opt.diceIndex + 1}`,
            index: opt.diceIndex,
            value: opt.diceValue,
            isCapture: opt.isCapture,
          });
        }
      }

      if (scorePickerToken?.tokenId === tokenId) {
        setScorePickerToken(null);
      } else {
        setScorePickerToken({
          tokenId,
          options: uniqueOptions,
        });
      }
    }
  };

  // Score chosen from the floating selector above the goti
  const handleSelectTokenScore = async (tokenId, diceIndex) => {
    await executeTokenMove(tokenId, diceIndex);
  };

  // Select pending die index
  const handleSelectPendingDice = async (index) => {
    try {
      playClick();
      await selectPendingDiceIndex(pairId, gameData, myId, index);
    } catch (e) {
      console.error('Select pending dice index error:', e);
    }
  };

  // Rematch / Next Round handler
  const handleReset = async () => {
    try {
      playClick();
      await resetLudoGame(pairId, gameData);
    } catch (e) {
      console.error('Reset game error:', e);
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveModal(false);
    playPop();
    if (onLeaveMatch) {
      await onLeaveMatch();
    }
  };

  // Color selection handlers
  const handleSelectColor = async (chosenColor) => {
    try {
      playClick();
      return await selectLudoColor(pairId, gameData, myId, chosenColor, playerProfile);
    } catch (e) {
      console.error('Color selection error:', e);
      return { success: false, message: e.message };
    }
  };

  // Render pre-match color selection screen if in color_selection phase
  if (isColorSelectionPhase) {
    return (
      <LudoColorSelection
        pairId={pairId}
        gameData={gameData}
        playerProfile={playerProfile}
        onSelectColor={handleSelectColor}
      />
    );
  }

  const winnerName = winnerId === p1?.playerId ? p1?.displayName : p2?.displayName;
  const p1Avatar = getAvatarById(p1?.avatar || 'fox');
  const p2Avatar = getAvatarById(p2?.avatar || 'bear');

  return (
    <div id="ludo-game-arena" className="w-full flex flex-col items-center select-none max-w-xl mx-auto">
      {/* Top Match Header / Players & Round Bar */}
      <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 mb-3 shadow-lg">
        {/* Player 1 Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p1Avatar.color} flex items-center justify-center text-sm shadow-md ring-1 ring-white/20`}>
            <span>{p1Avatar.emoji}</span>
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black font-display text-white truncate max-w-[85px]">
                {p1?.displayName || 'Player 1'}
              </span>
              {isPlayer1 && <span className="text-[10px] text-white/50 font-bold">(You)</span>}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold capitalize">
              <span className={`w-2 h-2 rounded-full ${
                p1Color === 'red' ? 'bg-rose-500' : p1Color === 'green' ? 'bg-emerald-500' : p1Color === 'blue' ? 'bg-cyan-500' : 'bg-amber-400'
              }`} />
              <span className="text-white/70">{p1Color}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/50">{gameData?.player1Wins || 0}W</span>
            </div>
          </div>
        </div>

        {/* Round Badge */}
        <div className="flex flex-col items-center px-2 py-0.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
          <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
            Round {gameData?.round || 1}
          </span>
          <span className="text-[10px] font-mono text-white/60 font-bold">
            {gameData?.player1Wins || 0} : {gameData?.player2Wins || 0}
          </span>
        </div>

        {/* Player 2 Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-right min-w-0">
            <div className="flex items-center justify-end gap-1">
              {isPlayer2 && <span className="text-[10px] text-white/50 font-bold">(You)</span>}
              <span className="text-xs font-black font-display text-white truncate max-w-[85px]">
                {p2?.displayName || 'Player 2'}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] font-mono font-bold capitalize">
              <span className="text-white/50">{gameData?.player2Wins || 0}W</span>
              <span className="text-white/30">•</span>
              <span className="text-white/70">{p2Color}</span>
              <span className={`w-2 h-2 rounded-full ${
                p2Color === 'red' ? 'bg-rose-500' : p2Color === 'green' ? 'bg-emerald-500' : p2Color === 'blue' ? 'bg-cyan-500' : 'bg-amber-400'
              }`} />
            </div>
          </div>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p2Avatar.color} flex items-center justify-center text-sm shadow-md ring-1 ring-white/20`}>
            <span>{p2Avatar.emoji}</span>
          </div>

          {!isFinished && (
            <button
              id="ludo-leave-game-btn"
              type="button"
              onClick={() => {
                playClick();
                setShowLeaveModal(true);
              }}
              className="ml-1 p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
              title="Leave match"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reconnection Alert Bar if opponent temporarily disconnects */}
      {reconnectCountdown !== null && (
        <div className="mb-3 w-full bg-amber-500/15 border border-amber-500/30 rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-amber-200 animate-pulse">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Opponent connection lost. Awarding victory in{' '}
            <strong className="font-mono text-white text-sm">{reconnectCountdown}s</strong>
          </span>
        </div>
      )}

      {/* Mandatory Capture Banner Alert */}
      {isMyTurn && isMandatoryCapture && !isFinished && (
        <div className="mb-3 w-full bg-rose-500/20 border border-rose-500/40 rounded-2xl px-4 py-2 flex items-center justify-between gap-2 text-xs text-rose-200 animate-pulse shadow-lg shadow-rose-500/20">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span className="font-bold text-[11px] sm:text-xs">
              Capture available — you must capture the opponent's token.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] sm:text-[10px] uppercase font-black tracking-wider">
            Mandatory
          </span>
        </div>
      )}

      {/* Main Single Integrated Ludo Board Canvas (with Dice inside Home Bases) */}
      <LudoBoard
        tokens={safeTokens}
        activeColors={activeColors}
        player1={p1}
        player2={p2}
        myId={myId}
        myColor={myColor}
        currentTurn={currentTurnId}
        currentTurnColor={currentTurnColor}
        turnPhase={turnPhase}
        diceValue={diceValue}
        animatingDiceValue={animatingDiceValue}
        isRolling={rollingDice}
        pendingDice={pendingDice}
        selectedDiceIndex={selectedDiceIndex}
        validTokenIds={validTokenIds}
        isMandatoryCapture={isMandatoryCapture}
        capturingTokenIds={capturingTokenIds}
        movingTokenId={movingTokenId}
        selectedScoreTokenId={scorePickerToken?.tokenId ?? null}
        tokenScoreOptions={scorePickerToken?.options ?? []}
        onRoll={handleRollDice}
        onSelectPendingDice={handleSelectPendingDice}
        onTokenClick={handleTokenClick}
        onSelectTokenScore={handleSelectTokenScore}
      />

      {/* Turn Action Status & Rematch Bar */}
      <div
        id="ludo-turn-controls"
        className="w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl p-3.5 sm:p-4 border border-white/10 shadow-2xl mt-3 flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        {isFinished ? (
          <LudoResult
            winnerId={winnerId}
            winnerColor={gameData?.winnerColor}
            myId={myId}
            winnerName={winnerName}
            countdown={countdown}
            finishReason={finishReason}
            onReset={handleReset}
          />
        ) : (
          <LudoGameStatus
            isMyTurn={isMyTurn}
            turnPhase={turnPhase}
            diceValue={diceValue}
            pendingDice={pendingDice}
            isMandatoryCapture={isMandatoryCapture}
            myColor={myColor}
            opponentName={opponent?.displayName}
          />
        )}
      </div>

      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-white font-display">
                Leave Ludo Match?
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                If you leave this match, your opponent will immediately be declared the winner.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-ludo-leave-btn"
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-ludo-leave-btn"
                type="button"
                onClick={handleConfirmLeave}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
