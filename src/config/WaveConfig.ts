/**
 * Wave configuration definitions
 *
 * This file contains all wave definitions, timing settings,
 * and difficulty scaling configurations.
 */

import {
  EnemyType,
  WaveDefinition,
  DifficultyScaling,
  EnemyConfig,
} from '../types';

// ============================================================================
// Wave Timing Configuration
// ============================================================================

export const WAVE_TIMING = {
  /** Default time between waves in milliseconds */
  timeBetweenWaves: 10000,
  /** Minimum time between waves when player skips */
  minTimeBetweenWaves: 3000,
  /** Countdown tick interval in milliseconds */
  countdownTickInterval: 1000,
} as const;

// ============================================================================
// Base Enemy Configurations
// ============================================================================

export const BASE_ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    maxHealth: 50,
    speed: 150,
    size: 12,
    color: 0x00ff00,
    goldReward: 10,
    damageToBase: 1,
    ignoresObstacles: false,
  },
  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    maxHealth: 200,
    speed: 50,
    size: 20,
    color: 0xff0000,
    goldReward: 25,
    damageToBase: 3,
    ignoresObstacles: false,
  },
  [EnemyType.FLYING]: {
    type: EnemyType.FLYING,
    maxHealth: 80,
    speed: 100,
    size: 14,
    color: 0x0088ff,
    goldReward: 15,
    damageToBase: 2,
    ignoresObstacles: true,
  },
};

// ============================================================================
// Difficulty Scaling Presets
// ============================================================================

export const DIFFICULTY_PRESETS: Record<string, DifficultyScaling> = {
  easy: {
    healthMultiplier: 0.75,
    speedMultiplier: 0.9,
    rewardMultiplier: 1.25,
    countMultiplier: 0.8,
  },
  normal: {
    healthMultiplier: 1.0,
    speedMultiplier: 1.0,
    rewardMultiplier: 1.0,
    countMultiplier: 1.0,
  },
  hard: {
    healthMultiplier: 1.5,
    speedMultiplier: 1.15,
    rewardMultiplier: 0.85,
    countMultiplier: 1.25,
  },
  nightmare: {
    healthMultiplier: 2.0,
    speedMultiplier: 1.3,
    rewardMultiplier: 0.7,
    countMultiplier: 1.5,
  },
};

// ============================================================================
// Wave Definitions
// ============================================================================

/**
 * Default wave definitions for the game
 * Waves progressively introduce new enemy types and increase difficulty
 */
