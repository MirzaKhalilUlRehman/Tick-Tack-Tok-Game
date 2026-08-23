/**
 * Main 2-Player Private Arena Page for KM
 * Connects the 2 paired players with synchronized Tic Tac Toe and clean text/emoji chat.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  AlertTriangle,
  WifiOff,
  Loader2,
  X,
} from 'lucide-react';
import Header from '../components/common/Header';
import WaitingRoom from '../components/room/WaitingRoom';
import TicTacToeGame from '../components/games/TicTacToeGame';
import LudoGame from '../components/games/LudoGame';
import ChatPanel from '../components/chat/ChatPanel';
import Toast from '../components/common/Toast';
import { useRoom } from '../hooks/useRoom';
import { joinPrivatePair } from '../services/roomService';
import { useSound } from '../hooks/useSound';

export default function RoomPage({ profile }) {
  const { roomId } = useParams();
  const cleanPairId = (roomId || '').trim().toUpperCase();
  const navigate = useNavigate();
  const {
    pairData,
    gameData,
    conversationData,
    convId,
    loading,
    error,
    opponent,
    isOpponentConnected,
    leaveRoom,
  } = useRoom(cleanPairId, profile);

  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [joinAttempted, setJoinAttempted] = useState(false);
  const { playClick, playPop } = useSound();

  // If user entered directly via URL link, auto-join as Player 2 if available
  useEffect(() => {
    async function attemptAutoJoin() {
      if (!pairData || !profile || joinAttempted) return;

      const p1 = pairData.players?.player1;
      const p2 = pairData.players?.player2;
      const isAlreadyIn = p1?.playerId === profile.playerId || p2?.playerId === profile.playerId;

      if (!isAlreadyIn && !p2 && pairData.status === 'waiting') {
        try {
          setJoinAttempted(true);
          await joinPrivatePair(cleanPairId, profile);
          setToastMsg('Connected as Player 2!');
        } catch (e) {
          console.error('Auto-join failed:', e);
        }
      }
    }
    attemptAutoJoin();
  }, [pairData, profile, cleanPairId, joinAttempted]);

  const handleLeave = async () => {
    playPop();
    await leaveRoom();
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex flex-col">
        <Header profile={profile} roomId={cleanPairId} onLeaveMatch={handleLeave} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
          <h2 className="text-lg font-bold text-white font-display">Connecting to Match...</h2>
          <p className="text-xs text-white/40 mt-1">Establishing real-time link</p>
        </div>
      </div>
    );
  }

  if (error || !pairData) {
    return (
      <div className="min-h-screen atmospheric-bg flex flex-col">
        <Header profile={profile} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Match Unavailable</h2>
          <p className="text-xs sm:text-sm text-white/50 mt-2">
            {error || 'This private room is either closed or already has 2 approved players.'}
          </p>
          <button
            id="return-home-from-error-btn"
            type="button"
            onClick={() => navigate('/home')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isBothPaired = Boolean(pairData.players?.player1 && pairData.players?.player2);
  const unreadMessagesCount = Object.keys(conversationData?.messages || {}).length;

  return (
    <div id="room-page-layout" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} roomId={cleanPairId} onLeaveMatch={handleLeave} />

        {/* Opponent Disconnect Alert Bar */}
        {isBothPaired && opponent && !isOpponentConnected && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2 backdrop-blur-md">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Opponent connection lost. Waiting to reconnect...</span>
          </div>
        )}

        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {!isBothPaired ? (
            /* Waiting for Player 2 phase */
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <WaitingRoom
                  pairData={pairData}
                  playerProfile={profile}
                  onLeaveRoom={handleLeave}
                  onCopyInvite={(msg) => setToastMsg(msg)}
                />
              </div>
              <div className="lg:col-span-1">
                <ChatPanel
                  convId={convId || cleanPairId}
                  conversationData={conversationData}
                  playerProfile={profile}
                  otherPlayer={opponent}
                />
              </div>
            </div>
          ) : (
            /* Active 2-Player Match Phase */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Game Arena (7 cols on desktop) */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center w-full">
                {(gameData?.gameType === 'ludo' || pairData?.gameType === 'ludo') ? (
                  <LudoGame
                    pairId={cleanPairId}
                    gameData={gameData}
                    pairData={pairData}
                    playerProfile={profile}
                  />
                ) : (
                  <TicTacToeGame
                    pairId={cleanPairId}
                    gameData={gameData}
                    pairData={pairData}
                    playerProfile={profile}
                  />
                )}
              </div>

              {/* Text/Emoji Chat Sidebar (5 cols on desktop) */}
              <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-24">
                <ChatPanel
                  convId={convId || cleanPairId}
                  conversationData={conversationData}
                  playerProfile={profile}
                  otherPlayer={opponent}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Floating Chat Trigger */}
      {isBothPaired && (
        <div className="lg:hidden fixed bottom-6 right-5 z-40">
          <button
            id="mobile-chat-toggle-btn"
            type="button"
            onClick={() => {
              playClick();
              setMobileChatOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 border border-indigo-400/40 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
            {unreadMessagesCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-400 text-[10px] flex items-center justify-center font-bold">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Mobile Chat Slide-Up Drawer */}
      {mobileChatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md">
          <div className="w-full h-[85vh] bg-slate-900 rounded-t-3xl border-t border-white/15 p-2 flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
              <span className="text-xs font-bold text-white">Match Chat</span>
              <button
                type="button"
                onClick={() => setMobileChatOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-1">
              <ChatPanel
                convId={convId || cleanPairId}
                conversationData={conversationData}
                playerProfile={profile}
                otherPlayer={opponent}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      <Toast
        message={toastMsg}
        type="info"
        onClose={() => setToastMsg('')}
      />
    </div>
  );
}
