/**
 * Ludo Board Path & Coordinate System
 * Standard 15x15 grid layout with 52 track cells, 8 safe cells, 2 home lanes, base yards, and center goal.
 */

// 52-cell track coordinates in a 15x15 grid (row 0-14, col 0-14) clockwise
export const TRACK_COORDINATES = [
  // 0..4 (Red arm moving right)
  { r: 6, c: 1, safe: true, startFor: 'red' }, // 0 - Red start (safe)
  { r: 6, c: 2 }, // 1
  { r: 6, c: 3 }, // 2
  { r: 6, c: 4 }, // 3
  { r: 6, c: 5 }, // 4

  // 5..10 (Green arm moving up)
  { r: 5, c: 6 }, // 5
  { r: 4, c: 6 }, // 6
  { r: 3, c: 6 }, // 7
  { r: 2, c: 6, safe: true }, // 8 - Star safe cell
  { r: 1, c: 6 }, // 9
  { r: 0, c: 6 }, // 10

  // 11..12 (Top turn)
  { r: 0, c: 7 }, // 11
  { r: 0, c: 8 }, // 12

  // 13..17 (Green arm moving down)
  { r: 1, c: 8, safe: true, startFor: 'green' }, // 13 - Green start (safe)
  { r: 2, c: 8 }, // 14
  { r: 3, c: 8 }, // 15
  { r: 4, c: 8 }, // 16
  { r: 5, c: 8 }, // 17

  // 18..23 (Yellow arm moving right)
  { r: 6, c: 9 }, // 18
  { r: 6, c: 10 }, // 19
  { r: 6, c: 11 }, // 20
  { r: 6, c: 12, safe: true }, // 21 - Star safe cell
  { r: 6, c: 13 }, // 22
  { r: 6, c: 14 }, // 23

  // 24..25 (Right turn)
  { r: 7, c: 14 }, // 24
  { r: 8, c: 14 }, // 25

  // 26..30 (Yellow arm moving left)
  { r: 8, c: 13, safe: true, startFor: 'yellow' }, // 26 - Yellow start (safe)
  { r: 8, c: 12 }, // 27
  { r: 8, c: 11 }, // 28
  { r: 8, c: 10 }, // 29
  { r: 8, c: 9 }, // 30

  // 31..36 (Blue arm moving down)
  { r: 9, c: 8 }, // 31
  { r: 10, c: 8 }, // 32
  { r: 11, c: 8 }, // 33
  { r: 12, c: 8, safe: true }, // 34 - Star safe cell
  { r: 13, c: 8 }, // 35
  { r: 14, c: 8 }, // 36

  // 37..38 (Bottom turn)
  { r: 14, c: 7 }, // 37
  { r: 14, c: 6 }, // 38

  // 39..43 (Blue arm moving up)
  { r: 13, c: 6, safe: true, startFor: 'blue' }, // 39 - Blue start (safe)
  { r: 12, c: 6 }, // 40
  { r: 11, c: 6 }, // 41
  { r: 10, c: 6 }, // 42
  { r: 9, c: 6 }, // 43

  // 44..49 (Red arm moving left)
  { r: 8, c: 5 }, // 44
  { r: 8, c: 4 }, // 45
  { r: 8, c: 3 }, // 46
  { r: 8, c: 2, safe: true }, // 47 - Star safe cell
  { r: 8, c: 1 }, // 48
  { r: 8, c: 0 }, // 49

  // 50..51 (Left turn back to Red)
  { r: 7, c: 0 }, // 50
  { r: 6, c: 0 }, // 51
];

// Home stretch lane coordinates (steps 51..55) and Center Goal (step 56)
export const HOME_LANES = {
  red: [
    { r: 7, c: 1 }, // step 51
    { r: 7, c: 2 }, // step 52
    { r: 7, c: 3 }, // step 53
    { r: 7, c: 4 }, // step 54
    { r: 7, c: 5 }, // step 55
    { r: 7, c: 6, isGoal: true }, // step 56 (Goal)
  ],
  yellow: [
    { r: 7, c: 13 }, // step 51
    { r: 7, c: 12 }, // step 52
    { r: 7, c: 11 }, // step 53
    { r: 7, c: 10 }, // step 54
    { r: 7, c: 9 }, // step 55
    { r: 7, c: 8, isGoal: true }, // step 56 (Goal)
  ],
};

// Base yard slots for tokens in home base (-1 step)
export const BASE_YARD_SLOTS = {
  red: [
    { r: 1.5, c: 1.5 },
    { r: 1.5, c: 3.5 },
    { r: 3.5, c: 1.5 },
    { r: 3.5, c: 3.5 },
  ],
  yellow: [
    { r: 10.5, c: 10.5 },
    { r: 10.5, c: 12.5 },
    { r: 12.5, c: 10.5 },
    { r: 12.5, c: 12.5 },
  ],
};

export const PLAYER_OFFSETS = {
  red: 0,
  yellow: 26,
};

export const TOTAL_TRACK_CELLS = 52;
export const GOAL_STEP = 56;

/**
 * Returns the 15x15 board coordinates (row, col) for a given token
 */
export function getTokenGridCoordinates(color, step, tokenId = 0) {
  if (step === -1) {
    const slots = BASE_YARD_SLOTS[color] || BASE_YARD_SLOTS.red;
    return slots[tokenId % slots.length];
  }

  if (step >= 51) {
    const laneIndex = Math.min(step - 51, 5);
    const lane = HOME_LANES[color] || HOME_LANES.red;
    return lane[laneIndex];
  }

  // On main track (steps 0..50)
  const offset = PLAYER_OFFSETS[color] || 0;
  const trackIndex = (offset + step) % TOTAL_TRACK_CELLS;
  return TRACK_COORDINATES[trackIndex];
}

/**
 * Checks whether a track position or step is safe from capture
 */
export function isCellSafe(color, step) {
  if (step === -1) return true; // Base yard is safe
  if (step >= 51) return true; // Home lanes and goal are safe
  const offset = PLAYER_OFFSETS[color] || 0;
  const trackIndex = (offset + step) % TOTAL_TRACK_CELLS;
  return Boolean(TRACK_COORDINATES[trackIndex]?.safe);
}

/**
 * Converts a player step to the global track index (0..51) if on track, or null if in yard/home lane
 */
export function stepToGlobalTrackIndex(color, step) {
  if (step < 0 || step > 50) return null;
  const offset = PLAYER_OFFSETS[color] || 0;
  return (offset + step) % TOTAL_TRACK_CELLS;
}
