import { Projectile } from '../entities/Projectile';
import {
  DamageType,
  type ITarget,
  type DamageInfo,
  type CombatEvent,
  type CombatEventCallback,
  type CombatEventType,
  type Position,
} from '../types/combat';
import { ProjectileManager } from './ProjectileManager';

/**
 * Handles collision detection between projectiles and targets,
 * damage calculation, and combat event dispatching.
 */
export class CombatSystem {
  private projectileManager: ProjectileManager;
  private targets: Map<string, ITarget> = new Map();
  private eventListeners: Map<CombatEventType, Set<CombatEventCallback>> = new Map();

  constructor(projectileManager: ProjectileManager) {
    this.projectileManager = projectileManager;
  }

  // ============================================================================
  // Target Management
  // ============================================================================

  /**
   * Register a target that can receive damage.
   */
  registerTarget(target: ITarget): void {
    this.targets.set(target.id, target);
  }

  /**
   * Unregister a target.
   */
  unregisterTarget(targetId: string): void {
    this.targets.delete(targetId);
  }

  /**
   * Get all registered targets.
   */
  getTargets(): ITarget[] {
    return Array.from(this.targets.values());
  }

  /**
   * Get all alive targets.
   */
  getAliveTargets(): ITarget[] {
    return this.getTargets().filter(t => t.isAlive);
  }

  // ============================================================================
  // Collision Detection
  // ============================================================================

  /**
   * Update the combat system. Call every frame.
   * Checks for collisions and processes damage.
   */
  update(_deltaTime: number): void {
    const projectiles = this.projectileManager.getAll();
    const aliveTargets = this.getAliveTargets();

    for (const projectile of projectiles) {
      if (!projectile.isActive) continue;

      // Handle area damage projectiles differently
      if (projectile.hasAreaDamage && projectile.hasReachedTarget()) {
        this.processAreaDamage(projectile, aliveTargets);
        continue;
      }

      // Check direct collisions
      for (const target of aliveTargets) {
        if (!projectile.canHitTarget(target.id)) continue;

        if (this.checkCollision(projectile, target)) {
          this.processHit(projectile, target);

          // Stop checking if projectile is destroyed
          if (!projectile.isActive) break;
        }
      }
    }
  }

  /**
   * Check if a projectile collides with a target using AABB.
   */
  private checkCollision(projectile: Projectile, target: ITarget): boolean {
    const pBounds = projectile.getEntityBounds();
    const tBounds = target.getEntityBounds();

    return (
      pBounds.x < tBounds.x + tBounds.width &&
      pBounds.x + pBounds.width > tBounds.x &&
      pBounds.y < tBounds.y + tBounds.height &&
      pBounds.y + pBounds.height > tBounds.y
    );
  }

  /**
   * Check if a target is within radius of a position (for area damage).
   */
  private isInRadius(target: ITarget, center: Position, radius: number): boolean {
    const pos = target.getTargetPosition();
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  // ============================================================================
  // Damage Processing
  // ============================================================================

  /**
   * Process a direct hit between projectile and target.
   */
  private processHit(projectile: Projectile, target: ITarget): void {
    const damageInfo = projectile.getDamageInfo();
    const finalDamage = this.calculateDamage(damageInfo, target);

    // Apply damage
    target.takeDamage({
      ...damageInfo,
      amount: finalDamage,
    });

    // Register hit on projectile
    const continueFlying = projectile.registerHit(target.id);

    // Emit hit event
    this.emit({
      type: 'projectile_hit',
      position: projectile.getPosition(),
      damage: { ...damageInfo, amount: finalDamage },
      targetId: target.id,
      projectileType: projectile.type,
    });

    // Emit damage event
    this.emit({
      type: 'target_damaged',
      position: target.getTargetPosition(),
      damage: { ...damageInfo, amount: finalDamage },
      targetId: target.id,
    });

    // Check if target died
    if (!target.isAlive) {
      this.emit({
        type: 'target_killed',
        position: target.getTargetPosition(),
        targetId: target.id,
      });
      target.onDeath?.();
    }

    // Remove projectile if it can't continue
    if (!continueFlying) {
      projectile.deactivate();
    }
  }

  /**
   * Process area damage when a magic projectile reaches target.
   */
  private processAreaDamage(projectile: Projectile, targets: ITarget[]): void {
    const damageInfo = projectile.getDamageInfo();
    const center = projectile.getPosition();
    const radius = projectile.areaRadius;

    // Find all targets in radius
    const hitTargets = targets.filter(t =>
      this.isInRadius(t, center, radius) && projectile.canHitTarget(t.id)
    );

    // Damage each target (with falloff based on distance)
    for (const target of hitTargets) {
      const targetPos = target.getTargetPosition();
      const distance = Math.sqrt(
        (targetPos.x - center.x) ** 2 +
        (targetPos.y - center.y) ** 2
      );

      // Damage falls off linearly from center (100% at center, 50% at edge)
      const falloff = 1 - (distance / radius) * 0.5;
      const baseDamage = damageInfo.amount * falloff;
      const finalDamage = this.calculateDamage(
        { ...damageInfo, amount: baseDamage },
        target
      );

      target.takeDamage({
        ...damageInfo,
        amount: finalDamage,
      });

      projectile.registerHit(target.id);

      // Emit events
      this.emit({
        type: 'target_damaged',
        position: target.getTargetPosition(),
        damage: { ...damageInfo, amount: finalDamage },
        targetId: target.id,
      });

      if (!target.isAlive) {
        this.emit({
          type: 'target_killed',
          position: target.getTargetPosition(),
          targetId: target.id,
        });
        target.onDeath?.();
      }
    }

    // Emit area hit event
    this.emit({
      type: 'projectile_hit',
      position: center,
      projectileType: projectile.type,
    });

    // Area projectiles always expire after detonating
    projectile.deactivate();
  }

  /**
   * Calculate final damage after applying armor and modifiers.
   *
   * Damage types:
   * - Physical: Full armor reduction applied
   * - Magical: 30% armor penetration (ignores 30% of armor)
   * - True: Ignores all armor
   */
  calculateDamage(damageInfo: DamageInfo, target: ITarget): number {
    let damage = damageInfo.amount;

    // True damage ignores all armor
    if (damageInfo.type === DamageType.TRUE) {
      return Math.max(1, Math.round(damage));
    }

    // Calculate effective armor based on damage type
    let effectiveArmor = target.armor;

    // Magical damage ignores 30% of armor (armor penetration)
    if (damageInfo.type === DamageType.MAGICAL) {
      effectiveArmor = target.armor * 0.7;
    }

    // Armor formula: damage reduction = armor / (armor + 100)
    // At 100 armor, 50% reduction; at 200 armor, 66% reduction
    const reduction = effectiveArmor / (effectiveArmor + 100);
    damage = damage * (1 - reduction);

    // Minimum damage of 1
    return Math.max(1, Math.round(damage));
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to combat events.
   */
  on(eventType: CombatEventType, callback: CombatEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Unsubscribe from combat events.
   */
  off(eventType: CombatEventType, callback: CombatEventCallback): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit a combat event to all listeners.
   */
  private emit(event: CombatEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clear all targets and event listeners.
   */
  clear(): void {
    this.targets.clear();
    this.eventListeners.clear();
  }
}
