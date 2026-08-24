/**
 * Reusable Ludo Game Logo / Emblem
 * Exactly matches the reference branding:
 * Dark amber/gold squircle container with a clean, glowing dual-dice icon.
 */
import React from 'react';

export default function LudoLogo({ className = 'w-16 h-16 sm:w-20 sm:h-20' }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-label="Ludo Game Logo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Warm Amber Squircle Background */}
          <linearGradient id="ludoBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3C2A0E" />
            <stop offset="100%" stopColor="#2A1D08" />
          </linearGradient>

          {/* Squircle Border Outline */}
          <linearGradient id="ludoBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#966C22" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6E4D14" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Squircle Frame */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="26"
          fill="url(#ludoBg)"
          stroke="url(#ludoBorder)"
          strokeWidth="2.5"
        />

        {/* Inner Dual Dice - matching reference image */}
        {/* Top-Right Tilted Die */}
        <g transform="rotate(32 60 41)">
          <rect
            x="48"
            y="29"
            width="24"
            height="24"
            rx="5.5"
            stroke="#F5A623"
            strokeWidth="3.2"
            fill="none"
          />
          {/* Pips for top-right die */}
          <circle cx="55" cy="36" r="1.8" fill="#F5A623" />
          <circle cx="65" cy="46" r="1.8" fill="#F5A623" />
        </g>

        {/* Bottom-Left Front Die */}
        <g transform="rotate(-6 38 58)">
          <rect
            x="26"
            y="46"
            width="25"
            height="25"
            rx="5.5"
            stroke="#F5A623"
            strokeWidth="3.2"
            fill="#2D1F09"
          />
          {/* Pips for front die */}
          <circle cx="32.5" cy="52.5" r="1.8" fill="#F5A623" />
          <circle cx="38.5" cy="58.5" r="1.8" fill="#F5A623" />
          <circle cx="44.5" cy="64.5" r="1.8" fill="#F5A623" />
        </g>
      </svg>
    </div>
  );
}
