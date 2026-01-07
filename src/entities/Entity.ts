import { Container, Graphics } from 'pixi.js';
import { Vector2D } from '../types';

/**
 * Base class for all game entities.
 *
 * Extends PixiJS Container to provide:
 * - Unique identification
 * - Active/inactive state management
 * - Velocity for movement
 * - Bounds for collision detection
 * - Standard update lifecycle
 *
 * Subclasses should override update() for custom behavior.
 */
export abstract class Entity extends Container {
  protected _id: string;
  protected _velocity: Vector2D = { x: 0, y: 0 };
  protected _isActive: boolean = true;
  protected _tags: Set<string> = new Set();
  protected _width: number = 0;
  protected _height: number = 0;
  protected graphics: Graphics;

  constructor(id: string) {
    super();
    this._id = id;
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  /**
   * Update the entity. Called each frame by the game loop.
   * @param deltaTime - Time since last frame in seconds (normalized)
   */
  abstract update(deltaTime: number): void;

  /**
   * Unique identifier for this entity.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Whether the entity is active and should be updated/rendered.
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Backward-compatible alias for _isActive used by combat system.
   */
  protected get _active(): boolean {
    return this._isActive;
  }

  protected set _active(value: boolean) {
    this._isActive = value;
  }

  /**
   * Backward-compatible alias for x position used by combat system.
   */
  protected get _x(): number {
    return this.x;
  }

  protected set _x(value: number) {
    this.x = value;
  }

  /**
   * Backward-compatible alias for y position used by combat system.
   */
  protected get _y(): number {
    return this.y;
  }

  protected set _y(value: number) {
    this.y = value;
  }

  /**
   * Returns the entity itself as a container reference.
   * This provides backward compatibility with code that expects a separate container property.
   */
  get container(): this {
    return this;
  }

  /**
   * Alias for isActive, used by combat system.
   */
  get active(): boolean {
    return this._isActive;
  }

  /**
   * Current velocity vector.
   */
  get velocity(): Vector2D {
    return { ...this._velocity };
  }

  /**
   * Entity width for collision detection.
   */
  get entityWidth(): number {
    return this._width;
  }

  /**
   * Entity height for collision detection.
   */
  get entityHeight(): number {
    return this._height;
  }

  /**
   * Set entity position.
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Set entity velocity.
   */
  setVelocity(x: number, y: number): void {
    this._velocity.x = x;
    this._velocity.y = y;
  }

  /**
   * Get position as Vector2D.
   */
  getPosition(): Vector2D {
    return { x: this.x, y: this.y };
  }

  /**
   * Get the bounding box for collision detection.
   * Note: Named getEntityBounds to avoid conflict with PixiJS Container.getBounds()
   */
  getEntityBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this._width / 2,
      y: this.y - this._height / 2,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Check if this entity's bounds intersect with another entity's bounds.
   * Uses AABB (Axis-Aligned Bounding Box) collision.
   */
  intersects(other: Entity): boolean {
    const a = this.getEntityBounds();
    const b = other.getEntityBounds();

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
  containsPoint(point: Vector2D): boolean {
    const bounds = this.getEntityBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  /**
   * Activate the entity.
   */
  activate(): void {
    this._isActive = true;
    this.visible = true;
  }

  /**
   * Deactivate the entity without destroying it.
   * Useful for object pooling.
   */
  deactivate(): void {
    this._isActive = false;
    this.visible = false;
  }

  /**
   * Add a tag to this entity for filtering/grouping.
   */
  addTag(tag: string): void {
    this._tags.add(tag);
  }

  /**
   * Remove a tag from this entity.
   */
  removeTag(tag: string): void {
    this._tags.delete(tag);
  }

  /**
   * Check if entity has a specific tag.
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag);
  }

  /**
   * Get all tags on this entity.
   */
  getTags(): string[] {
    return Array.from(this._tags);
  }

  /**
   * Calculate distance to another entity or point.
   */
  distanceTo(target: Entity | Vector2D): number {
    const tx = target.x;
    const ty = target.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate squared distance (faster, useful for comparisons).
   */
  distanceSquaredTo(target: Entity | Vector2D): number {
    const tx = target.x;
    const ty = target.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    return dx * dx + dy * dy;
  }

  /**
   * Clean up and destroy the entity.
   */
  destroy(): void {
    this._isActive = false;
    this._tags.clear();
    if (this.graphics) {
      this.graphics.destroy();
    }
    super.destroy({ children: true });
  }
}
