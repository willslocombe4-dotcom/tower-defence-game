import { Container, Graphics } from 'pixi.js';
import type { Position, Bounds } from '../types/combat';

let entityIdCounter = 0;

/**
 * Base class for all game entities.
 * Provides common functionality: position, bounds, lifecycle, and rendering.
 * Extend this class for specific entity types (Projectile, Enemy, Tower, etc.)
 */
export abstract class Entity {
  public readonly id: string;
  public container: Container;
  protected graphics: Graphics;

  protected _x: number = 0;
  protected _y: number = 0;
  protected _width: number = 0;
  protected _height: number = 0;
  protected _active: boolean = true;

  constructor(entityType: string = 'entity') {
    this.id = `${entityType}_${++entityIdCounter}`;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  // ============================================================================
  // Position Properties
  // ============================================================================

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this.container.x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this.container.y = value;
  }

  get position(): Position {
    return { x: this._x, y: this._y };
  }

  set position(pos: Position) {
    this.x = pos.x;
    this.y = pos.y;
  }

  // ============================================================================
  // Dimension Properties
  // ============================================================================

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  // ============================================================================
  // State Properties
  // ============================================================================

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    this._active = value;
    this.container.visible = value;
  }

  // ============================================================================
  // Core Methods
  // ============================================================================

  /**
   * Get the bounding box for collision detection.
   * Override for custom collision shapes.
   */
  getBounds(): Bounds {
    return {
      x: this._x - this._width / 2,
      y: this._y - this._height / 2,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Update the entity each frame.
   * @param deltaTime - Normalized delta time (1.0 = 60fps frame)
   */
  abstract update(deltaTime: number): void;

  /**
   * Render/draw the entity visuals.
   * Called once during initialization or when appearance changes.
   */
  abstract render(): void;

  /**
   * Set position in one call.
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Check if this entity's bounds intersect with another entity's bounds.
   * Uses AABB (Axis-Aligned Bounding Box) collision.
   */
  intersects(other: Entity): boolean {
    const a = this.getBounds();
    const b = other.getBounds();

    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Check if a point is inside this entity's bounds.
   */
  containsPoint(point: Position): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  /**
   * Calculate distance to another position.
   */
  distanceTo(target: Position): number {
    const dx = target.x - this._x;
    const dy = target.y - this._y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate distance to another entity (center to center).
   */
  distanceToEntity(other: Entity): number {
    return this.distanceTo(other.position);
  }

  /**
   * Clean up the entity and release resources.
   */
  destroy(): void {
    this._active = false;
    this.graphics.destroy();
    this.container.destroy({ children: true });
  }
}
