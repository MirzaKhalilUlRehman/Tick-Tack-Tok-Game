/**
 * Avatar collection for player profiles
 */

export const AVATAR_LIST = [
  { id: 'av1', emoji: '🦊', name: 'Fox Blaze', color: 'from-amber-500 to-orange-600', ring: 'ring-amber-400' },
  { id: 'av2', emoji: '⚡', name: 'Thunder Volt', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400' },
  { id: 'av3', emoji: '👾', name: 'Pixel Ghost', color: 'from-purple-500 to-indigo-600', ring: 'ring-purple-400' },
  { id: 'av4', emoji: '🐼', name: 'Chill Panda', color: 'from-emerald-400 to-teal-600', ring: 'ring-emerald-400' },
  { id: 'av5', emoji: '🚀', name: 'Star Rocket', color: 'from-blue-500 to-cyan-500', ring: 'ring-blue-400' },
  { id: 'av6', emoji: '🐉', name: 'Dragon Lord', color: 'from-red-500 to-rose-600', ring: 'ring-rose-400' },
  { id: 'av7', emoji: '🐯', name: 'Tiger Strike', color: 'from-orange-500 to-amber-600', ring: 'ring-orange-400' },
  { id: 'av8', emoji: '🦄', name: 'Mystic Star', color: 'from-fuchsia-500 to-pink-600', ring: 'ring-pink-400' },
  { id: 'av9', emoji: '🥷', name: 'Shadow Ninja', color: 'from-slate-600 to-slate-800', ring: 'ring-slate-400' },
  { id: 'av10', emoji: '🦁', name: 'Brave Lion', color: 'from-yellow-500 to-red-500', ring: 'ring-yellow-400' },
  { id: 'av11', emoji: '🤖', name: 'Cyber Bot', color: 'from-cyan-400 to-blue-600', ring: 'ring-cyan-400' },
  { id: 'av12', emoji: '🎭', name: 'Joker Ace', color: 'from-violet-500 to-purple-700', ring: 'ring-violet-400' },
];

export function getAvatarById(id) {
  return AVATAR_LIST.find((av) => av.id === id) || AVATAR_LIST[0];
}
