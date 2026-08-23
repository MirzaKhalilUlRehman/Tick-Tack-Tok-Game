/**
 * 2-Player Multiplayer Ludo Game Component for KM
 * Features:
 * - Red (Player 1) vs Yellow (Player 2)
 * - 15x15 classic Ludo board with track, safe cells, home lanes, and center goal
 * - Interactive 3D animated dice
 * - Synchronized token moves, captures, bonus turns, and win detection
 * - State machine handling (waitingForRoll, waitingForMove, no_moves, game_over)
 * - PC & Mobile responsive design
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  GOAL_STEP,
  rollLudoDice,
  moveLudoToken,
  passLudoTurn,
  resetLudoGame,
} from '../../services/ludoService';
import { useSound } from '../../hooks/useSound';
import LudoBoard from '../LudoBoard';
import LudoDice from '../LudoDice';
import LudoPlayerInfo from '../LudoPlayerInfo';
import LudoGameStatus from '../LudoGameStatus';
import LudoResult from '../LudoResult';

export default function LudoGame({ pairId, gameData, pairData, playerProfile }) {
  const [rollingDice, setRollingDice] = useState(false);
  const [movingTokenId, setMovingTokenId] = useState(null);
  const [animatingDiceValue, setAnimatingDiceValue] = useState(null);

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

  const p1 = pairData?.players?.player1 || gameData?.players?.player1;
  const p2 = pairData?.players?.player2 || gameData?.players?.player2;
  const myId = playerProfile?.playerId;

  const isPlayer1 = p1?.playerId === myId;
  const isPlayer2 = p2?.playerId === myId;
  const myColor = isPlayer1 ? 'red' : isPlayer2 ? 'yellow' : null;

  const currentTurnId = gameData?.currentTurn;
  const isMyTurn = currentTurnId === myId;
  const turnPhase = gameData?.turnPhase || 'waitingForRoll';
  const diceValue = gameData?.diceValue;
  const winnerId = gameData?.winner;
  const isFinished = gameData?.status === 'finished' || Boolean(winnerId);

  const redTokens = gameData?.tokens?.red || [
    { id: 0, step: -1 },
    { id: 1, step: -1 },
    { id: 2, step: -1 },
    { id: 3, step: -1 },
  ];
  const yellowTokens = gameData?.tokens?.yellow || [
    { id: 0, step: -1 },
    { id: 1, step: -1 },
    { id: 2, step: -1 },
    { id: 3, step: -1 },
  ];

  const validTokenIds =
    isMyTurn && (turnPhase === 'waitingForMove' || turnPhase === 'move')
      ? gameData?.validTokenIds || []
      : [];

  const [countdown, setCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);
  const hasTriggeredResetRef = useRef(false);

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
    if (isFinished && nextGameAt) {
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
  }, [isFinished, gameData?.nextGameAt, pairId, p1?.playerId, p2?.playerId, myId, gameData?.round]);

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
    if (turnPhase === 'no_moves' && isMyTurn) {
      const timer = setTimeout(async () => {
        try {
          await passLudoTurn(pairId, gameData);
        } catch (e) {
          console.error('Auto pass turn error:', e);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, isMyTurn, pairId, gameData]);

  // Dice roll handler
  const handleRollDice = async () => {
    const canRoll = isMyTurn && (turnPhase === 'waitingForRoll' || turnPhase === 'roll') && !rollingDice && !isFinished;
    if (!canRoll) return;

    try {
      setRollingDice(true);
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

  // Token click handler
  const handleTokenClick = async (tokenId, color) => {
    const isMovePhase = turnPhase === 'waitingForMove' || turnPhase === 'move';
    if (!isMyTurn || !isMovePhase || isFinished) return;
    if (color !== myColor) return;
    if (!validTokenIds.includes(tokenId)) return;

    try {
      setMovingTokenId(tokenId);
      playPop();
      await moveLudoToken(pairId, gameData, tokenId, myId);
    } catch (err) {
      console.error('Move token error:', err);
    } finally {
      setMovingTokenId(null);
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

  const opponent = isPlayer1 ? p2 : p1;
  const winnerName = winnerId === p1?.playerId ? p1?.displayName : p2?.displayName;

  return (
    <div id="ludo-game-arena" className="w-full flex flex-col items-center select-none">
      {/* Top Match Header / Round Bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 mb-4 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
            Ludo 2-Player Match
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-white/70">
            Round {gameData?.round || 1}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Red: {gameData?.player1Wins || 0}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span>Yellow: {gameData?.player2Wins || 0}</span>
          </div>
        </div>
      </div>

      {/* Players Header Cards */}
      <div className="w-full max-w-xl grid grid-cols-2 gap-3 mb-4">
        <LudoPlayerInfo
          player={p1}
          color="red"
          isCurrentTurn={currentTurnId === p1?.playerId}
          isMe={isPlayer1}
          tokens={redTokens}
          isFinished={isFinished}
        />
        <LudoPlayerInfo
          player={p2}
          color="yellow"
          isCurrentTurn={currentTurnId === p2?.playerId}
          isMe={isPlayer2}
          tokens={yellowTokens}
          isFinished={isFinished}
        />
      </div>

      {/* Main Ludo Board Canvas */}
      <LudoBoard
        redTokens={redTokens}
        yellowTokens={yellowTokens}
        validTokenIds={validTokenIds}
        myColor={myColor}
        isMyTurn={isMyTurn}
        turnPhase={turnPhase}
        movingTokenId={movingTokenId}
        onTokenClick={handleTokenClick}
      />

      {/* Interactive Turn Action & Dice Panel */}
      <div
        id="ludo-turn-controls"
        className="w-full max-w-xl bg-white/[0.04] backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white/10 shadow-2xl mt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {isFinished ? (
          <LudoResult
            winnerId={winnerId}
            winnerColor={gameData?.winnerColor}
            myId={myId}
            winnerName={winnerName}
            countdown={countdown}
            onReset={handleReset}
          />
        ) : (
          <>
            <LudoGameStatus
              isMyTurn={isMyTurn}
              turnPhase={turnPhase}
              diceValue={diceValue}
              myColor={myColor}
              opponentName={opponent?.displayName}
            />

            <LudoDice
              diceValue={diceValue}
              animatingValue={animatingDiceValue}
              isRolling={rollingDice}
              isMyTurn={isMyTurn}
              turnPhase={turnPhase}
              myColor={myColor}
              disabled={isFinished}
              onRoll={handleRollDice}
            />
          </>
        )}
      </div>
    </div>
  );
}
