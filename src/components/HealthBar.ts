import { Container, Graphics } from 'pixi.js';

/**
 * Configuration options for HealthBar appearance.
 */
export interface HealthBarConfig {
  width: number;
  height: number;
  backgroundColor: number;
  foregroundColor: number;
  lowHealthColor: number;
  criticalHealthColor: number;
  borderColor: number;
  borderWidth: number;
  offsetY: number;
  showBorder: boolean;
  // Thresholds for color changes
  lowHealthThreshold: number;      // Percentage (0-1)
  criticalHealthThreshold: number; // Percentage (0-1)
}

/**
 * Default configuration values.
 */
export const DEFAULT_HEALTH_BAR_CONFIG: HealthBarConfig = {
  width: 30,
  height: 4,
  backgroundColor: 0x333333,
  foregroundColor: 0x00ff00,       // Green - healthy
  lowHealthColor: 0xffff00,        // Yellow - low
  criticalHealthColor: 0xff0000,   // Red - critical
  borderColor: 0x000000,
  borderWidth: 1,
  offsetY: -20,
  showBorder: true,
  lowHealthThreshold: 0.5,
  criticalHealthThreshold: 0.25,
};

/**
 * Visual health bar component for entities.
 *
 * Features:
 * - Configurable size and colors
 * - Automatic color change based on health percentage
 * - Smooth visual updates
 * - Can be attached to any Container
 *
 * Usage:
 * ```
 * const healthBar = new HealthBar(100);
 * enemy.addChild(healthBar);
 * healthBar.setHealth(75);
 * ```
 */
export class HealthBar extends Container {
  private background: Graphics;
  private foreground: Graphics;
  private border: Graphics;
  private config: HealthBarConfig;
  private _currentHealth: number;
  private _maxHealth: number;

  constructor(maxHealth: number, config: Partial<HealthBarConfig> = {}) {
    super();
    this.config = { ...DEFAULT_HEALTH_BAR_CONFIG, ...config };
    this._maxHealth = maxHealth;
    this._currentHealth = maxHealth;

    // Create graphics layers (order matters for rendering)
    this.border = new Graphics();
    this.background = new Graphics();
    this.foreground = new Graphics();

    this.addChild(this.border);
    this.addChild(this.background);
    this.addChild(this.foreground);

    // Position above parent
    this.y = this.config.offsetY;

    this.draw();
  }

  /**
   * Update current health and redraw.
   */
  setHealth(current: number, max?: number): void {
    this._currentHealth = Math.max(0, Math.min(current, this._maxHealth));
    if (max !== undefined && max > 0) {
      this._maxHealth = max;
      this._currentHealth = Math.min(this._currentHealth, max);
    }
    this.draw();
  }

  /**
   * Get current health percentage (0-1).
   */
  getHealthPercent(): number {
    return this._maxHealth > 0 ? this._currentHealth / this._maxHealth : 0;
  }

  /**
   * Redraw all graphics elements.
   */
  private draw(): void {
    const { width, height, backgroundColor, borderColor, borderWidth, showBorder } = this.config;
    const healthPercent = this.getHealthPercent();
    const foregroundWidth = width * healthPercent;
    const foregroundColor = this.getColorForHealth(healthPercent);

    // Clear all graphics
    this.border.clear();
    this.background.clear();
    this.foreground.clear();

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Draw border (if enabled)
    if (showBorder && borderWidth > 0) {
      this.border.rect(
        -halfWidth - borderWidth,
        -halfHeight - borderWidth,
        width + borderWidth * 2,
        height + borderWidth * 2
      );
      this.border.fill(borderColor);
    }

    // Draw background
    this.background.rect(-halfWidth, -halfHeight, width, height);
    this.background.fill(backgroundColor);

    // Draw foreground (health)
    if (foregroundWidth > 0) {
      this.foreground.rect(-halfWidth, -halfHeight, foregroundWidth, height);
      this.foreground.fill(foregroundColor);
    }
  }

  /**
   * Get the appropriate color based on health percentage.
   */
  private getColorForHealth(percent: number): number {
    const { foregroundColor, lowHealthColor, criticalHealthColor, lowHealthThreshold, criticalHealthThreshold } = this.config;

    if (percent <= criticalHealthThreshold) {
      return criticalHealthColor;
    } else if (percent <= lowHealthThreshold) {
      return lowHealthColor;
    }
    return foregroundColor;
  }

  /**
   * Update the configuration and redraw.
   */
  updateConfig(config: Partial<HealthBarConfig>): void {
    this.config = { ...this.config, ...config };
    this.y = this.config.offsetY;
    this.draw();
  }

  /**
   * Show or hide the health bar.
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  get currentHealth(): number {
    return this._currentHealth;
  }

  get maxHealth(): number {
    return this._maxHealth;
  }
}
