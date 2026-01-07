import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EffectType, type Position, type EffectConfig } from '../types/combat';

interface ActiveEffect {
  id: number;
  type: EffectType;
  container: Container;
  elapsed: number;
  duration: number;
  update: (progress: number) => void;
}

let effectIdCounter = 0;

/**
 * Manages visual effects for combat (hit sparks, death explosions, damage numbers).
 * Effects are temporary and auto-cleanup after their duration.
 */
export class EffectsManager {
  private container: Container;
  private activeEffects: Map<number, ActiveEffect> = new Map();

  // Configuration - easy to tweak
  private readonly defaultDurations: Record<EffectType, number> = {
    hit: 200,
    death: 500,
    damage_number: 800,
    area_indicator: 300,
  };

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.label = 'effects';
    parentContainer.addChild(this.container);
  }

  // ============================================================================
  // Effect Creation
  // ============================================================================

  /**
   * Play a hit effect (spark/flash on impact).
   */
  playHitEffect(position: Position, color: number = 0xffffff): void {
    const graphics = new Graphics();
    const effectContainer = new Container();
    effectContainer.addChild(graphics);
    effectContainer.position.set(position.x, position.y);

    const effect = this.createEffect(EffectType.HIT, effectContainer, (progress) => {
      const scale = 1 + progress * 0.5;
      const alpha = 1 - progress;

      graphics.clear();
      graphics.circle(0, 0, 8 * scale);
      graphics.fill({ color, alpha });

      // Inner bright core
      graphics.circle(0, 0, 4 * scale);
      graphics.fill({ color: 0xffffff, alpha: alpha * 0.8 });
    });

    // Initial render
    effect.update(0);
  }

  /**
   * Play a death effect (explosion/particle burst).
   */
  playDeathEffect(position: Position, color: number = 0xff4444): void {
    const effectContainer = new Container();
    effectContainer.position.set(position.x, position.y);

    // Create particles
    const particleCount = 8;
    const particles: { graphics: Graphics; vx: number; vy: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      const graphics = new Graphics();

      // Random particle size
      const size = 3 + Math.random() * 4;
      graphics.circle(0, 0, size);
      graphics.fill({ color });

      effectContainer.addChild(graphics);
      particles.push({
        graphics,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }

    this.createEffect(EffectType.DEATH, effectContainer, (progress) => {
      const alpha = 1 - progress;
      const scale = 1 - progress * 0.5;

      for (const particle of particles) {
        // Move outward
        particle.graphics.x += particle.vx * 0.016 * (1 - progress);
        particle.graphics.y += particle.vy * 0.016 * (1 - progress);
        particle.graphics.alpha = alpha;
        particle.graphics.scale.set(scale);
      }
    });
  }

  /**
   * Play floating damage number.
   */
  playDamageNumber(
    position: Position,
    amount: number,
    isCritical: boolean = false
  ): void {
    const effectContainer = new Container();
    effectContainer.position.set(position.x, position.y);

    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: isCritical ? 20 : 14,
      fontWeight: 'bold',
      fill: isCritical ? 0xffff00 : 0xffffff,
      stroke: { color: 0x000000, width: 3 },
    });

    const text = new Text({
      text: isCritical ? `${amount}!` : String(amount),
      style,
    });
    text.anchor.set(0.5, 0.5);

    effectContainer.addChild(text);

    const startY = position.y;
    const floatDistance = 40;

    this.createEffect(EffectType.DAMAGE_NUMBER, effectContainer, (progress) => {
      // Float upward with easing
      const eased = 1 - Math.pow(1 - progress, 2);
      effectContainer.y = startY - floatDistance * eased;

      // Fade out in second half
      if (progress > 0.5) {
        text.alpha = 1 - (progress - 0.5) * 2;
      }

      // Scale pop on critical
      if (isCritical && progress < 0.2) {
        const popScale = 1 + Math.sin(progress * Math.PI * 5) * 0.3;
        text.scale.set(popScale);
      }
    });
  }

  /**
   * Play area indicator (circle showing area of effect).
   */
  playAreaIndicator(position: Position, radius: number, color: number = 0x9933ff): void {
    const graphics = new Graphics();
    const effectContainer = new Container();
    effectContainer.addChild(graphics);
    effectContainer.position.set(position.x, position.y);

    this.createEffect(EffectType.AREA_INDICATOR, effectContainer, (progress) => {
      graphics.clear();

      // Expanding ring
      const currentRadius = radius * (0.3 + progress * 0.7);
      const alpha = 0.6 * (1 - progress);

      // Fill
      graphics.circle(0, 0, currentRadius);
      graphics.fill({ color, alpha: alpha * 0.3 });

      // Ring
      graphics.circle(0, 0, currentRadius);
      graphics.stroke({ color, width: 3, alpha });
    });

    // Initial render
    const effect = this.activeEffects.get(effectIdCounter);
    effect?.update(0);
  }

  /**
   * Generic effect creation from config.
   */
  playEffect(config: EffectConfig): void {
    switch (config.type) {
      case 'hit':
        this.playHitEffect(config.position, config.color);
        break;
      case 'death':
        this.playDeathEffect(config.position, config.color);
        break;
      case 'damage_number':
        this.playDamageNumber(config.position, config.value ?? 0);
        break;
      case 'area_indicator':
        this.playAreaIndicator(
          config.position,
          config.radius ?? 50,
          config.color
        );
        break;
    }
  }

  // ============================================================================
  // Effect Management
  // ============================================================================

  /**
   * Create and register an effect.
   */
  private createEffect(
    type: EffectType,
    effectContainer: Container,
    updateFn: (progress: number) => void
  ): ActiveEffect {
    const id = ++effectIdCounter;
    const duration = this.defaultDurations[type];

    this.container.addChild(effectContainer);

    const effect: ActiveEffect = {
      id,
      type,
      container: effectContainer,
      elapsed: 0,
      duration,
      update: updateFn,
    };

    this.activeEffects.set(id, effect);
    return effect;
  }

  /**
   * Update all active effects. Call every frame.
   * @param deltaTime - Normalized delta time (1.0 = 60fps frame)
   */
  update(deltaTime: number): void {
    const frameMs = deltaTime * (1000 / 60); // Convert to milliseconds
    const toRemove: number[] = [];

    for (const [id, effect] of this.activeEffects) {
      effect.elapsed += frameMs;
      const progress = Math.min(1, effect.elapsed / effect.duration);

      effect.update(progress);

      if (progress >= 1) {
        toRemove.push(id);
      }
    }

    // Cleanup finished effects
    for (const id of toRemove) {
      this.removeEffect(id);
    }
  }

  /**
   * Remove an effect immediately.
   */
  private removeEffect(id: number): void {
    const effect = this.activeEffects.get(id);
    if (effect) {
      this.container.removeChild(effect.container);
      effect.container.destroy({ children: true });
      this.activeEffects.delete(id);
    }
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get count of active effects.
   */
  get count(): number {
    return this.activeEffects.size;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clear all effects.
   */
  clear(): void {
    for (const effect of this.activeEffects.values()) {
      effect.container.destroy({ children: true });
    }
    this.activeEffects.clear();
    this.container.removeChildren();
  }

  /**
   * Destroy the manager.
   */
  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
