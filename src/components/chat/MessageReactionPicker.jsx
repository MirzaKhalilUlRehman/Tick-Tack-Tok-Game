/**
 * Message Reaction Picker Bar
 * Displays quick emoji reactions (❤️ 😂 😮 😢 👍 👎) with subtle animations.
 */
import React from 'react';
import { useSound } from '../../hooks/useSound';

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

export default function MessageReactionPicker({
  isOpen,
  onSelectReaction,
  currentReaction,
  position = 'top',
}) {
  const { playPop } = useSound();

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-30 flex items-center gap-1.5 p-1.5 bg-slate-900/95 border border-white/20 rounded-full shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 ${
        position === 'top' ? '-top-11' : '-bottom-11'
      } left-2`}
      onClick={(e) => e.stopPropagation()}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const isSelected = currentReaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              playPop();
              onSelectReaction(emoji);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-base hover:scale-125 transition-transform duration-150 cursor-pointer ${
              isSelected ? 'bg-white/20 ring-1 ring-white/40 scale-110' : 'hover:bg-white/10'
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
