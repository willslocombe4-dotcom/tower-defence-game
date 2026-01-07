import { Graphics } from 'pixi.js';
import { Entity } from './Entity';
import type { ITarget, DamageInfo, Bounds, Position } from '../types/combat';

export interface EnemyConfig {
  maxHealth: number;
  armor: number;
  speed: number;
  size: number;
  color: number;
}

// Default enemy configurations - easy to extend with new enemy types
export const ENEMY_CONFIGS = {
  basic: {
    maxHealth: 100,
    armor: 0,
    speed: 1,
    size: 20,
    color: 0xff4444,
  },
  fast: {
    maxHealth: 50,
    armor: 0,
    speed: 2,
    size: 15,
    color: 0x44ff44,
  },
  tank: {
    maxHealth: 300,
    armor: 50,
    speed: 0.5,
    size: 30,
    color: 0x888888,
  },
  flying: {
    maxHealth: 80,
    armor: 10,
    speed: 1.5,
    size: 18,
    color: 0x44aaff,
  },
} as const;

export type EnemyType = keyof typeof ENEMY_CONFIGS;

/**
 * Enemy entity that can be damaged by projectiles.
 * Implements ITarget interface for combat system compatibility.
 */
export class Enemy extends Entity implements ITarget {
  public health: number;
  public maxHealth: number;
  public armor: number;
  public speed: number;

  private readonly color: number;
  private healthBarGraphics: Graphics | null = null;

  // Path following
  private path: Position[] = [];
  private pathIndex: number = 0;

  // Callbacks
  private _onDeath?: () => void;
  private flashTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(config: EnemyConfig) {
    super('enemy');

    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.armor = config.armor;
    this.speed = config.speed;
    this.color = config.color;

    this._width = config.size;
    this._height = config.size;

    this.render();
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  static create(type: EnemyType): Enemy {
    return new Enemy(ENEMY_CONFIGS[type]);
  }

  static createBasic(): Enemy {
    return Enemy.create('basic');
  }

  static createFast(): Enemy {
    return Enemy.create('fast');
  }

  static createTank(): Enemy {
    return Enemy.create('tank');
  }

  static createFlying(): Enemy {
    return Enemy.create('flying');
  }

  // ============================================================================
  // ITarget Implementation
  // ============================================================================

  getTargetPosition(): Position {
    return { x: this.x, y: this.y };
  }

  get isAlive(): boolean {
    return this.health > 0 && this.isActive;
  }

  takeDamage(damage: DamageInfo): void {
    if (!this.isAlive) return;

    this.health = Math.max(0, this.health - damage.amount);
    this.updateHealthBar();

    // Flash red briefly
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.tint = 0xff0000;
      this.flashTimeoutId = setTimeout(() => {
        if (this.graphics && !this.graphics.destroyed) {
          this.graphics.tint = 0xffffff;
        }
        this.flashTimeoutId = undefined;
      }, 100);
    }

    if (this.health <= 0) {
      this.deactivate();
    }
  }

  getEntityBounds(): Bounds {
    return {
      x: this.x - this._width / 2,
      y: this.y - this._height / 2,
      width: this._width,
      height: this._height,
    };
  }

  set onDeath(callback: (() => void) | undefined) {
    this._onDeath = callback;
  }

  get onDeath(): (() => void) | undefined {
    return this._onDeath;
  }

  // ============================================================================
  // Path Following
  // ============================================================================

  /**
   * Set the path for this enemy to follow.
   */
  setPath(path: Position[]): void {
    this.path = path;
    this.pathIndex = 0;
    if (path.length > 0) {
      this.setPosition(path[0].x, path[0].y);
    }
  }

  /**
   * Check if enemy has reached the end of its path.
   */
  hasReachedEnd(): boolean {
    return this.pathIndex >= this.path.length;
  }

  /**
   * Get current path progress (0 to 1).
   */
  getPathProgress(): number {
    if (this.path.length === 0) return 0;
    return this.pathIndex / this.path.length;
  }

  // ============================================================================
  // Update & Render
  // ============================================================================

  update(deltaTime: number): void {
    if (!this.isActive || this.path.length === 0) return;

    // Move toward current path point
    if (this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.speed * deltaTime * 2) {
        // Reached waypoint, move to next
        this.pathIndex++;
      } else {
        // Move toward waypoint
        const moveX = (dx / dist) * this.speed * deltaTime;
        const moveY = (dy / dist) * this.speed * deltaTime;
        this.x += moveX;
        this.y += moveY;
      }
    }
  }

  render(): void {
    this.graphics.clear();

    const halfSize = this._width / 2;

    // Body (circle)
    this.graphics.circle(0, 0, halfSize);
    this.graphics.fill({ color: this.color });

    // Border
    this.graphics.circle(0, 0, halfSize);
    this.graphics.stroke({ color: 0x000000, width: 2 });

    // Create health bar
    this.createHealthBar();
  }

  private createHealthBar(): void {
    if (this.healthBarGraphics) {
      this.removeChild(this.healthBarGraphics);
      this.healthBarGraphics.destroy();
    }

    this.healthBarGraphics = new Graphics();
    this.addChild(this.healthBarGraphics);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    if (!this.healthBarGraphics) return;

    this.healthBarGraphics.clear();

    const barWidth = this._width + 10;
    const barHeight = 4;
    const barY = -this._height / 2 - 8;

    // Background
    this.healthBarGraphics.rect(-barWidth / 2, barY, barWidth, barHeight);
    this.healthBarGraphics.fill({ color: 0x333333 });

    // Health fill
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffaa00 : 0xff4444;
    this.healthBarGraphics.rect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
    this.healthBarGraphics.fill({ color: healthColor });

    // Border
    this.healthBarGraphics.rect(-barWidth / 2, barY, barWidth, barHeight);
    this.healthBarGraphics.stroke({ color: 0x000000, width: 1 });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
      this.flashTimeoutId = undefined;
    }
    if (this.healthBarGraphics) {
      this.healthBarGraphics.destroy();
      this.healthBarGraphics = null;
    }
    super.destroy();
  }
}
