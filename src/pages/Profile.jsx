import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Save, Trophy, Flame, User, RefreshCw, Trash2, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import Header from '../components/common/Header';
import AvatarPicker from '../components/common/AvatarPicker';
import Toast from '../components/common/Toast';
import { getAvatarById } from '../data/avatars';
import { getStoredStats, updateStoredStats } from '../utils/storage';
import { useSound } from '../hooks/useSound';

export default function Profile({ profile, onUpdateProfile, onLogout }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarId, setAvatarId] = useState(profile?.avatar || 'av1');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const { playClick, playPop } = useSound();

  const currentAvatar = getAvatarById(avatarId);
  const stats = getStoredStats();

  const handleCopyId = () => {
    if (profile?.playerId) {
      playClick();
      navigator.clipboard.writeText(profile.playerId);
      setCopiedId(true);
      setToastMsg('Player ID copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) return;

    try {
      setSaving(true);
      playPop();
      await onUpdateProfile({
        displayName: cleanName,
        avatar: avatarId,
      });
      setToastMsg('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset your career stats to zero?')) {
      playClick();
      updateStoredStats({
        tttWins: 0,
        tttLosses: 0,
        tttDraws: 0,
      });
      setToastMsg('Career statistics reset.');
    }
  };

  const totalMatches = (stats.tttWins || 0) + (stats.tttLosses || 0) + (stats.tttDraws || 0);
  const winRate = totalMatches > 0 ? Math.round(((stats.tttWins || 0) / totalMatches) * 100) : 0;

  return (
    <div id="profile-page" className="min-h-screen atmospheric-bg flex flex-col">
      <Header profile={profile} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentAvatar.color} flex items-center justify-center text-3xl shadow-xl ring-2 ${currentAvatar.ring}`}
              >
                <span>{currentAvatar.emoji}</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white">
                  Player Profile
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    {profile?.playerId}
                  </span>
                  <button
                    id="profile-copy-id-btn"
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="back-to-home-btn"
              type="button"
              onClick={() => {
                playClick();
                navigate('/home');
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label
                htmlFor="edit-display-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2"
              >
                Display Name
              </label>
              <input
                id="edit-display-name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
              />
            </div>

            <AvatarPicker
              selectedId={avatarId}
              onSelect={(id) => {
                playClick();
                setAvatarId(id);
              }}
            />

            <button
              id="save-profile-btn"
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Career Stats Breakdown */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm font-display text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Career Statistics
            </h3>
            <button
              id="reset-stats-btn"
              type="button"
              onClick={handleResetStats}
              className="text-[11px] text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Stats</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Tic Tac Toe Wins</span>
              <p className="text-xl font-black font-mono text-indigo-400 text-glow-indigo mt-0.5">{stats.tttWins || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">TTT Losses</span>
              <p className="text-xl font-black font-mono text-rose-400 mt-0.5">{stats.tttLosses || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">TTT Draws</span>
              <p className="text-xl font-black font-mono text-amber-400 mt-0.5">{stats.tttDraws || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Total Matches</span>
              <p className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {totalMatches}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 col-span-2 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Win Rate</span>
              <p className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                {winRate}%
              </p>
            </div>
          </div>
        </div>
      </main>

      <Toast
        message={toastMsg}
        type="success"
        onClose={() => setToastMsg('')}
      />
    </div>
  );
}
