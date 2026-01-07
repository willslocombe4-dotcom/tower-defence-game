import { Entity } from './Entity';
import type {
  Position,
  ProjectileConfig,
  ProjectileType,
  DamageInfo,
  DamageType,
} from '../types/combat';

export interface ProjectileOptions {
  startPosition: Position;
  targetPosition: Position;
  config: ProjectileConfig;
  sourceId?: string;
}

/**
 * Projectile entity that travels from start to target position.
 * Supports different types (bullet, arrow, magic) with configurable behavior.
 */
export class Projectile extends Entity {
  public readonly config: ProjectileConfig;
  public readonly sourceId: string | undefined;

  // Movement
  private readonly targetPosition: Position;
  private readonly directionX: number;
  private readonly directionY: number;
  private readonly maxDistance: number;
  private distanceTraveled: number = 0;

  // Combat state
  private hitCount: number = 0;
  private readonly hitTargetIds: Set<string> = new Set();

  constructor(options: ProjectileOptions) {
    super('projectile');

    this.config = options.config;
    this.sourceId = options.sourceId;
    this.targetPosition = { ...options.targetPosition };

    // Set initial position
    this.x = options.startPosition.x;
    this.y = options.startPosition.y;

    // Set size based on config
    this._width = this.config.size;
    this._height = this.config.size;

    // Calculate direction vector (normalized)
    const dx = options.targetPosition.x - options.startPosition.x;
    const dy = options.targetPosition.y - options.startPosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      this.directionX = dx / length;
      this.directionY = dy / length;
    } else {
      // Default direction if start == target
      this.directionX = 1;
      this.directionY = 0;
    }

    // Max distance is 1.5x the initial distance (allows some overshoot)
    this.maxDistance = length * 1.5;

    // Apply rotation based on direction (for arrow visual)
    this.container.rotation = Math.atan2(this.directionY, this.directionX);

    this.render();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get type(): ProjectileType {
    return this.config.type;
  }

  get damage(): number {
    return this.config.damage;
  }

  get speed(): number {
    return this.config.speed;
  }

  get pierceRemaining(): number {
    if (this.config.pierce === 0) return Infinity; // Area damage
    return this.config.pierce - this.hitCount;
  }

  get isExpired(): boolean {
    return this.distanceTraveled >= this.maxDistance || !this._active;
  }

  get hasAreaDamage(): boolean {
    return this.config.pierce === 0 && (this.config.areaRadius ?? 0) > 0;
  }

  get areaRadius(): number {
    return this.config.areaRadius ?? 0;
  }

  // ============================================================================
  // Combat Methods
  // ============================================================================

  /**
   * Get damage info for applying to targets.
   */
  getDamageInfo(): DamageInfo {
    const damageType = this.config.type === 'magic' ? 'magical' : 'physical';
    return {
      amount: this.config.damage,
      type: damageType as DamageType,
      sourceId: this.sourceId,
    };
  }

  /**
   * Check if this projectile can hit the specified target.
   * Prevents hitting the same target twice (for piercing projectiles).
   */
  canHitTarget(targetId: string): boolean {
    return !this.hitTargetIds.has(targetId) && this.pierceRemaining > 0;
  }

  /**
   * Register a hit on a target.
   * Returns false if projectile should be destroyed after this hit.
   */
  registerHit(targetId: string): boolean {
    this.hitTargetIds.add(targetId);
    this.hitCount++;

    // Check if projectile should continue (for piercing)
    return this.pierceRemaining > 0;
  }

  /**
   * Check if projectile has reached target area (for area damage).
   */
  hasReachedTarget(): boolean {
    const dist = this.distanceTo(this.targetPosition);
    return dist < this.config.speed * 2; // Within 2 frames of movement
  }

  // ============================================================================
  // Update & Render
  // ============================================================================

  update(deltaTime: number): void {
    if (!this._active) return;

    // Move in direction
    const moveDistance = this.config.speed * deltaTime;
    this.x += this.directionX * moveDistance;
    this.y += this.directionY * moveDistance;
    this.distanceTraveled += moveDistance;

    // Check if expired
    if (this.distanceTraveled >= this.maxDistance) {
      this._active = false;
    }
  }

  render(): void {
    this.graphics.clear();

    const { size, color, type } = this.config;

    switch (type) {
      case 'bullet':
        // Small circle
        this.graphics.circle(0, 0, size);
        this.graphics.fill({ color });
        break;

      case 'arrow':
        // Elongated shape pointing right (rotation handled by container)
        this.graphics.rect(-size, -size / 3, size * 2, size / 1.5);
        this.graphics.fill({ color });
        // Arrow head
        this.graphics.poly([
          { x: size, y: -size / 2 },
          { x: size + size / 2, y: 0 },
          { x: size, y: size / 2 },
        ]);
        this.graphics.fill({ color });
        break;

      case 'magic':
        // Glowing circle with outer ring
        this.graphics.circle(0, 0, size);
        this.graphics.fill({ color, alpha: 0.8 });
        this.graphics.circle(0, 0, size * 1.3);
        this.graphics.stroke({ color, width: 2, alpha: 0.4 });
        break;

      default:
        // Fallback: simple circle
        this.graphics.circle(0, 0, size);
        this.graphics.fill({ color });
    }
  }
}
