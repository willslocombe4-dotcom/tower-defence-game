import { describe, it, expect } from 'vitest';
import { TowerType, TOWER_CONFIGS } from './types';

describe('Tower Types', () => {
  describe('TowerType', () => {
    it('should have all expected tower types', () => {
      expect(TowerType.CANNON).toBe('cannon');
      expect(TowerType.ARCHER).toBe('archer');
      expect(TowerType.MAGE).toBe('mage');
    });

    it('should have 3 tower types', () => {
      expect(Object.keys(TowerType).length).toBe(3);
    });
  });

  describe('TOWER_CONFIGS', () => {
    it('should have configs for all tower types', () => {
      Object.values(TowerType).forEach((type) => {
        expect(TOWER_CONFIGS[type]).toBeDefined();
      });
    });

    it('should have required properties in each config', () => {
      Object.values(TOWER_CONFIGS).forEach((config) => {
        expect(config.type).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.stats).toBeDefined();
        expect(config.color).toBeDefined();
      });
    });

    it('should have valid stats in each config', () => {
      Object.values(TOWER_CONFIGS).forEach((config) => {
        expect(config.stats.damage).toBeGreaterThan(0);
        expect(config.stats.range).toBeGreaterThan(0);
        expect(config.stats.attackSpeed).toBeGreaterThan(0);
        expect(config.stats.projectileSpeed).toBeGreaterThan(0);
        expect(config.stats.cost).toBeGreaterThan(0);
      });
    });

    describe('CANNON tower', () => {
      const config = TOWER_CONFIGS[TowerType.CANNON];

      it('should have correct type', () => {
        expect(config.type).toBe(TowerType.CANNON);
      });

      it('should have highest damage', () => {
        expect(config.stats.damage).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.ARCHER].stats.damage
        );
        expect(config.stats.damage).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.damage
        );
      });

      it('should have slowest attack speed', () => {
        expect(config.stats.attackSpeed).toBeLessThan(
          TOWER_CONFIGS[TowerType.ARCHER].stats.attackSpeed
        );
        expect(config.stats.attackSpeed).toBeLessThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.attackSpeed
        );
      });

      it('should have medium cost', () => {
        expect(config.stats.cost).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.ARCHER].stats.cost
        );
        expect(config.stats.cost).toBeLessThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.cost
        );
      });
    });

    describe('ARCHER tower', () => {
      const config = TOWER_CONFIGS[TowerType.ARCHER];

      it('should have correct type', () => {
        expect(config.type).toBe(TowerType.ARCHER);
      });

      it('should have fastest attack speed', () => {
        expect(config.stats.attackSpeed).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.CANNON].stats.attackSpeed
        );
        expect(config.stats.attackSpeed).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.attackSpeed
        );
      });

      it('should have longest range', () => {
        expect(config.stats.range).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.CANNON].stats.range
        );
        expect(config.stats.range).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.range
        );
      });

      it('should be cheapest', () => {
        expect(config.stats.cost).toBeLessThan(
          TOWER_CONFIGS[TowerType.CANNON].stats.cost
        );
        expect(config.stats.cost).toBeLessThan(
          TOWER_CONFIGS[TowerType.MAGE].stats.cost
        );
      });
    });

    describe('MAGE tower', () => {
      const config = TOWER_CONFIGS[TowerType.MAGE];

      it('should have correct type', () => {
        expect(config.type).toBe(TowerType.MAGE);
      });

      it('should be most expensive', () => {
        expect(config.stats.cost).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.CANNON].stats.cost
        );
        expect(config.stats.cost).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.ARCHER].stats.cost
        );
      });

      it('should have medium range', () => {
        expect(config.stats.range).toBeGreaterThan(
          TOWER_CONFIGS[TowerType.CANNON].stats.range
        );
        expect(config.stats.range).toBeLessThan(
          TOWER_CONFIGS[TowerType.ARCHER].stats.range
        );
      });
    });

    describe('tower balance', () => {
      it('should have different costs', () => {
        const costs = Object.values(TOWER_CONFIGS).map((c) => c.stats.cost);
        const uniqueCosts = new Set(costs);
        expect(uniqueCosts.size).toBe(costs.length);
      });

      it('should have different ranges', () => {
        const ranges = Object.values(TOWER_CONFIGS).map((c) => c.stats.range);
        const uniqueRanges = new Set(ranges);
        expect(uniqueRanges.size).toBe(ranges.length);
      });

      it('should have different colors', () => {
        const colors = Object.values(TOWER_CONFIGS).map((c) => c.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(colors.length);
      });

      it('should have valid hex colors', () => {
        Object.values(TOWER_CONFIGS).forEach((config) => {
          expect(config.color).toBeGreaterThanOrEqual(0);
          expect(config.color).toBeLessThanOrEqual(0xffffff);
        });
      });
    });
  });
});
