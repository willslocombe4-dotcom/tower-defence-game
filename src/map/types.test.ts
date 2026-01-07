import { describe, it, expect } from 'vitest';
import { TileType, TILE_CONFIGS, TILE_COLORS } from './types';

describe('Map Types', () => {
  describe('TileType', () => {
    it('should have all expected tile types', () => {
      expect(TileType.EMPTY).toBe('empty');
      expect(TileType.PATH).toBe('path');
      expect(TileType.BUILDABLE).toBe('buildable');
      expect(TileType.BLOCKED).toBe('blocked');
      expect(TileType.SPAWN).toBe('spawn');
      expect(TileType.EXIT).toBe('exit');
    });

    it('should have 6 tile types', () => {
      expect(Object.keys(TileType).length).toBe(6);
    });
  });

  describe('TILE_CONFIGS', () => {
    it('should have config for all tile types', () => {
      Object.values(TileType).forEach((type) => {
        expect(TILE_CONFIGS[type]).toBeDefined();
      });
    });

    it('should have correct properties for each config', () => {
      Object.values(TILE_CONFIGS).forEach((config) => {
        expect(typeof config.type).toBe('string');
        expect(typeof config.walkable).toBe('boolean');
        expect(typeof config.buildable).toBe('boolean');
      });
    });

    describe('EMPTY tile', () => {
      const config = TILE_CONFIGS[TileType.EMPTY];

      it('should not be walkable', () => {
        expect(config.walkable).toBe(false);
      });

      it('should not be buildable', () => {
        expect(config.buildable).toBe(false);
      });
    });

    describe('PATH tile', () => {
      const config = TILE_CONFIGS[TileType.PATH];

      it('should be walkable', () => {
        expect(config.walkable).toBe(true);
      });

      it('should not be buildable', () => {
        expect(config.buildable).toBe(false);
      });
    });

    describe('BUILDABLE tile', () => {
      const config = TILE_CONFIGS[TileType.BUILDABLE];

      it('should not be walkable', () => {
        expect(config.walkable).toBe(false);
      });

      it('should be buildable', () => {
        expect(config.buildable).toBe(true);
      });
    });

    describe('BLOCKED tile', () => {
      const config = TILE_CONFIGS[TileType.BLOCKED];

      it('should not be walkable', () => {
        expect(config.walkable).toBe(false);
      });

      it('should not be buildable', () => {
        expect(config.buildable).toBe(false);
      });
    });

    describe('SPAWN tile', () => {
      const config = TILE_CONFIGS[TileType.SPAWN];

      it('should be walkable', () => {
        expect(config.walkable).toBe(true);
      });

      it('should not be buildable', () => {
        expect(config.buildable).toBe(false);
      });
    });

    describe('EXIT tile', () => {
      const config = TILE_CONFIGS[TileType.EXIT];

      it('should be walkable', () => {
        expect(config.walkable).toBe(true);
      });

      it('should not be buildable', () => {
        expect(config.buildable).toBe(false);
      });
    });

    it('only BUILDABLE tile should be buildable', () => {
      const buildableTiles = Object.values(TILE_CONFIGS).filter(
        (config) => config.buildable
      );
      expect(buildableTiles.length).toBe(1);
      expect(buildableTiles[0].type).toBe(TileType.BUILDABLE);
    });

    it('PATH, SPAWN, and EXIT tiles should be walkable', () => {
      const walkableTiles = Object.values(TILE_CONFIGS).filter(
        (config) => config.walkable
      );
      expect(walkableTiles.length).toBe(3);

      const walkableTypes = walkableTiles.map((t) => t.type);
      expect(walkableTypes).toContain(TileType.PATH);
      expect(walkableTypes).toContain(TileType.SPAWN);
      expect(walkableTypes).toContain(TileType.EXIT);
    });
  });

  describe('TILE_COLORS', () => {
    it('should have colors for all tile types', () => {
      Object.values(TileType).forEach((type) => {
        expect(TILE_COLORS[type]).toBeDefined();
      });
    });

    it('should have valid hex colors', () => {
      Object.values(TILE_COLORS).forEach((color) => {
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });

    it('should have different colors for different tiles', () => {
      const colors = Object.values(TILE_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('SPAWN should have red-ish color', () => {
      const color = TILE_COLORS[TileType.SPAWN];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      // Red component should be dominant
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });

    it('EXIT should have green-ish color', () => {
      const color = TILE_COLORS[TileType.EXIT];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      // Green component should be dominant
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    });
  });
});
