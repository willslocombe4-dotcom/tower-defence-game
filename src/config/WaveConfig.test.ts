import { describe, it, expect } from 'vitest';
import {
  WAVE_DEFINITIONS,
  WAVE_TIMING,
  getWaveEnemyCount,
  getTotalEnemyCount,
} from './WaveConfig';
import { EnemyType } from '../types';

describe('WaveConfig', () => {
  describe('WAVE_DEFINITIONS', () => {
    it('should have 10 waves', () => {
      expect(WAVE_DEFINITIONS.length).toBe(10);
    });

    it('should have correct wave numbers', () => {
      WAVE_DEFINITIONS.forEach((wave, index) => {
        expect(wave.waveNumber).toBe(index + 1);
      });
    });

    it('should have positive start delays', () => {
      WAVE_DEFINITIONS.forEach((wave) => {
        expect(wave.startDelay).toBeGreaterThan(0);
      });
    });

    it('should have at least one enemy spawn per wave', () => {
      WAVE_DEFINITIONS.forEach((wave) => {
        expect(wave.enemies.length).toBeGreaterThan(0);
      });
    });

    it('should have valid enemy types', () => {
      const validTypes = Object.values(EnemyType);
      WAVE_DEFINITIONS.forEach((wave) => {
        wave.enemies.forEach((spawn) => {
          expect(validTypes).toContain(spawn.type);
        });
      });
    });

    it('should have positive spawn counts', () => {
      WAVE_DEFINITIONS.forEach((wave) => {
        wave.enemies.forEach((spawn) => {
          expect(spawn.count).toBeGreaterThan(0);
        });
      });
    });

    it('should have positive spawn delays', () => {
      WAVE_DEFINITIONS.forEach((wave) => {
        wave.enemies.forEach((spawn) => {
          expect(spawn.spawnDelay).toBeGreaterThan(0);
        });
      });
    });

    it('should start with easier waves (fewer enemies)', () => {
      const wave1Count = getWaveEnemyCount(WAVE_DEFINITIONS[0]);
      const wave10Count = getWaveEnemyCount(WAVE_DEFINITIONS[9]);
      expect(wave10Count).toBeGreaterThan(wave1Count);
    });

    it('wave 1 should only have FAST enemies', () => {
      const wave1 = WAVE_DEFINITIONS[0];
      wave1.enemies.forEach((spawn) => {
        expect(spawn.type).toBe(EnemyType.FAST);
      });
    });
  });

  describe('WAVE_TIMING', () => {
    it('should have time between waves', () => {
      expect(WAVE_TIMING.timeBetweenWaves).toBeGreaterThan(0);
    });

    it('should have minimum time between waves', () => {
      expect(WAVE_TIMING.minTimeBetweenWaves).toBeGreaterThan(0);
    });

    it('min time should be less than regular time', () => {
      expect(WAVE_TIMING.minTimeBetweenWaves).toBeLessThan(
        WAVE_TIMING.timeBetweenWaves
      );
    });
  });

  describe('getWaveEnemyCount', () => {
    it('should calculate wave 1 enemy count', () => {
      const count = getWaveEnemyCount(WAVE_DEFINITIONS[0]);
      expect(count).toBe(5); // Wave 1: 5 fast enemies
    });

    it('should calculate mixed wave enemy count', () => {
      const wave4 = WAVE_DEFINITIONS[3];
      const count = getWaveEnemyCount(wave4);
      // Wave 4: 6 fast + 3 tank + 2 flying = 11
      expect(count).toBe(11);
    });

    it('should return 0 for empty wave', () => {
      const emptyWave = {
        waveNumber: 0,
        startDelay: 1000,
        enemies: [],
      };
      expect(getWaveEnemyCount(emptyWave)).toBe(0);
    });

    it('should handle single enemy type', () => {
      const singleTypeWave = {
        waveNumber: 1,
        startDelay: 1000,
        enemies: [{ type: EnemyType.TANK, count: 7, spawnDelay: 500 }],
      };
      expect(getWaveEnemyCount(singleTypeWave)).toBe(7);
    });
  });

  describe('getTotalEnemyCount', () => {
    it('should calculate total enemies across all waves', () => {
      const total = getTotalEnemyCount();
      // Manual count from config:
      // Wave 1: 5, Wave 2: 6, Wave 3: 6, Wave 4: 11, Wave 5: 9
      // Wave 6: 10, Wave 7: 12, Wave 8: 17, Wave 9: 21, Wave 10: 29
      expect(total).toBe(126);
    });

    it('should work with custom waves array', () => {
      const customWaves = [
        {
          waveNumber: 1,
          startDelay: 1000,
          enemies: [{ type: EnemyType.FAST, count: 5, spawnDelay: 500 }],
        },
        {
          waveNumber: 2,
          startDelay: 1000,
          enemies: [{ type: EnemyType.TANK, count: 3, spawnDelay: 500 }],
        },
      ];
      expect(getTotalEnemyCount(customWaves)).toBe(8);
    });

    it('should return 0 for empty waves array', () => {
      expect(getTotalEnemyCount([])).toBe(0);
    });
  });
});
