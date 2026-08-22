/**
 * Custom Hook for real-time 2-Player Private Pairing, Tic Tac Toe Game Session, and Chat
 */
import { useState, useEffect, useRef } from 'react';
import {
  subscribePrivatePair,
  subscribeGameSession,
  leavePrivatePair,
} from '../services/roomService';
import { subscribeConversation, getConvId } from '../services/chatService';
import { sound } from '../utils/soundEffects';

export function useRoom(pairId, playerProfile) {
  const [pairData, setPairData] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [conversationData, setConversationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevP2Ref = useRef(null);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const cleanId = pairId.trim().toUpperCase();

    // 1. Subscribe to Pair Metadata (Players & Status)
    const unsubPair = subscribePrivatePair(cleanId, (data) => {
      setLoading(false);
      if (!data) {
        setError('Private match not found or has expired.');
        setPairData(null);
        return;
      }

      // Detect opponent join
      if (!prevP2Ref.current && data.players?.player2?.playerId) {
        sound.playPlayerJoin();
      }
      prevP2Ref.current = data.players?.player2?.playerId;

      setPairData(data);
      setError(null);
    });

    // 2. Subscribe to Game State (Tic Tac Toe board, turns, rounds)
    const unsubGame = subscribeGameSession(cleanId, (game) => {
      setGameData(game);
    });

    return () => {
      unsubPair();
      unsubGame();
    };
  }, [pairId, playerProfile?.playerId]);

  // 3. Subscribe to Conversation
  useEffect(() => {
    if (!pairId) return;

    const p1 = pairData?.players?.player1?.playerId;
    const p2 = pairData?.players?.player2?.playerId;
    const convId = (p1 && p2) ? getConvId(p1, p2) : pairId.trim().toUpperCase();

    const unsubConv = subscribeConversation(convId, (conv) => {
      setConversationData(conv);
    });

    return () => unsubConv();
  }, [pairId, pairData?.players?.player1?.playerId, pairData?.players?.player2?.playerId]);

  const handleLeave = async () => {
    if (pairId && playerProfile?.playerId) {
      await leavePrivatePair(pairId, playerProfile.playerId);
    }
  };

  const isHost = pairData?.hostId === playerProfile?.playerId;
  const isPlayer1 = pairData?.players?.player1?.playerId === playerProfile?.playerId;
  const isPlayer2 = pairData?.players?.player2?.playerId === playerProfile?.playerId;
  const opponent = isPlayer1 ? pairData?.players?.player2 : pairData?.players?.player1;
  const isOpponentConnected = Boolean(opponent && opponent.connected !== false);

  const activeConvId = (pairData?.players?.player1?.playerId && pairData?.players?.player2?.playerId)
    ? getConvId(pairData.players.player1.playerId, pairData.players.player2.playerId)
    : pairId?.trim().toUpperCase();

  return {
    pairData,
    gameData,
    conversationData,
    convId: activeConvId,
    loading,
    error,
    isHost,
    isPlayer1,
    isPlayer2,
    opponent,
    isOpponentConnected,
    leaveRoom: handleLeave,
  };
}
