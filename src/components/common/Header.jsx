import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowLeft,
  Gamepad2,
  MessageSquare,
  Search,
  LogOut,
  Download,
} from 'lucide-react';
import { getAvatarById } from '../../data/avatars';
import { useSound } from '../../hooks/useSound';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useInbox } from '../../hooks/useInbox';

export default function Header({ profile, onUpdateProfile, roomId = null, onLeaveMatch = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { soundEnabled, toggleSound, playClick, playPop } = useSound();
  const { canInstall, isStandalone, isInstalled, installApp } = usePWAInstall();
  const { totalUnreadCount } = useInbox(profile);
  const [copied, setCopied] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  const avatar = getAvatarById(profile?.avatar);

  const handleCopyId = () => {
    if (profile?.playerId) {
      playClick();
      navigator.clipboard.writeText(profile.playerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      playClick();
      navigator.clipboard.writeText(roomId);
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    playPop();
    await installApp();
  };

  const isHome = location.pathname === '/' || location.pathname === '/home';
  const isRoom = location.pathname.startsWith('/room/');

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full h-16 sm:h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 backdrop-blur-md bg-black/40">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        {/* Left: Brand Logo / Player Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!isHome && !isRoom && (
            <button
              id="header-back-btn"
              type="button"
              onClick={() => {
                playClick();
                navigate('/home');
              }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          <Link
            id="brand-logo"
            to="/home"
            onClick={playClick}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-display font-black text-xl sm:text-2xl tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                KM
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Navigation Shortcuts */}
        {!roomId && (
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              id="nav-search-btn"
              to="/search"
              onClick={playClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/search'
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Players</span>
            </Link>

            <Link
              id="nav-inbox-btn"
              to="/inbox"
              onClick={playClick}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname.startsWith('/inbox')
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Inbox</span>
              {totalUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-black ml-0.5">
                  {totalUnreadCount}
                </span>
              )}
            </Link>
          </nav>
        )}

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Room Code Chip */}
          {roomId && (
            <div className="bg-white/5 border border-white/10 px-3 sm:px-4 py-1.5 rounded-xl flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold hidden sm:inline">
                Room
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-indigo-300 tracking-wider">
                {roomId}
              </span>
              <button
                id="header-copy-room-id-btn"
                type="button"
                onClick={handleCopyRoomId}
                className="text-white/60 hover:text-indigo-300 transition-colors p-0.5 cursor-pointer"
                title="Copy Room ID"
              >
                {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Install App Quick Button if available and not installed */}
          {canInstall && !isStandalone && !isInstalled && (
            <button
              id="header-install-app-btn"
              type="button"
              onClick={handleInstallClick}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Install KM"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Install</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Game Sounds' : 'Unmute Game Sounds'}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          {/* Leave Match / Return Home Button in Room */}
          {roomId && onLeaveMatch && (
            <button
              id="header-leave-match-btn"
              type="button"
              onClick={onLeaveMatch}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}

          {/* Profile Pill */}
          {profile && (
            <Link
              id="header-player-pill"
              to="/profile"
              onClick={playClick}
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-sm sm:text-base shrink-0`}
              >
                <span>{avatar.emoji}</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors hidden md:inline truncate max-w-[90px]">
                {profile.displayName}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
