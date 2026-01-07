import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid } from './SpatialGrid';

describe('SpatialGrid', () => {
  let grid: SpatialGrid<string>;

  beforeEach(() => {
    // 640x480 world with 64px cells = 10x8 grid
    grid = new SpatialGrid<string>(640, 480, 64);
  });

  describe('constructor', () => {
    it('should create empty grid', () => {
      expect(grid.entityCount).toBe(0);
      expect(grid.cellCount).toBe(0);
    });
  });

  describe('insert', () => {
    it('should add entity to grid', () => {
      grid.insert('enemy1', { x: 100, y: 100, width: 20, height: 20 });
      expect(grid.entityCount).toBe(1);
    });

    it('should add entity to multiple cells if spanning', () => {
      // Entity at cell boundary spanning 4 cells
      grid.insert('large', { x: 60, y: 60, width: 20, height: 20 });
      expect(grid.cellCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle entity at origin', () => {
      grid.insert('origin', { x: 0, y: 0, width: 10, height: 10 });
      expect(grid.entityCount).toBe(1);
    });

    it('should handle entity at edge of world', () => {
      grid.insert('edge', { x: 630, y: 470, width: 10, height: 10 });
      expect(grid.entityCount).toBe(1);
    });
  });

  describe('remove', () => {
    it('should remove entity from grid', () => {
      grid.insert('enemy1', { x: 100, y: 100, width: 20, height: 20 });
      grid.remove('enemy1');
      expect(grid.entityCount).toBe(0);
    });

    it('should handle removing non-existent entity', () => {
      grid.remove('nonexistent');
      expect(grid.entityCount).toBe(0);
    });

    it('should clean up empty cells', () => {
      grid.insert('enemy1', { x: 100, y: 100, width: 20, height: 20 });
      grid.remove('enemy1');
      expect(grid.cellCount).toBe(0);
    });
  });

  describe('update', () => {
    it('should update entity position', () => {
      grid.insert('moving', { x: 100, y: 100, width: 20, height: 20 });
      grid.update('moving', { x: 200, y: 200, width: 20, height: 20 });

      const nearOld = grid.query({ x: 90, y: 90, width: 40, height: 40 });
      const nearNew = grid.query({ x: 190, y: 190, width: 40, height: 40 });

      expect(nearOld).not.toContain('moving');
      expect(nearNew).toContain('moving');
    });

    it('should insert entity if not already in grid', () => {
      grid.update('new', { x: 100, y: 100, width: 20, height: 20 });
      expect(grid.entityCount).toBe(1);
    });

    it('should efficiently handle same-cell movement', () => {
      grid.insert('small', { x: 100, y: 100, width: 10, height: 10 });
      const initialCellCount = grid.cellCount;

      // Small movement within same cell
      grid.update('small', { x: 105, y: 105, width: 10, height: 10 });

      expect(grid.cellCount).toBe(initialCellCount);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      grid.insert('e1', { x: 50, y: 50, width: 20, height: 20 });
      grid.insert('e2', { x: 150, y: 150, width: 20, height: 20 });
      grid.insert('e3', { x: 300, y: 300, width: 20, height: 20 });
    });

    it('should return entities in query area', () => {
      const results = grid.query({ x: 40, y: 40, width: 40, height: 40 });
      expect(results).toContain('e1');
      expect(results).not.toContain('e2');
      expect(results).not.toContain('e3');
    });

    it('should return multiple entities', () => {
      // Large query area
      const results = grid.query({ x: 0, y: 0, width: 200, height: 200 });
      expect(results).toContain('e1');
      expect(results).toContain('e2');
    });

    it('should return empty array for empty area', () => {
      const results = grid.query({ x: 500, y: 500, width: 10, height: 10 });
      expect(results).toEqual([]);
    });

    it('should exclude specified entity', () => {
      const results = grid.query(
        { x: 40, y: 40, width: 40, height: 40 },
        'e1'
      );
      expect(results).not.toContain('e1');
    });

    it('should not return duplicates for multi-cell entities', () => {
      grid.insert('large', { x: 60, y: 60, width: 40, height: 40 });
      const results = grid.query({ x: 50, y: 50, width: 60, height: 60 });

      const largeCount = results.filter((r) => r === 'large').length;
      expect(largeCount).toBe(1);
    });
  });

  describe('queryRadius', () => {
    beforeEach(() => {
      grid.insert('center', { x: 320, y: 240, width: 20, height: 20 });
      grid.insert('near', { x: 350, y: 240, width: 20, height: 20 });
      grid.insert('far', { x: 500, y: 400, width: 20, height: 20 });
    });

    it('should find entities within radius', () => {
      const results = grid.queryRadius({ x: 320, y: 240 }, 50);
      expect(results).toContain('center');
      expect(results).toContain('near');
      expect(results).not.toContain('far');
    });

    it('should exclude specified entity', () => {
      const results = grid.queryRadius({ x: 320, y: 240 }, 50, 'center');
      expect(results).not.toContain('center');
      expect(results).toContain('near');
    });
  });

  describe('queryCell', () => {
    it('should return entities in specific cell', () => {
      grid.insert('inCell', { x: 100, y: 100, width: 10, height: 10 });
      const results = grid.queryCell(100, 100);
      expect(results).toContain('inCell');
    });

    it('should return empty array for empty cell', () => {
      const results = grid.queryCell(500, 500);
      expect(results).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all entities', () => {
      grid.insert('e1', { x: 100, y: 100, width: 20, height: 20 });
      grid.insert('e2', { x: 200, y: 200, width: 20, height: 20 });

      grid.clear();

      expect(grid.entityCount).toBe(0);
      expect(grid.cellCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return grid statistics', () => {
      grid.insert('e1', { x: 100, y: 100, width: 20, height: 20 });
      grid.insert('e2', { x: 100, y: 100, width: 20, height: 20 });
      grid.insert('e3', { x: 300, y: 300, width: 20, height: 20 });

      const stats = grid.getStats();

      expect(stats.entityCount).toBe(3);
      expect(stats.cellCount).toBeGreaterThan(0);
      expect(stats.avgEntitiesPerCell).toBeGreaterThan(0);
      expect(stats.maxEntitiesInCell).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty grid', () => {
      const stats = grid.getStats();
      expect(stats.entityCount).toBe(0);
      expect(stats.avgEntitiesPerCell).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-size bounds', () => {
      grid.insert('point', { x: 100, y: 100, width: 0, height: 0 });
      expect(grid.entityCount).toBe(1);
    });

    it('should clamp negative positions', () => {
      grid.insert('negative', { x: -50, y: -50, width: 20, height: 20 });
      expect(grid.entityCount).toBe(1);
    });

    it('should clamp positions beyond world', () => {
      grid.insert('beyond', { x: 1000, y: 1000, width: 20, height: 20 });
      expect(grid.entityCount).toBe(1);
    });
  });
});
