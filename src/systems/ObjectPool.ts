/**
 * Generic object pool for reusing game objects.
 * Reduces garbage collection pressure by recycling objects instead of creating new ones.
 *
 * Usage:
 * ```typescript
 * const pool = new ObjectPool(() => new Projectile(), 20);
 * const projectile = pool.acquire();
 * // ... use projectile
 * pool.release(projectile);
 * ```
 */
export class ObjectPool<T extends { reset?: () => void }> {
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private factory: () => T;
  private maxSize: number;
  private resetFn?: (obj: T) => void;

  /**
   * Create a new object pool.
   * @param factory - Function that creates new objects
   * @param initialSize - Number of objects to pre-allocate (default: 10)
   * @param maxSize - Maximum pool size (default: 100)
   * @param resetFn - Optional function to reset object state before reuse
   */
  constructor(
    factory: () => T,
    initialSize: number = 10,
    maxSize: number = 100,
    resetFn?: (obj: T) => void
  ) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.resetFn = resetFn;

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Acquire an object from the pool.
   * Creates a new one if pool is empty (up to maxSize).
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }

    this.activeObjects.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool.
   * @param obj - Object to release
   */
  release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('ObjectPool: Attempting to release object not from this pool');
      return;
    }

    this.activeObjects.delete(obj);

    // Reset the object
    if (this.resetFn) {
      this.resetFn(obj);
    } else if (obj.reset) {
      obj.reset();
    }

    // Only add back to pool if under max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * Release all active objects back to the pool.
   */
  releaseAll(): void {
    for (const obj of this.activeObjects) {
      if (this.resetFn) {
        this.resetFn(obj);
      } else if (obj.reset) {
        obj.reset();
      }

      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
    this.activeObjects.clear();
  }

  /**
   * Clear the pool and destroy all objects.
   * @param destroyFn - Optional function to cleanup each object
   */
  clear(destroyFn?: (obj: T) => void): void {
    if (destroyFn) {
      for (const obj of this.pool) {
        destroyFn(obj);
      }
      for (const obj of this.activeObjects) {
        destroyFn(obj);
      }
    }

    this.pool = [];
    this.activeObjects.clear();
  }

  /**
   * Get number of available objects in pool.
   */
  get availableCount(): number {
    return this.pool.length;
  }

  /**
   * Get number of active (in-use) objects.
   */
  get activeCount(): number {
    return this.activeObjects.size;
  }

  /**
   * Get total capacity (available + active).
   */
  get totalCount(): number {
    return this.pool.length + this.activeObjects.size;
  }

  /**
   * Pre-warm the pool by creating objects up to a target count.
   */
  prewarm(targetCount: number): void {
    const needed = Math.min(targetCount, this.maxSize) - this.totalCount;
    for (let i = 0; i < needed; i++) {
      this.pool.push(this.factory());
    }
  }
}