export const WAVE_DEFINITIONS: WaveDefinition[] = [
  // Wave 1: Introduction - Fast enemies only
  {
    waveNumber: 1,
    startDelay: 3000,
    enemies: [{ type: EnemyType.FAST, count: 5, spawnDelay: 1000 }],
  },

  // Wave 2: More fast enemies
  {
    waveNumber: 2,
    startDelay: 2000,
    enemies: [{ type: EnemyType.FAST, count: 8, spawnDelay: 800 }],
  },

  // Wave 3: Introduce tanks
  {
    waveNumber: 3,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FAST, count: 5, spawnDelay: 800 },
      { type: EnemyType.TANK, count: 2, spawnDelay: 1500 },
    ],
  },

  // Wave 4: Mixed assault
  {
    waveNumber: 4,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FAST, count: 6, spawnDelay: 600 },
      { type: EnemyType.TANK, count: 3, spawnDelay: 1200 },
    ],
  },

  // Wave 5: Introduce flying enemies
  {
    waveNumber: 5,
    startDelay: 3000,
    enemies: [
      { type: EnemyType.FAST, count: 4, spawnDelay: 700 },
      { type: EnemyType.FLYING, count: 3, spawnDelay: 1000 },
    ],
  },

  // Wave 6: All enemy types
  {
    waveNumber: 6,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FAST, count: 8, spawnDelay: 500 },
      { type: EnemyType.TANK, count: 3, spawnDelay: 1200 },
      { type: EnemyType.FLYING, count: 4, spawnDelay: 900 },
    ],
  },

  // Wave 7: Tank rush
  {
    waveNumber: 7,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.TANK, count: 6, spawnDelay: 1000 },
      { type: EnemyType.FAST, count: 4, spawnDelay: 600 },
    ],
  },

  // Wave 8: Flying swarm
  {
    waveNumber: 8,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FLYING, count: 8, spawnDelay: 700 },
      { type: EnemyType.FAST, count: 6, spawnDelay: 500 },
    ],
  },

  // Wave 9: Heavy mixed
  {
    waveNumber: 9,
    startDelay: 2000,
    enemies: [
      { type: EnemyType.FAST, count: 10, spawnDelay: 400 },
      { type: EnemyType.TANK, count: 5, spawnDelay: 1000 },
      { type: EnemyType.FLYING, count: 5, spawnDelay: 800 },
    ],
  },

  // Wave 10: Final wave - massive assault
  {
    waveNumber: 10,
    startDelay: 3000,
    enemies: [
      { type: EnemyType.FAST, count: 15, spawnDelay: 300 },
      { type: EnemyType.TANK, count: 8, spawnDelay: 800 },
      { type: EnemyType.FLYING, count: 8, spawnDelay: 600 },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total enemies in a wave
 */
export function getWaveEnemyCount(wave: WaveDefinition): number {
  return wave.enemies.reduce((total, spawn) => total + spawn.count, 0);
}

/**
 * Calculate total enemies across all waves
 */
export function getTotalEnemyCount(
  waves: WaveDefinition[] = WAVE_DEFINITIONS
): number {
  return waves.reduce((total, wave) => total + getWaveEnemyCount(wave), 0);
}

/**
 * Get enemy config with difficulty scaling applied
 */
export function getScaledEnemyConfig(
  type: EnemyType,
  scaling: DifficultyScaling
): EnemyConfig {
  const base = BASE_ENEMY_CONFIGS[type];
  return {
    ...base,
    maxHealth: Math.round(base.maxHealth * scaling.healthMultiplier),
    speed: Math.round(base.speed * scaling.speedMultiplier),
    goldReward: Math.round(base.goldReward * scaling.rewardMultiplier),
  };
}

/**
 * Get wave definition with scaled enemy counts
 */
export function getScaledWaveDefinition(
  wave: WaveDefinition,
  scaling: DifficultyScaling
): WaveDefinition {
  return {
    ...wave,
    enemies: wave.enemies.map((spawn) => ({
      ...spawn,
      count: Math.round(spawn.count * scaling.countMultiplier),
    })),
  };
}

/**
 * Generate waves with progressive difficulty scaling
 * Each wave after the base waves gets progressively harder
 */
export function generateScaledWaves(
  baseWaves: WaveDefinition[],
  waveScalingFactor: number = 0.1
): WaveDefinition[] {
  return baseWaves.map((wave, index) => {
    const scaleFactor = 1 + index * waveScalingFactor;
    return {
      ...wave,
      enemies: wave.enemies.map((spawn) => ({
        ...spawn,
        count: Math.round(spawn.count * scaleFactor),
      })),
    };
  });
}

/**
 * Create an endless mode wave generator
 * Returns a function that generates waves beyond the defined ones
 */
export function createEndlessWaveGenerator(
  baseWaves: WaveDefinition[]
): (waveNumber: number) => WaveDefinition {
  return (waveNumber: number): WaveDefinition => {
    // If within defined waves, return with scaling
    if (waveNumber <= baseWaves.length) {
      const wave = baseWaves[waveNumber - 1];
      const scaleFactor = 1 + (waveNumber - 1) * 0.05;
      return {
        ...wave,
        enemies: wave.enemies.map((spawn) => ({
          ...spawn,
          count: Math.round(spawn.count * scaleFactor),
        })),
      };
    }

    // Generate endless waves based on wave number
    const cyclePosition = (waveNumber - 1) % baseWaves.length;
    const cycleNumber = Math.floor((waveNumber - 1) / baseWaves.length);
    const baseWave = baseWaves[cyclePosition];
    const scaleFactor = 1 + cycleNumber * 0.5 + cyclePosition * 0.05;

    return {
      waveNumber,
      startDelay: Math.max(1000, 3000 - cycleNumber * 200),
      enemies: baseWave.enemies.map((spawn) => ({
        ...spawn,
        count: Math.round(spawn.count * scaleFactor),
        spawnDelay: Math.max(200, spawn.spawnDelay - cycleNumber * 50),
      })),
    };
  };
}
