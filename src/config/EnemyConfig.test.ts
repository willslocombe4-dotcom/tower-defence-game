import { describe, it, expect } from 'vitest';
import {
  ENEMY_CONFIGS,
  getScaledEnemyConfig,
  DIFFICULTY_SCALING,
} from './EnemyConfig';
import { EnemyType } from '../types';

describe('EnemyConfig', () => {
  describe('ENEMY_CONFIGS', () => {
    it('should have configs for all enemy types', () => {
      const enemyTypes = Object.values(EnemyType);
      enemyTypes.forEach((type) => {
        expect(ENEMY_CONFIGS[type]).toBeDefined();
      });
    });

    describe('FAST enemy', () => {
      const config = ENEMY_CONFIGS[EnemyType.FAST];

      it('should have correct type', () => {
        expect(config.type).toBe(EnemyType.FAST);
      });

      it('should be fastest', () => {
        expect(config.speed).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.TANK].speed);
        expect(config.speed).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FLYING].speed);
      });

      it('should have lowest health', () => {
        expect(config.maxHealth).toBeLessThan(ENEMY_CONFIGS[EnemyType.TANK].maxHealth);
        expect(config.maxHealth).toBeLessThan(ENEMY_CONFIGS[EnemyType.FLYING].maxHealth);
      });

      it('should have smallest size', () => {
        expect(config.size).toBeLessThan(ENEMY_CONFIGS[EnemyType.TANK].size);
      });

      it('should not ignore obstacles', () => {
        expect(config.ignoresObstacles).toBe(false);
      });

      it('should deal 1 damage to base', () => {
        expect(config.damageToBase).toBe(1);
      });
    });

    describe('TANK enemy', () => {
      const config = ENEMY_CONFIGS[EnemyType.TANK];

      it('should have correct type', () => {
        expect(config.type).toBe(EnemyType.TANK);
      });

      it('should be slowest', () => {
        expect(config.speed).toBeLessThan(ENEMY_CONFIGS[EnemyType.FAST].speed);
        expect(config.speed).toBeLessThan(ENEMY_CONFIGS[EnemyType.FLYING].speed);
      });

      it('should have highest health', () => {
        expect(config.maxHealth).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FAST].maxHealth);
        expect(config.maxHealth).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FLYING].maxHealth);
      });

      it('should have largest size', () => {
        expect(config.size).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FAST].size);
      });

      it('should not ignore obstacles', () => {
        expect(config.ignoresObstacles).toBe(false);
      });

      it('should give most gold', () => {
        expect(config.goldReward).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FAST].goldReward);
        expect(config.goldReward).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FLYING].goldReward);
      });

      it('should deal most damage to base', () => {
        expect(config.damageToBase).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FAST].damageToBase);
      });
    });

    describe('FLYING enemy', () => {
      const config = ENEMY_CONFIGS[EnemyType.FLYING];

      it('should have correct type', () => {
        expect(config.type).toBe(EnemyType.FLYING);
      });

      it('should ignore obstacles', () => {
        expect(config.ignoresObstacles).toBe(true);
      });

      it('should have medium speed', () => {
        expect(config.speed).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.TANK].speed);
        expect(config.speed).toBeLessThan(ENEMY_CONFIGS[EnemyType.FAST].speed);
      });

      it('should have medium health', () => {
        expect(config.maxHealth).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.FAST].maxHealth);
        expect(config.maxHealth).toBeLessThan(ENEMY_CONFIGS[EnemyType.TANK].maxHealth);
      });
    });

    describe('all enemy types', () => {
      const allConfigs = Object.values(ENEMY_CONFIGS);

      it('should all have positive health', () => {
        allConfigs.forEach((config) => {
          expect(config.maxHealth).toBeGreaterThan(0);
        });
      });

      it('should all have positive speed', () => {
        allConfigs.forEach((config) => {
          expect(config.speed).toBeGreaterThan(0);
        });
      });

      it('should all have positive size', () => {
        allConfigs.forEach((config) => {
          expect(config.size).toBeGreaterThan(0);
        });
      });

      it('should all have positive gold reward', () => {
        allConfigs.forEach((config) => {
          expect(config.goldReward).toBeGreaterThan(0);
        });
      });

      it('should all have positive damage to base', () => {
        allConfigs.forEach((config) => {
          expect(config.damageToBase).toBeGreaterThan(0);
        });
      });

      it('should all have valid hex color', () => {
        allConfigs.forEach((config) => {
          expect(config.color).toBeGreaterThanOrEqual(0);
          expect(config.color).toBeLessThanOrEqual(0xffffff);
        });
      });
    });
  });

  describe('getScaledEnemyConfig', () => {
    it('should return base config with no multipliers', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FAST);
      const base = ENEMY_CONFIGS[EnemyType.FAST];

      expect(scaled.maxHealth).toBe(base.maxHealth);
      expect(scaled.speed).toBe(base.speed);
      expect(scaled.goldReward).toBe(base.goldReward);
    });

    it('should scale health', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FAST, 2.0);
      const base = ENEMY_CONFIGS[EnemyType.FAST];

      expect(scaled.maxHealth).toBe(base.maxHealth * 2);
    });

    it('should scale speed', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FAST, 1, 1.5);
      const base = ENEMY_CONFIGS[EnemyType.FAST];

      expect(scaled.speed).toBe(base.speed * 1.5);
    });

    it('should scale gold reward', () => {
      const scaled = getScaledEnemyConfig(EnemyType.TANK, 1, 1, 2.0);
      const base = ENEMY_CONFIGS[EnemyType.TANK];

      expect(scaled.goldReward).toBe(base.goldReward * 2);
    });

    it('should round health to nearest integer', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FAST, 1.33);
      expect(scaled.maxHealth).toBe(Math.round(50 * 1.33));
    });

    it('should round gold reward to nearest integer', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FAST, 1, 1, 1.5);
      expect(scaled.goldReward).toBe(Math.round(10 * 1.5));
    });

    it('should preserve non-scaled properties', () => {
      const scaled = getScaledEnemyConfig(EnemyType.FLYING, 2, 2, 2);
      const base = ENEMY_CONFIGS[EnemyType.FLYING];

      expect(scaled.type).toBe(base.type);
      expect(scaled.size).toBe(base.size);
      expect(scaled.color).toBe(base.color);
      expect(scaled.damageToBase).toBe(base.damageToBase);
      expect(scaled.ignoresObstacles).toBe(base.ignoresObstacles);
    });

    it('should work with all enemy types', () => {
      Object.values(EnemyType).forEach((type) => {
        const scaled = getScaledEnemyConfig(type, 1.5, 1.2, 1.1);
        expect(scaled.type).toBe(type);
        expect(scaled.maxHealth).toBeGreaterThan(0);
      });
    });
  });

  describe('DIFFICULTY_SCALING', () => {
    it('should have positive health scaling per wave', () => {
      expect(DIFFICULTY_SCALING.healthPerWave).toBeGreaterThan(0);
    });

    it('should have positive speed scaling per wave', () => {
      expect(DIFFICULTY_SCALING.speedPerWave).toBeGreaterThan(0);
    });

    it('should have positive reward scaling per wave', () => {
      expect(DIFFICULTY_SCALING.rewardPerWave).toBeGreaterThan(0);
    });

    it('should have reasonable scaling values (< 50% per wave)', () => {
      expect(DIFFICULTY_SCALING.healthPerWave).toBeLessThan(0.5);
      expect(DIFFICULTY_SCALING.speedPerWave).toBeLessThan(0.5);
      expect(DIFFICULTY_SCALING.rewardPerWave).toBeLessThan(0.5);
    });

    it('should result in meaningful difficulty increase over 10 waves', () => {
      // After 10 waves with default scaling
      const wave10HealthMultiplier = 1 + 10 * DIFFICULTY_SCALING.healthPerWave;
      const wave10SpeedMultiplier = 1 + 10 * DIFFICULTY_SCALING.speedPerWave;

      // Health should double by wave 10
      expect(wave10HealthMultiplier).toBeGreaterThanOrEqual(2);
      // Speed should increase but not double
      expect(wave10SpeedMultiplier).toBeGreaterThan(1);
      expect(wave10SpeedMultiplier).toBeLessThan(2);
    });
  });
});
