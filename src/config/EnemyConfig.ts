import { EnemyType, EnemyConfig } from '../types';

/**
 * Base configurations for all enemy types.
 *
 * To add a new enemy type:
 * 1. Add the type to EnemyType enum in types/index.ts
 * 2. Add the configuration here
 * 3. Create a new enemy class extending Enemy
 * 4. Register it in EnemyFactory (when implemented)
 *
 * Balance notes:
 * - Speed is in pixels per second (game runs at ~60fps)
 * - Size is the collision/render radius
 * - Gold reward should scale with difficulty
 */
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    maxHealth: 50,
    speed: 150,               // Fast - harder to hit
    size: 12,                 // Small target
    color: 0x00ff00,          // Green
    goldReward: 10,
    damageToBase: 1,
    ignoresObstacles: false,
  },

  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    maxHealth: 200,
    speed: 50,                // Slow - easy to hit but tanky
    size: 20,                 // Large target
    color: 0xff0000,          // Red
    goldReward: 25,
    damageToBase: 3,
    ignoresObstacles: false,
  },

  [EnemyType.FLYING]: {
    type: EnemyType.FLYING,
    maxHealth: 80,
    speed: 100,               // Medium speed
    size: 14,                 // Medium size
    color: 0x0088ff,          // Blue
    goldReward: 15,
    damageToBase: 2,
    ignoresObstacles: true,   // Bypasses ground obstacles
  },
};

/**
 * Get config for an enemy type with optional difficulty scaling.
 * Use this for wave-based difficulty increases.
 */
export function getScaledEnemyConfig(
  type: EnemyType,
  healthMultiplier: number = 1,
  speedMultiplier: number = 1,
  rewardMultiplier: number = 1
): EnemyConfig {
  const base = ENEMY_CONFIGS[type];
  return {
    ...base,
    maxHealth: Math.round(base.maxHealth * healthMultiplier),
    speed: base.speed * speedMultiplier,
    goldReward: Math.round(base.goldReward * rewardMultiplier),
  };
}

/**
 * Default difficulty scaling per wave.
 * Can be overridden in WaveConfig for specific waves.
 */
export const DIFFICULTY_SCALING = {
  healthPerWave: 0.1,         // +10% health per wave
  speedPerWave: 0.02,         // +2% speed per wave
  rewardPerWave: 0.05,        // +5% gold per wave
};
