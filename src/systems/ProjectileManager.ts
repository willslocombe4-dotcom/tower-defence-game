import { Container } from 'pixi.js';
import { Projectile } from '../entities/Projectile';
import {
  ProjectileType,
  type Position,
  type ProjectileConfig,
  type ProjectileSpawnOptions,
} from '../types/combat';
import { PROJECTILE_CONFIGS } from '../types/combat';

export interface SpawnProjectileOptions {
  start: Position;
  target: Position;
  type?: ProjectileType;
  config?: Partial<ProjectileConfig>;
  sourceId?: string;
}

/**
 * Manages the lifecycle of all projectiles in the game.
 * Handles spawning, updating, and cleanup of projectiles.
 */
export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map();
  private container: Container;

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.label = 'projectiles';
    parentContainer.addChild(this.container);
  }

  // ============================================================================
  // Spawning
  // ============================================================================

  /**
   * Spawn a new projectile.
   * @param options - Configuration for the projectile
   * @returns The created projectile instance
   */
  spawn(options: SpawnProjectileOptions): Projectile {
    // Get base config for type, or default to BULLET
    const baseConfig =
      PROJECTILE_CONFIGS[options.type ?? 'bullet'] ??
      PROJECTILE_CONFIGS['bullet'];

    // Merge with any custom config overrides
    const finalConfig: ProjectileConfig = {
      ...baseConfig,
      ...options.config,
    };

    const projectile = new Projectile({
      startPosition: options.start,
      targetPosition: options.target,
      config: finalConfig,
      sourceId: options.sourceId,
    });

    this.projectiles.set(projectile.id, projectile);
    this.container.addChild(projectile);

    return projectile;
  }

  /**
   * Spawn projectile using full spawn options (alternative API).
   */
  spawnFromConfig(options: ProjectileSpawnOptions): Projectile {
    const projectile = new Projectile(options);
    this.projectiles.set(projectile.id, projectile);
    this.container.addChild(projectile);
    return projectile;
  }

  /**
   * Quick spawn helpers for common projectile types.
   */
  spawnBullet(start: Position, target: Position, sourceId?: string): Projectile {
    return this.spawn({ start, target, type: ProjectileType.BULLET, sourceId });
  }

  spawnArrow(start: Position, target: Position, sourceId?: string): Projectile {
    return this.spawn({ start, target, type: ProjectileType.ARROW, sourceId });
  }

  spawnMagic(start: Position, target: Position, sourceId?: string): Projectile {
    return this.spawn({ start, target, type: ProjectileType.MAGIC, sourceId });
  }

  // ============================================================================
  // Update & Lifecycle
  // ============================================================================

  /**
   * Update all projectiles. Call this every frame.
   * @param deltaTime - Normalized delta time
   */
  update(deltaTime: number): void {
    const expiredIds: string[] = [];

    for (const [id, projectile] of this.projectiles) {
      projectile.update(deltaTime);

      if (projectile.isExpired) {
        expiredIds.push(id);
      }
    }

    // Clean up expired projectiles
    for (const id of expiredIds) {
      this.remove(id);
    }
  }

  /**
   * Remove a specific projectile by ID.
   */
  remove(id: string): boolean {
    const projectile = this.projectiles.get(id);
    if (projectile) {
      this.container.removeChild(projectile);
      projectile.destroy();
      this.projectiles.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Remove a projectile instance.
   */
  removeProjectile(projectile: Projectile): boolean {
    return this.remove(projectile.id);
  }

  /**
   * Clear all projectiles.
   */
  clear(): void {
    for (const projectile of this.projectiles.values()) {
      projectile.destroy();
    }
    this.projectiles.clear();
    this.container.removeChildren();
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get all active projectiles.
   */
  getAll(): Projectile[] {
    return Array.from(this.projectiles.values());
  }

  /**
   * Get projectile by ID.
   */
  get(id: string): Projectile | undefined {
    return this.projectiles.get(id);
  }

  /**
   * Get count of active projectiles.
   */
  get count(): number {
    return this.projectiles.size;
  }

  /**
   * Get projectiles within a radius of a position.
   */
  getInRadius(center: Position, radius: number): Projectile[] {
    const result: Projectile[] = [];
    const radiusSq = radius * radius;

    for (const projectile of this.projectiles.values()) {
      const dx = projectile.x - center.x;
      const dy = projectile.y - center.y;
      if (dx * dx + dy * dy <= radiusSq) {
        result.push(projectile);
      }
    }

    return result;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Destroy the manager and all projectiles.
   */
  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
