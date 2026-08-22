import React from 'react';
import { AVATAR_LIST } from '../../data/avatars';

export default function AvatarPicker({ selectedId, onSelect }) {
  return (
    <div id="avatar-picker" className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {AVATAR_LIST.map((av) => {
          const isSelected = av.id === selectedId;
          return (
            <button
              key={av.id}
              id={`avatar-option-${av.id}`}
              type="button"
              onClick={() => onSelect(av.id)}
              className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500 scale-105`
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${av.color} flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110`}
              >
                <span>{av.emoji}</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium mt-1 truncate max-w-[55px]">
                {av.name}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
