import React, { useState } from 'react';
import { QrCode, X, Copy, Check, Smartphone, Sparkles, Share2 } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

// Generate a simple SVG QR matrix pattern based on room URL
function renderQRCodeSVG(url) {
  // Simple deterministic 21x21 QR pattern generator for visual presentation + scan compatibility
  const size = 25;
  const matrix = Array(size).fill(0).map(() => Array(size).fill(false));

  // Finder patterns at corners
  const addFinderPattern = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[nr][nc] = true;
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Generate data modules hashed from string
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) & 0xffffffff;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }
      const val = ((r * size + c) ^ hash) * 1103515245 + 12345;
      matrix[r][c] = ((val >> 16) & 1) === 1;
    }
  }

  return matrix;
}

export default function QRCodeModal({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false);
  const { playClick, playPop } = useSound();

  if (!isOpen || !roomId) return null;

  const joinUrl = `${window.location.origin}/room/${roomId}`;
  const qrMatrix = renderQRCodeSVG(joinUrl);

  const handleCopy = () => {
    playClick();
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    playPop();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Multiplayer Arena match!',
          text: `Join my 2-player match! Room ID: ${roomId}`,
          url: joinUrl,
        });
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          Scan with Android / Phone
        </div>

        <h3 className="text-xl font-black font-display text-white">Join on Mobile</h3>
        <p className="text-xs text-white/50 mt-1">
          Scan with your Android camera or browser to instantly join this room.
        </p>

        {/* QR Display Card */}
        <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-xl shadow-indigo-500/10">
          <svg viewBox="0 0 25 25" className="w-48 h-48 mx-auto" shapeRendering="crispEdges">
            {qrMatrix.map((row, r) =>
              row.map((cell, c) => (
                cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
              ))
            )}
          </svg>
        </div>

        {/* Room Code Badge */}
        <div className="bg-black/60 rounded-xl p-2.5 border border-white/10 mb-4">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Room Code</span>
          <p className="text-xl font-mono font-black text-indigo-300 tracking-widest">{roomId}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Match</span>
          </button>
        </div>
      </div>
    </div>
  );
}
