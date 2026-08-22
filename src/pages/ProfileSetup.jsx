import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ArrowRight, Sparkles, Shield, User } from 'lucide-react';
import AvatarPicker from '../components/common/AvatarPicker';
import { getAvatarById } from '../data/avatars';
import { useSound } from '../hooks/useSound';

export default function ProfileSetup({ onCreateProfile }) {
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('av1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { playClick, playPop } = useSound();

  const selectedAvatar = getAvatarById(avatarId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Please enter a display name to continue.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Display name cannot exceed 20 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      playPop();
      await onCreateProfile({
        displayName: trimmed,
        avatar: avatarId,
      });
      navigate('/home');
    } catch (err) {
      setError('Failed to setup profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="profile-setup-page"
      className="min-h-screen atmospheric-bg flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative z-10">
        {/* App Title & Intro */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Instant Online Multiplayer
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            Create Your Player Profile
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1.5 max-w-sm mx-auto">
            Choose your gamer tag and avatar. No password or email needed — your permanent Player ID will be generated automatically.
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-2xl shadow-lg ring-2 ring-indigo-500/50`}
          >
            <span>{selectedAvatar.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Preview Card</p>
            <p className="text-base font-bold text-white truncate">
              {displayName.trim() || 'Your Gamer Tag'}
            </p>
            <span className="text-[11px] font-mono text-indigo-400 font-medium">
              PLY-XXXXXXXX (Auto-generated)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name Input */}
          <div>
            <label
              htmlFor="display-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2"
            >
              Player Name
            </label>
            <div className="relative">
              <input
                id="display-name-input"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. ShadowBlade, PixelHero, Maverick"
                maxLength={20}
                autoFocus
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              />
              <span className="absolute right-3 top-3.5 text-[11px] text-white/40 font-mono">
                {displayName.length}/20
              </span>
            </div>
            {error && <p className="text-xs text-rose-400 font-medium mt-1.5">{error}</p>}
          </div>

          {/* Avatar Selector */}
          <AvatarPicker
            selectedId={avatarId}
            onSelect={(id) => {
              playClick();
              setAvatarId(id);
            }}
          />

          {/* Submit Button */}
          <button
            id="continue-profile-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold font-display tracking-wide text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Initializing Profile...' : 'Enter Game Arena'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
