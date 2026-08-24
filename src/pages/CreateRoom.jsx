/**
 * Create Private Match Page for KM (Tic Tac Toe only)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import Header from '../components/common/Header';
import TicTacToeLogo from '../components/common/TicTacToeLogo';
import { createPrivatePair } from '../services/roomService';
import { useSound } from '../hooks/useSound';

export default function CreateRoom({ profile }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { playPop } = useSound();

  const handleCreate = async () => {
    if (creating || !profile) return;
    try {
      setCreating(true);
      setError('');
      playPop();
      const { pairId } = await createPrivatePair(profile);
      navigate(`/room/${pairId}`);
    } catch (err) {
      console.error('Create pair error:', err);
      setError('Failed to create match. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div id="create-room-page" className="min-h-screen atmospheric-bg flex flex-col">
      <Header profile={profile} />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              KM Match
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Tic Tac Toe Match
            </h1>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              Generate a private 6-character room code to invite a friend.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center gap-3 mb-6">
            <TicTacToeLogo className="w-16 h-16" />
            <div>
              <h2 className="text-base font-bold text-white font-display">2-Player Real-Time</h2>
              <p className="text-xs text-white/50">Includes real-time chat with emoji reactions</p>
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 font-medium text-center mb-4">{error}</p>}

          <button
            id="launch-room-btn"
            type="button"
            disabled={creating}
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold font-display text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Match...</span>
              </>
            ) : (
              <>
                <span>Create Match & Get Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
