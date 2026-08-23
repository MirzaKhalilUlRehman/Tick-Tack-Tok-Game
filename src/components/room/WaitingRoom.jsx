/**
 * Private Match Waiting Room Component
 * Generates 6-character private pair codes, direct invite links, and QR codes for PC & Mobile.
 */
import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Loader2,
  LogOut,
  QrCode,
  Smartphone,
  Monitor,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { getAvatarById } from '../../data/avatars';
import { useSound } from '../../hooks/useSound';
import QRCodeModal from '../common/QRCodeModal';

export default function WaitingRoom({ pairData, playerProfile, onLeaveRoom, onCopyInvite }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { playClick, playPop } = useSound();

  const pairId = pairData?.pairId || '';
  const hostPlayer = pairData?.players?.player1;
  const hostAvatar = getAvatarById(hostPlayer?.avatar || 'fox');

  const isLudo = pairData?.gameType === 'ludo';
  const gameName = isLudo ? 'Ludo' : 'Tic Tac Toe';

  const handleCopyCode = () => {
    if (pairId) {
      playClick();
      navigator.clipboard.writeText(pairId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      if (onCopyInvite) onCopyInvite('Pairing code copied to clipboard!');
    }
  };

  const handleShareOrCopyLink = async () => {
    if (!pairId) return;
    playClick();
    const inviteUrl = `${window.location.origin}/room/${pairId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my private ${gameName} match!`,
          text: `Join my private ${gameName} match & chat on KM! Pairing Code: ${pairId}`,
          url: inviteUrl,
        });
        if (onCopyInvite) onCopyInvite('Invite sent!');
        return;
      } catch (e) {}
    }

    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    if (onCopyInvite) onCopyInvite('Invite link copied to clipboard!');
  };

  return (
    <div id="waiting-room-container" className="max-w-xl mx-auto w-full space-y-6">
      <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden text-center">
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>2-Player {gameName}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
            <Monitor className="w-3 h-3" />
            <span>PC</span>
            <span className="text-white/40">↔</span>
            <Smartphone className="w-3 h-3" />
            <span>Android</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
          Waiting for Opponent
        </h2>
        <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Share this pairing code, link, or QR code with your friend on PC or Android.
        </p>

        {/* Pairing Code Card */}
        <div className="my-6 p-5 sm:p-6 rounded-2xl bg-black/60 border-2 border-dashed border-indigo-500/40 relative group">
          <div className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-1">
            Private Pairing Code
          </div>
          <div
            id="waiting-room-code"
            className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-indigo-300 select-all"
          >
            {pairId}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-4">
            <button
              id="copy-room-code-btn"
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              id="copy-invite-link-btn"
              type="button"
              onClick={handleShareOrCopyLink}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>

            <button
              id="show-qr-code-btn"
              type="button"
              onClick={() => {
                playPop();
                setQrModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Show QR Code for Mobile Scanning"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Players Status Matrix */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 my-6">
          {/* Player 1 */}
          <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${
            isLudo ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/[0.04] border-indigo-500/30'
          }`}>
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${hostAvatar.color} flex items-center justify-center text-2xl shadow-lg ring-2 ${
                  isLudo ? 'ring-rose-500/60' : 'ring-indigo-500/50'
                }`}
              >
                <span>{hostAvatar.emoji}</span>
              </div>
              <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white tracking-wider ${
                isLudo ? 'bg-rose-600' : 'bg-indigo-500'
              }`}>
                {isLudo ? 'RED' : 'P1'}
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-2 truncate max-w-full">
              {hostPlayer?.displayName || (isLudo ? 'Player 1 (Red)' : 'Player 1')}
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Ready
            </span>
          </div>

          {/* Player 2 */}
          <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
            isLudo ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center animate-pulse ${
              isLudo ? 'border-amber-400/40 text-amber-300/40' : 'border-white/20 text-white/30'
            }`}>
              <Loader2 className={`w-6 h-6 animate-spin ${isLudo ? 'text-amber-400' : 'text-indigo-400'}`} />
            </div>
            <p className="text-sm font-bold text-white/40 mt-2">
              {isLudo ? 'Player 2 (Yellow)' : 'Player 2'}
            </p>
            <span className="text-[11px] text-white/30 font-medium">Waiting to connect...</span>
          </div>
        </div>

        {/* Cancel / Leave Action */}
        <div className="pt-2 border-t border-white/10 flex justify-center">
          <button
            id="cancel-waiting-room-btn"
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cancel & Return Home
          </button>
        </div>
      </div>

      {/* QR Code Scan Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        roomId={pairId}
      />
    </div>
  );
}
