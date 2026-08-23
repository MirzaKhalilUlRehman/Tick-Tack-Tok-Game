/**
 * Dedicated Ludo Match Lobby Page
 * Pure, high-speed Create and Join actions for Ludo 2-player battles.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices, PlusCircle, LogIn, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { createPrivatePair } from '../services/roomService';
import { useSound } from '../hooks/useSound';

export default function LudoLobby({ profile }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const { playClick, playPop } = useSound();

  const handleCreateLudoMatch = async () => {
    if (creating || !profile) return;
    try {
      playPop();
      setCreating(true);
      const { pairId } = await createPrivatePair(profile, 'ludo');
      navigate(`/room/${pairId}`);
    } catch (err) {
      console.error('Create ludo match error:', err);
      setToastMessage('Failed to create Ludo match. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Please enter a 6-character match code.');
      return;
    }
    if (cleanCode.length < 4) {
      setJoinError('Match codes are 6 characters long.');
      return;
    }
    playPop();
    setJoinModalOpen(false);
    navigate(`/room/${cleanCode}`);
  };

  return (
    <div id="ludo-lobby-page" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} />

        <main className="max-w-xl w-full mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => {
              playClick();
              navigate('/home');
            }}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Ludo Icon */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl mb-6">
              <Dices className="w-10 h-10" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide uppercase">
                Ludo Arena
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-black uppercase text-amber-300 tracking-wider">
                2 Players
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/60 mb-8 max-w-sm">
              Real-time 2-player battle. Red (Player 1) vs Yellow (Player 2). Roll 6 to enter, capture enemy tokens, and race all 4 tokens to the center goal!
            </p>

            {/* Action Buttons */}
            <div className="w-full max-w-xs space-y-3.5">
              <button
                id="ludo-lobby-create-btn"
                type="button"
                disabled={creating}
                onClick={handleCreateLudoMatch}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black font-display text-sm tracking-wide shadow-xl shadow-rose-600/30 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? (
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
                id="ludo-lobby-join-btn"
                type="button"
                disabled={creating}
                onClick={() => {
                  playClick();
                  setRoomCodeInput('');
                  setJoinError('');
                  setJoinModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-display text-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Join Match</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Join Match Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Join Ludo Match"
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <p className="text-xs text-white/60">
            Enter the 6-character match code shared by Player 1.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
              Match Code
            </label>
            <input
              id="ludo-join-input"
              type="text"
              value={roomCodeInput}
              onChange={(e) => {
                setRoomCodeInput(e.target.value.toUpperCase());
                if (joinError) setJoinError('');
              }}
              placeholder="e.g. AB7K92"
              maxLength={8}
              autoFocus
              className="w-full bg-black/60 border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest text-amber-300 placeholder-white/30 outline-none uppercase transition-all"
            />
            {joinError && <p className="text-xs text-rose-400 font-medium mt-1.5">{joinError}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
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
