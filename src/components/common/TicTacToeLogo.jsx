/**
 * Reusable Tic Tac Toe Game Logo / Emblem
 * Exactly matches the reference branding:
 * Dark blue/indigo squircle container with a clean, glowing rounded 3x3 grid icon.
 */
import React from 'react';

export default function TicTacToeLogo({ className = 'w-16 h-16 sm:w-20 sm:h-20' }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-label="Tic Tac Toe Game Logo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Subtle Squircle Background */}
          <linearGradient id="tttBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E2344" />
            <stop offset="100%" stopColor="#161933" />
          </linearGradient>

          {/* Squircle Border Outline */}
          <linearGradient id="tttBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F5D9E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#363E70" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Squircle Frame */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="26"
          fill="url(#tttBg)"
          stroke="url(#tttBorder)"
          strokeWidth="2.5"
        />

        {/* Inner 3x3 Rounded Grid - matching reference image */}
        <g fill="#7F94FB">
          {/* Row 1 */}
          <rect x="29" y="29" width="11" height="11" rx="3" />
          <rect x="44.5" y="29" width="11" height="11" rx="3" />
          <rect x="60" y="29" width="11" height="11" rx="3" />

          {/* Row 2 */}
          <rect x="29" y="44.5" width="11" height="11" rx="3" />
          <rect x="44.5" y="44.5" width="11" height="11" rx="3" />
          <rect x="60" y="44.5" width="11" height="11" rx="3" />

          {/* Row 3 */}
          <rect x="29" y="60" width="11" height="11" rx="3" />
          <rect x="44.5" y="60" width="11" height="11" rx="3" />
          <rect x="60" y="60" width="11" height="11" rx="3" />
        </g>
      </svg>
    </div>
  );
}
