import { Container } from 'pixi.js';
import { Enemy, FastEnemy, TankEnemy, FlyingEnemy } from '../entities/enemies';
import { PathSystem } from './PathSystem';
import {
  EnemyType,
  EnemyState,
  EnemyFilter,
  TargetingStrategy,
  GameEvent,
  GameEventCallback,
  EnemySpawnedEventData,
  EnemyDamagedEventData,
  EnemyKilledEventData,
  EnemyReachedEndEventData,
} from '../types';

/**
 * Factory function type for creating enemies.
 * Allows registration of custom enemy types.
 */
export type EnemyFactory = (id: string) => Enemy;

/**
 * Manages all enemies in the game.
 *
 * Responsibilities:
 * - Enemy spawning and factory
 * - Lifecycle management (update, destroy)
 * - Damage application
 * - Targeting queries for towers
 * - Event emission
 *
 * Future enhancements:
 * - Object pooling for performance
 * - Spatial partitioning for range queries
 * - Status effect management
 */
export class EnemyManager {
  private enemies: Map<string, Enemy> = new Map();
  private container: Container;
  private pathSystem: PathSystem;
  private nextEnemyId: number = 0;
  private eventListeners: Map<string, GameEventCallback[]> = new Map();

  // Extensible enemy factory registry
  private enemyFactories: Map<EnemyType, EnemyFactory> = new Map();

  // Statistics
  private stats = {
    totalSpawned: 0,
    totalKilled: 0,
    totalLeaked: 0,
    totalDamageDealt: 0,
  };

  constructor(container: Container, pathSystem: PathSystem) {
    this.container = container;
    this.pathSystem = pathSystem;
    this.registerDefaultFactories();
  }

  /**
   * Register the default enemy type factories.
   */
  private registerDefaultFactories(): void {
    this.registerEnemyFactory(EnemyType.FAST, (id) => new FastEnemy(id));
    this.registerEnemyFactory(EnemyType.TANK, (id) => new TankEnemy(id));
    this.registerEnemyFactory(EnemyType.FLYING, (id) => new FlyingEnemy(id));
  }

  /**
   * Register a factory for a new enemy type.
   * Use this to add custom enemy types.
   */
  registerEnemyFactory(type: EnemyType, factory: EnemyFactory): void {
    this.enemyFactories.set(type, factory);
  }

  /**
   * Spawn an enemy of the specified type.
   */
  spawnEnemy(type: EnemyType, pathId?: string): Enemy {
    const factory = this.enemyFactories.get(type);
    if (!factory) {
      throw new Error(`No factory registered for enemy type: ${type}`);
    }

    const id = `enemy_${this.nextEnemyId++}`;
    const enemy = factory(id);

    // Set path
    const waypoints = this.pathSystem.getWaypoints(pathId);
    enemy.setPath(waypoints);

    // Register and add to scene
    this.enemies.set(id, enemy);
    this.container.addChild(enemy);

    // Update stats
    this.stats.totalSpawned++;

    // Emit event
    this.emit<EnemySpawnedEventData>('enemy_spawned', {
      enemy: enemy.getState(),
    });

    return enemy;
  }

  /**
   * Update all enemies.
   */
  update(deltaTime: number): void {
    const toRemove: string[] = [];

    for (const [id, enemy] of this.enemies) {
      // Skip inactive enemies
      if (!enemy.isActive) {
        toRemove.push(id);
        continue;
      }

      // Update enemy
      enemy.update(deltaTime);

      // Check if enemy reached the end
      if (enemy.hasReachedEnd()) {
        this.stats.totalLeaked++;

        this.emit<EnemyReachedEndEventData>('enemy_reached_end', {
          enemy: enemy.getState(),
          damage: enemy.damageToBase,
        });

        toRemove.push(id);
      }
    }

    // Clean up completed enemies
    for (const id of toRemove) {
      this.removeEnemy(id);
    }
  }

  /**
   * Apply damage to an enemy.
   * @returns true if the enemy was killed
   */
  damageEnemy(id: string, amount: number, source?: string): boolean {
    const enemy = this.enemies.get(id);
    if (!enemy || !enemy.isActive) return false;

    const wasAlive = enemy.currentHealth > 0;
    const killed = enemy.takeDamage(amount, source);

    this.stats.totalDamageDealt += amount;

    // Emit damage event
    this.emit<EnemyDamagedEventData>('enemy_damaged', {
      enemy: enemy.getState(),
      damage: amount,
      source,
    });

    // Emit kill event if killed
    if (wasAlive && killed) {
      this.stats.totalKilled++;

      this.emit<EnemyKilledEventData>('enemy_killed', {
        enemy: enemy.getState(),
        reward: enemy.goldReward,
        killedBy: source,
      });
    }

    return killed;
  }

