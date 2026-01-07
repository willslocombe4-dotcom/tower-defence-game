import { Container } from 'pixi.js';
import { Vector2D } from '../types';

/**
 * Base class for all game entities.
 *
 * Extends PixiJS Container to provide:
 * - Unique identification
 * - Active/inactive state management
 * - Velocity for movement
 * - Standard update lifecycle
 *
 * Subclasses should override update() for custom behavior.
 *
 * Future extensions:
 * - Add component system for modular behaviors
 * - Add collision bounds
 * - Add serialization support
 */
export abstract class Entity extends Container {
  protected _id: string;
  protected _velocity: Vector2D = { x: 0, y: 0 };
  protected _isActive: boolean = true;
  protected _tags: Set<string> = new Set();

  constructor(id: string) {
    super();
    this._id = id;
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
   * Current velocity vector.
   */
  get velocity(): Vector2D {
    return { ...this._velocity };
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
    super.destroy({ children: true });
  }
}
