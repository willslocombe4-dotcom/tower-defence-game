import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectPool } from './ObjectPool';

interface TestObject {
  id: number;
  value: string;
  reset?: () => void;
}

describe('ObjectPool', () => {
  let createCount: number;

  const createTestObject = (): TestObject => {
    createCount++;
    return { id: createCount, value: `object-${createCount}` };
  };

  beforeEach(() => {
    createCount = 0;
  });

  describe('constructor', () => {
    it('should pre-allocate initial objects', () => {
      const pool = new ObjectPool(createTestObject, 5);
      expect(createCount).toBe(5);
      expect(pool.availableCount).toBe(5);
    });

    it('should default to 10 initial objects', () => {
      new ObjectPool(createTestObject);
      expect(createCount).toBe(10);
    });

    it('should have no active objects initially', () => {
      const pool = new ObjectPool(createTestObject, 5);
      expect(pool.activeCount).toBe(0);
    });
  });

  describe('acquire', () => {
    it('should return an object from the pool', () => {
      const pool = new ObjectPool(createTestObject, 5);
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(obj.id).toBeDefined();
    });

    it('should decrease available count', () => {
      const pool = new ObjectPool(createTestObject, 5);
      pool.acquire();
      expect(pool.availableCount).toBe(4);
    });

    it('should increase active count', () => {
      const pool = new ObjectPool(createTestObject, 5);
      pool.acquire();
      expect(pool.activeCount).toBe(1);
    });

    it('should create new object when pool is empty', () => {
      const pool = new ObjectPool(createTestObject, 2);
      pool.acquire();
      pool.acquire();
      expect(createCount).toBe(2);

      pool.acquire(); // Pool empty, should create new
      expect(createCount).toBe(3);
    });
  });

  describe('release', () => {
    it('should return object to pool', () => {
      const pool = new ObjectPool(createTestObject, 5);
      const obj = pool.acquire();
      pool.release(obj);
      expect(pool.availableCount).toBe(5);
      expect(pool.activeCount).toBe(0);
    });

    it('should call reset method if object has one', () => {
      const resetFn = vi.fn();
      const createWithReset = (): TestObject => ({
        id: ++createCount,
        value: 'test',
        reset: resetFn,
      });

      const pool = new ObjectPool(createWithReset, 1);
      const obj = pool.acquire();
      pool.release(obj);

      expect(resetFn).toHaveBeenCalledOnce();
    });

    it('should call custom reset function if provided', () => {
      const customReset = vi.fn();
      const pool = new ObjectPool(createTestObject, 1, 100, customReset);
      const obj = pool.acquire();
      pool.release(obj);

      expect(customReset).toHaveBeenCalledWith(obj);
    });

    it('should warn when releasing object not from pool', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const pool = new ObjectPool(createTestObject, 1);
      const foreignObj = { id: 999, value: 'foreign' };

      pool.release(foreignObj);

      expect(warnSpy).toHaveBeenCalledWith(
        'ObjectPool: Attempting to release object not from this pool'
      );
      warnSpy.mockRestore();
    });

    it('should not exceed max pool size', () => {
      const pool = new ObjectPool(createTestObject, 5, 5);
      const objects = [pool.acquire(), pool.acquire(), pool.acquire()];

      // Add more objects than max
      for (let i = 0; i < 3; i++) {
        pool.release(objects[i]);
      }

      expect(pool.availableCount).toBeLessThanOrEqual(5);
    });
  });

  describe('releaseAll', () => {
    it('should release all active objects', () => {
      const pool = new ObjectPool(createTestObject, 5);
      pool.acquire();
      pool.acquire();
      pool.acquire();

      expect(pool.activeCount).toBe(3);
      pool.releaseAll();
      expect(pool.activeCount).toBe(0);
    });

    it('should call reset on all objects', () => {
      const resetFn = vi.fn();
      const createWithReset = () => ({
        id: ++createCount,
        value: 'test',
        reset: resetFn,
      });

      const pool = new ObjectPool(createWithReset, 3);
      pool.acquire();
      pool.acquire();
      pool.releaseAll();

      expect(resetFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('should empty the pool', () => {
      const pool = new ObjectPool(createTestObject, 5);
      pool.acquire();
      pool.clear();

      expect(pool.availableCount).toBe(0);
      expect(pool.activeCount).toBe(0);
    });

    it('should call destroy function if provided', () => {
      const destroyFn = vi.fn();
      const pool = new ObjectPool(createTestObject, 3);
      pool.acquire();

      pool.clear(destroyFn);

      expect(destroyFn).toHaveBeenCalledTimes(3); // 2 in pool + 1 active
    });
  });

  describe('counts', () => {
    it('should return correct total count', () => {
      const pool = new ObjectPool(createTestObject, 5);
      pool.acquire();
      pool.acquire();

      expect(pool.totalCount).toBe(5);
      expect(pool.availableCount).toBe(3);
      expect(pool.activeCount).toBe(2);
    });
  });

  describe('prewarm', () => {
    it('should create objects up to target count', () => {
      const pool = new ObjectPool(createTestObject, 3);
      expect(createCount).toBe(3);

      pool.prewarm(8);
      expect(createCount).toBe(8);
    });

    it('should not exceed max size', () => {
      const pool = new ObjectPool(createTestObject, 3, 5);
      pool.prewarm(10);

      expect(pool.totalCount).toBeLessThanOrEqual(5);
    });

    it('should not create objects if already at target', () => {
      const pool = new ObjectPool(createTestObject, 5);
      const initialCount = createCount;

      pool.prewarm(3);
      expect(createCount).toBe(initialCount);
    });
  });
});