  /**
   * Remove an enemy from the manager.
   */
  private removeEnemy(id: string): void {
    const enemy = this.enemies.get(id);
    if (enemy) {
      enemy.destroy();
      this.enemies.delete(id);
    }
  }

  /**
   * Get an enemy by ID.
   */
  getEnemy(id: string): Enemy | undefined {
    return this.enemies.get(id);
  }

  /**
   * Get all active enemies.
   */
  getAllEnemies(): Enemy[] {
    return Array.from(this.enemies.values()).filter((e) => e.isActive);
  }

  /**
   * Get the number of active enemies.
   */
  getActiveCount(): number {
    return this.enemies.size;
  }

  /**
   * Get states of all active enemies.
   */
  getEnemyStates(): EnemyState[] {
    return this.getAllEnemies().map((e) => e.getState());
  }

  /**
   * Get enemies matching a filter.
   */
  getEnemiesWithFilter(filter: EnemyFilter): Enemy[] {
    let enemies = this.getAllEnemies();

    if (filter.types && filter.types.length > 0) {
      enemies = enemies.filter((e) => filter.types!.includes(e.type));
    }

    if (filter.excludeTypes && filter.excludeTypes.length > 0) {
      enemies = enemies.filter((e) => !filter.excludeTypes!.includes(e.type));
    }

    if (filter.minHealth !== undefined) {
      enemies = enemies.filter((e) => e.currentHealth >= filter.minHealth!);
    }

    if (filter.maxHealth !== undefined) {
      enemies = enemies.filter((e) => e.currentHealth <= filter.maxHealth!);
    }

    if (filter.inRange) {
      const { x, y, range } = filter.inRange;
      const rangeSq = range * range;
      enemies = enemies.filter((e) => {
        const dx = e.x - x;
        const dy = e.y - y;
        return dx * dx + dy * dy <= rangeSq;
      });
    }

    return enemies;
  }

  /**
   * Get enemies within range of a point.
   */
  getEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    return this.getEnemiesWithFilter({ inRange: { x, y, range } });
  }

  /**
   * Get a target based on targeting strategy.
   */
  getTarget(
    x: number,
    y: number,
    range: number,
    strategy: TargetingStrategy = TargetingStrategy.FIRST,
    filter?: EnemyFilter
  ): Enemy | null {
    let enemies = this.getEnemiesInRange(x, y, range);

    if (filter) {
      const filtered = this.getEnemiesWithFilter(filter);
      enemies = enemies.filter((e) => filtered.includes(e));
    }

    if (enemies.length === 0) return null;

    switch (strategy) {
      case TargetingStrategy.FIRST:
        // Closest to end (highest path progress)
        return enemies.reduce((best, e) =>
          e.getPathProgress() > best.getPathProgress() ? e : best
        );

      case TargetingStrategy.LAST:
        // Furthest from end (lowest path progress)
        return enemies.reduce((best, e) =>
          e.getPathProgress() < best.getPathProgress() ? e : best
        );

      case TargetingStrategy.STRONGEST:
        // Highest current health
        return enemies.reduce((best, e) =>
          e.currentHealth > best.currentHealth ? e : best
        );

      case TargetingStrategy.WEAKEST:
        // Lowest current health
        return enemies.reduce((best, e) =>
          e.currentHealth < best.currentHealth ? e : best
        );

      case TargetingStrategy.CLOSEST:
        // Closest to the point
        return enemies.reduce((best, e) => {
          const eDist = (e.x - x) ** 2 + (e.y - y) ** 2;
          const bestDist = (best.x - x) ** 2 + (best.y - y) ** 2;
          return eDist < bestDist ? e : best;
        });

      default:
        return enemies[0];
    }
  }

  /**
   * Clear all enemies.
   */
  clearAll(): void {
    for (const enemy of this.enemies.values()) {
      enemy.destroy();
    }
    this.enemies.clear();
  }

  /**
   * Get statistics.
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = {
      totalSpawned: 0,
      totalKilled: 0,
      totalLeaked: 0,
      totalDamageDealt: 0,
    };
  }

  // =========================================================================
  // EVENT SYSTEM
  // =========================================================================

  /**
   * Subscribe to an event.
   */
  on<T = unknown>(eventType: string, callback: GameEventCallback<T>): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback as GameEventCallback);
  }

  /**
   * Unsubscribe from an event.
   */
  off<T = unknown>(eventType: string, callback: GameEventCallback<T>): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback as GameEventCallback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event.
   */
  private emit<T>(type: string, data: T): void {
    const event: GameEvent<T> = {
      type: type as GameEvent<T>['type'],
      timestamp: Date.now(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  /**
   * Create an update callback for GameLoop integration.
   */
  createUpdateCallback(): (deltaTime: number) => void {
    return (deltaTime: number) => this.update(deltaTime);
  }
}
