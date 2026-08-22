/**
 * Join Match Page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, Clipboard, Loader2, ShieldCheck } from 'lucide-react';
import Header from '../components/common/Header';
import { joinPrivatePair } from '../services/roomService';
import { useSound } from '../hooks/useSound';

export default function JoinRoom({ profile }) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { playClick, playPop } = useSound();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        playClick();
        const match = text.match(/room\/([A-Za-z0-9]+)/);
        const code = match ? match[1] : text.trim();
        setRoomIdInput(code.toUpperCase());
        setError('');
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanCode = roomIdInput.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a pairing code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      playPop();
      await joinPrivatePair(cleanCode, profile);
      navigate(`/room/${cleanCode}`);
    } catch (err) {
      console.error('Join error:', err);
      setError(err.message || 'Failed to join match. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="join-room-page" className="min-h-screen atmospheric-bg flex flex-col">
      <Header profile={profile} />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Private Match Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Join a Match
            </h1>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              Enter the 6-character code provided by your opponent.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label
                htmlFor="join-input-code"
                className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2"
              >
                Pairing Code
              </label>
              <div className="relative">
                <input
                  id="join-input-code"
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="e.g. AB7K92"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-black/60 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3.5 text-center text-xl font-mono font-black tracking-widest text-indigo-300 placeholder-white/30 outline-none uppercase transition-all"
                />
                <button
                  id="paste-room-code-btn"
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
              {error && <p className="text-xs text-rose-400 font-medium mt-2 text-center">{error}</p>}
            </div>

            <button
              id="submit-join-room-btn"
              type="submit"
              disabled={loading || !roomIdInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold font-display text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to Match...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Connect & Play</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
