import { Graphics } from 'pixi.js';
import { Entity } from '../Entity';
import { HealthBar } from '../../components/HealthBar';
import { EnemyConfig, Waypoint, EnemyState, EnemyType } from '../../types';

/**
 * Base class for all enemy types.
 *
 * Provides:
 * - Path-following movement
 * - Health management with visual health bar
 * - Placeholder graphics (override drawGraphics for custom visuals)
 * - State export for external systems
 *
 * Subclasses should:
 * - Override drawGraphics() for custom appearance
 * - Override update() for special behaviors (call super.update())
 * - Override onDeath() for death effects
 *
 * Future extensions:
 * - Status effects system (slow, poison, stun)
 * - Armor/resistance system
 * - Sprite-based rendering
 * - Animation support
 */
export abstract class Enemy extends Entity {
  protected config: EnemyConfig;
  protected healthBar: HealthBar;
  protected graphics: Graphics;

  // Health
  protected _currentHealth: number;

  // Path following
  protected waypoints: Waypoint[] = [];
  protected currentWaypointIndex: number = 0;
  protected totalPathLength: number = 0;
  protected distanceTraveled: number = 0;

  // State flags
  protected _hasReachedEnd: boolean = false;

  constructor(id: string, config: EnemyConfig) {
    super(id);
    this.config = config;
    this._currentHealth = config.maxHealth;

    // Add enemy tag for filtering
    this.addTag('enemy');
    this.addTag(config.type);

    // Create graphics container
    this.graphics = new Graphics();
    this.drawGraphics();
    this.addChild(this.graphics);

    // Create health bar
    this.healthBar = new HealthBar(config.maxHealth, {
      width: config.size * 2,
      offsetY: -config.size - 10,
    });
    this.addChild(this.healthBar);
  }

  /**
   * Draw the enemy's visual representation.
   * Override in subclasses for custom shapes.
   */
  protected drawGraphics(): void {
    this.graphics.clear();

    // Default: simple circle
    this.graphics.circle(0, 0, this.config.size);
    this.graphics.fill(this.config.color);
    this.graphics.circle(0, 0, this.config.size);
    this.graphics.stroke({ color: 0x000000, width: 2 });
  }

  /**
   * Set the path for this enemy to follow.
   */
  setPath(waypoints: Waypoint[]): void {
    this.waypoints = [...waypoints];
    this.currentWaypointIndex = 0;
    this.distanceTraveled = 0;
    this._hasReachedEnd = false;
    this.totalPathLength = this.calculateTotalPathLength();

    // Start at first waypoint
    if (waypoints.length > 0) {
      this.x = waypoints[0].x;
      this.y = waypoints[0].y;
    }
  }

  /**
   * Calculate the total length of the path.
   */
  private calculateTotalPathLength(): number {
    let length = 0;
    for (let i = 1; i < this.waypoints.length; i++) {
      const dx = this.waypoints[i].x - this.waypoints[i - 1].x;
      const dy = this.waypoints[i].y - this.waypoints[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Update the enemy each frame.
   */
  update(deltaTime: number): void {
    if (!this._isActive || this._hasReachedEnd) return;

    this.moveAlongPath(deltaTime);
  }

  /**
   * Move along the waypoint path.
   */
  protected moveAlongPath(deltaTime: number): void {
    if (this.waypoints.length === 0) return;
    if (this.currentWaypointIndex >= this.waypoints.length - 1) {
      this._hasReachedEnd = true;
      return;
    }

    const target = this.waypoints[this.currentWaypointIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    // Calculate movement for this frame
    const moveDistance = this.config.speed * deltaTime;

    // Check if we'll reach or pass the waypoint
    if (distanceToTarget <= moveDistance) {
      // Move to waypoint and advance
      this.x = target.x;
      this.y = target.y;
      this.distanceTraveled += distanceToTarget;
      this.currentWaypointIndex++;

      // If there's remaining movement and more waypoints, continue
      const remainingMove = moveDistance - distanceToTarget;
      if (remainingMove > 0 && this.currentWaypointIndex < this.waypoints.length - 1) {
        // Recursively move remaining distance (simplified for one step)
        const nextDx = this.waypoints[this.currentWaypointIndex + 1].x - this.x;
        const nextDy = this.waypoints[this.currentWaypointIndex + 1].y - this.y;
        const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
        if (nextDist > 0) {
          const ratio = remainingMove / nextDist;
          this.x += nextDx * ratio;
          this.y += nextDy * ratio;
          this.distanceTraveled += remainingMove;
        }
      }
    } else {
      // Move toward waypoint
      const ratio = moveDistance / distanceToTarget;
      this.x += dx * ratio;
      this.y += dy * ratio;
      this.distanceTraveled += moveDistance;
    }

    // Update rotation to face movement direction
    if (distanceToTarget > 0) {
      this.graphics.rotation = Math.atan2(dy, dx);
    }
  }

  /**
   * Apply damage to this enemy.
   * @returns true if the enemy died from this damage
   */
  takeDamage(amount: number, source?: string): boolean {
    if (!this._isActive || this._currentHealth <= 0) return false;

    this._currentHealth = Math.max(0, this._currentHealth - amount);
    this.healthBar.setHealth(this._currentHealth);

    // Visual feedback
    this.onDamaged(amount, source);

    if (this._currentHealth <= 0) {
      this.onDeath();
      return true;
    }

    return false;
  }

  /**
   * Heal this enemy.
   */
  heal(amount: number): void {
    if (!this._isActive) return;
    this._currentHealth = Math.min(this.config.maxHealth, this._currentHealth + amount);
    this.healthBar.setHealth(this._currentHealth);
  }

  /**
   * Called when the enemy takes damage.
   * Override for visual effects.
   */
  protected onDamaged(_amount: number, _source?: string): void {
    // Flash effect - brief alpha change
    this.alpha = 0.5;
    // Reset after short delay (simplified - in production use tweens)
    setTimeout(() => {
      if (this._isActive) this.alpha = 1;
    }, 50);
  }

  /**
   * Called when the enemy dies.
   * Override for death effects.
   */
  protected onDeath(): void {
    this._isActive = false;
    // Could add death animation here
  }

  /**
   * Get the enemy's current state.
   */
  getState(): EnemyState {
    return {
      id: this._id,
      type: this.config.type,
      position: { x: this.x, y: this.y },
      health: this._currentHealth,
      maxHealth: this.config.maxHealth,
      isAlive: this._isActive && this._currentHealth > 0,
      pathProgress: this.getPathProgress(),
    };
  }

  /**
   * Get progress along path (0-1).
   */
  getPathProgress(): number {
    if (this.totalPathLength <= 0) return 0;
    return Math.min(1, this.distanceTraveled / this.totalPathLength);
  }

  /**
   * Check if the enemy has reached the end of the path.
   */
  hasReachedEnd(): boolean {
    return this._hasReachedEnd;
  }

  // Getters for config values
  get type(): EnemyType {
    return this.config.type;
  }

  get currentHealth(): number {
    return this._currentHealth;
  }

  get maxHealth(): number {
    return this.config.maxHealth;
  }

  get speed(): number {
    return this.config.speed;
  }

  get goldReward(): number {
    return this.config.goldReward;
  }

  get damageToBase(): number {
    return this.config.damageToBase;
  }

  get ignoresObstacles(): boolean {
    return this.config.ignoresObstacles;
  }

  get size(): number {
    return this.config.size;
  }
}
