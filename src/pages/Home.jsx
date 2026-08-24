/**
 * KM Home Lobby
 * Ultra-clean, focused Tic Tac Toe game hub with direct Create/Join actions,
 * player discovery, and Inbox messaging.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid3X3,
  Dices,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import TicTacToeLogo from '../components/common/TicTacToeLogo';
import LudoLogo from '../components/common/LudoLogo';
import { getAvatarById } from '../data/avatars';
import { createPrivatePair } from '../services/roomService';
import { useInbox } from '../hooks/useInbox';
import { useSound } from '../hooks/useSound';

export default function Home({ profile }) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [creatingGameType, setCreatingGameType] = useState(null); // 'tictactoe' | 'ludo' | null
  const [toastMessage, setToastMessage] = useState('');
  const { totalUnreadCount } = useInbox(profile);
  const { playClick, playPop } = useSound();

  const avatar = getAvatarById(profile?.avatar || 'fox');

  const handleCopyPlayerId = () => {
    if (profile?.playerId) {
      playClick();
      navigator.clipboard.writeText(profile.playerId);
      setCopiedId(true);
      setToastMessage('Player ID copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCreateGame = async (gameType) => {
    if (creatingGameType || !profile) return;
    try {
      playPop();
      setCreatingGameType(gameType);
      const { pairId } = await createPrivatePair(profile, gameType);
      navigate(`/room/${pairId}`);
    } catch (err) {
      console.error('Create match error:', err);
      setToastMessage('Failed to create match. Please try again.');
    } finally {
      setCreatingGameType(null);
    }
  };

  const handleOpenJoinModal = () => {
    playClick();
    setRoomCodeInput('');
    setJoinError('');
    setJoinModalOpen(true);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Please enter a room code.');
      return;
    }
    if (cleanCode.length < 4) {
      setJoinError('Room codes are 6 characters long.');
      return;
    }
    playPop();
    setJoinModalOpen(false);
    navigate(`/room/${cleanCode}`);
  };

  return (
    <div id="home-dashboard" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} />

        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Player Identity Card */}
          <div
            id="player-identity-bar"
            className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-2xl sm:text-3xl shadow-lg ring-2 ${avatar.ring}`}
              >
                <span>{avatar.emoji}</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black font-display text-white">
                  {profile?.displayName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/50 font-mono">ID: {profile?.playerId}</span>
                  <button
                    id="hero-copy-id-btn"
                    type="button"
                    onClick={handleCopyPlayerId}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Copy Player ID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Navigation Pills */}
            <div className="flex items-center gap-2">
              <button
                id="hero-search-btn"
                type="button"
                onClick={() => {
                  playClick();
                  navigate('/search');
                }}
                className="p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Search Players"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Find Players</span>
              </button>

              <button
                id="hero-inbox-btn"
                type="button"
                onClick={() => {
                  playClick();
                  navigate('/inbox');
                }}
                className="relative p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Open Inbox"
              >
                <MessageSquare className="w-4 h-4 text-indigo-300" />
                <span className="hidden sm:inline">Inbox</span>
                {totalUnreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* TWO MULTIPLAYER GAMES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* GAME 1: TIC TAC TOE */}
            <div
              id="game-section-tictactoe"
              className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300"
            >
              <div className="w-full flex flex-col items-center">
                <TicTacToeLogo className="mb-4" />

                <h2 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 tracking-wide uppercase">
                  Tic Tac Toe
                </h2>
                <p className="text-xs text-white/50 mb-6 max-w-xs font-medium">
                  Classic 3x3 strategic grid. Quick rounds, instant score tracker, and automatic next game.
                </p>
              </div>

              {/* Actions */}
              <div className="w-full max-w-sm space-y-3 relative z-10">
                <button
                  id="create-tictactoe-match-btn"
                  type="button"
                  disabled={Boolean(creatingGameType)}
                  onClick={() => handleCreateGame('tictactoe')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display text-sm shadow-xl shadow-indigo-600/30 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingGameType === 'tictactoe' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Match...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Match</span>
                    </>
                  )}
                </button>

                <button
                  id="join-tictactoe-match-btn"
                  type="button"
                  disabled={Boolean(creatingGameType)}
                  onClick={handleOpenJoinModal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-display text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  <span>Join Match</span>
                </button>
              </div>
            </div>

            {/* GAME 2: LUDO */}
            <div
              id="game-section-ludo"
              className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300"
            >
              <div className="w-full flex flex-col items-center">
                <LudoLogo className="mb-4" />

                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide uppercase">
                    Ludo
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    2 Players
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-6 max-w-xs font-medium">
                  Red vs Yellow board battle. 4 tokens each, roll 6 to exit, capture opponents, and race to center!
                </p>
              </div>

              {/* Actions */}
              <div className="w-full max-w-sm space-y-3 relative z-10">
                <button
                  id="create-ludo-match-btn"
                  type="button"
                  disabled={Boolean(creatingGameType)}
                  onClick={() => handleCreateGame('ludo')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold font-display text-sm shadow-xl shadow-rose-600/30 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingGameType === 'ludo' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Match...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Match</span>
                    </>
                  )}
                </button>

                <button
                  id="join-ludo-match-btn"
                  type="button"
                  disabled={Boolean(creatingGameType)}
                  onClick={handleOpenJoinModal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-display text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Join Match</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Join Match Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Join Match"
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <p className="text-xs text-white/60">
            Enter the 6-character room code shared by your friend to join.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
              Room Code
            </label>
            <input
              id="join-room-code-input"
              type="text"
              value={roomCodeInput}
              onChange={(e) => {
                setRoomCodeInput(e.target.value.toUpperCase());
                if (joinError) setJoinError('');
              }}
              placeholder="e.g. AB7K92"
              maxLength={8}
              autoFocus
              className="w-full bg-black/60 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest text-indigo-300 placeholder-white/30 outline-none uppercase transition-all"
            />
            {joinError && <p className="text-xs text-rose-400 font-medium mt-1.5">{joinError}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="cancel-join-modal-btn"
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-join-room-btn"
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        type="info"
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
