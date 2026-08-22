/**
 * Sound settings hook
 */
import { useState, useEffect, useCallback } from 'react';
import { getSoundSetting, setSoundSetting } from '../utils/storage';
import { sound } from '../utils/soundEffects';

export function useSound() {
  const [soundEnabled, setSoundState] = useState(getSoundSetting);

  const toggleSound = useCallback(() => {
    setSoundState((prev) => {
      const next = !prev;
      setSoundSetting(next);
      if (next) sound.playPop();
      return next;
    });
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playClick: () => sound.playClick(),
    playPop: () => sound.playPop(),
    playMoveX: () => sound.playMoveX(),
    playMoveO: () => sound.playMoveO(),
    playWin: () => sound.playWin(),
    playDraw: () => sound.playDraw(),
    playCardFlip: () => sound.playCardFlip(),
    playHit: () => sound.playHit(),
    playMiss: () => sound.playMiss(),
    playShipSunk: () => sound.playShipSunk(),
    playChatMessage: () => sound.playChatMessage(),
    playPlayerJoin: () => sound.playPlayerJoin(),
  };
}
