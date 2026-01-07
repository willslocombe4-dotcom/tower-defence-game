import { EnemyType, WaveDefinition } from '../types';

/**
 * Wave definitions for the game.
 *
 * Design principles:
 * - Early waves teach basic enemy types
 * - Later waves mix types and increase counts
 * - Boss waves (future) can be flagged specially
 *
 * To customize:
 * - Adjust startDelay for pacing
 * - Adjust spawnDelay for wave intensity
 * - Mix enemy types for strategic variety
 */
export const WAVE_DEFINITIONS: WaveDefinition[] = [
  // Wave 1: Introduction - just fast enemies
  {
    waveNumber: 1,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FAST, count: 5, spawnDelay: 1000 },
    ],
  },

  // Wave 2: Introduce tanks
  {
    waveNumber: 2,
    startDelay: 3000,
    enemies: [
      { type: EnemyType.FAST, count: 4, spawnDelay: 800 },
      { type: EnemyType.TANK, count: 2, spawnDelay: 1500 },
    ],
  },

  // Wave 3: Introduce flying
  {
    waveNumber: 3,
    startDelay: 3000,
    enemies: [
      { type: EnemyType.FAST, count: 3, spawnDelay: 700 },
      { type: EnemyType.FLYING, count: 3, spawnDelay: 1000 },
    ],
  },

  // Wave 4: Mixed assault
  {
    waveNumber: 4,
    startDelay: 4000,
    enemies: [
      { type: EnemyType.FAST, count: 6, spawnDelay: 600 },
      { type: EnemyType.TANK, count: 3, spawnDelay: 1200 },
      { type: EnemyType.FLYING, count: 2, spawnDelay: 900 },
    ],
  },

  // Wave 5: Tank wave
  {
    waveNumber: 5,
    startDelay: 4000,
    enemies: [
      { type: EnemyType.TANK, count: 5, spawnDelay: 1000 },
      { type: EnemyType.FAST, count: 4, spawnDelay: 500 },
    ],
  },

  // Wave 6: Flying swarm
  {
    waveNumber: 6,
    startDelay: 4000,
    enemies: [
      { type: EnemyType.FLYING, count: 8, spawnDelay: 600 },
      { type: EnemyType.TANK, count: 2, spawnDelay: 1500 },
    ],
  },

  // Wave 7: Speed rush
  {
    waveNumber: 7,
    startDelay: 3000,
    enemies: [
      { type: EnemyType.FAST, count: 12, spawnDelay: 400 },
    ],
  },

  // Wave 8: Heavy assault
  {
    waveNumber: 8,
    startDelay: 5000,
    enemies: [
      { type: EnemyType.TANK, count: 4, spawnDelay: 1000 },
      { type: EnemyType.FLYING, count: 5, spawnDelay: 700 },
      { type: EnemyType.FAST, count: 8, spawnDelay: 500 },
    ],
  },

  // Wave 9: Endurance
  {
    waveNumber: 9,
    startDelay: 4000,
    enemies: [
      { type: EnemyType.FAST, count: 10, spawnDelay: 400 },
      { type: EnemyType.TANK, count: 5, spawnDelay: 800 },
      { type: EnemyType.FLYING, count: 6, spawnDelay: 600 },
    ],
  },

  // Wave 10: Final wave
  {
    waveNumber: 10,
    startDelay: 5000,
    enemies: [
      { type: EnemyType.TANK, count: 6, spawnDelay: 800 },
      { type: EnemyType.FLYING, count: 8, spawnDelay: 500 },
      { type: EnemyType.FAST, count: 15, spawnDelay: 300 },
    ],
  },
];

/**
 * Wave timing constants.
 * Adjust these to control game pacing.
 */
export const WAVE_TIMING = {
  timeBetweenWaves: 5000,     // ms before next wave auto-starts
  minTimeBetweenWaves: 2000,  // minimum if player skips
};

/**
 * Calculate total enemies in a wave.
 */
export function getWaveEnemyCount(wave: WaveDefinition): number {
  return wave.enemies.reduce((sum, spawn) => sum + spawn.count, 0);
}

/**
 * Calculate total enemies across all waves.
 */
export function getTotalEnemyCount(waves: WaveDefinition[] = WAVE_DEFINITIONS): number {
  return waves.reduce((sum, wave) => sum + getWaveEnemyCount(wave), 0);
}
