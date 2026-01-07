import { Enemy } from './Enemy';
import { ENEMY_CONFIGS } from '../../config/EnemyConfig';
import { EnemyType } from '../../types';

/**
 * Flying enemy type.
 *
 * Characteristics:
 * - Medium speed and health
 * - Ignores ground obstacles (can take shortcuts)
 * - Blue diamond shape with bobbing animation
 * - Best countered by anti-air towers
 *
 * Future enhancements:
 * - Different path for flying units
 * - Shadow effect on ground
 */
export class FlyingEnemy extends Enemy {
  private bobOffset: number = 0;
  private bobSpeed: number = 6;
  private bobAmplitude: number = 4;

  constructor(id: string) {
    super(id, ENEMY_CONFIGS[EnemyType.FLYING]);
    this.addTag('flying');
  }

  protected drawGraphics(): void {
    this.graphics.clear();

    const size = this.config.size;

    // Main body - diamond shape
    this.graphics.moveTo(0, -size);
    this.graphics.lineTo(size, 0);
    this.graphics.lineTo(0, size);
    this.graphics.lineTo(-size, 0);
    this.graphics.closePath();
    this.graphics.fill(this.config.color);

    // Inner highlight
    const innerSize = size * 0.5;
    this.graphics.moveTo(0, -innerSize);
    this.graphics.lineTo(innerSize, 0);
    this.graphics.lineTo(0, innerSize);
    this.graphics.lineTo(-innerSize, 0);
    this.graphics.closePath();
    this.graphics.fill(0x44aaff);

    // Outline
    this.graphics.moveTo(0, -size);
    this.graphics.lineTo(size, 0);
    this.graphics.lineTo(0, size);
    this.graphics.lineTo(-size, 0);
    this.graphics.closePath();
    this.graphics.stroke({ color: 0x0066cc, width: 2 });

    // Wings (small triangles on sides)
    // Left wing
    this.graphics.moveTo(-size, 0);
    this.graphics.lineTo(-size - 6, -4);
    this.graphics.lineTo(-size - 6, 4);
    this.graphics.closePath();
    this.graphics.fill(0x66bbff);

    // Right wing
    this.graphics.moveTo(size, 0);
    this.graphics.lineTo(size + 6, -4);
    this.graphics.lineTo(size + 6, 4);
    this.graphics.closePath();
    this.graphics.fill(0x66bbff);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    // Bobbing animation for flying effect
    this.bobOffset += this.bobSpeed * deltaTime;
    this.graphics.y = Math.sin(this.bobOffset) * this.bobAmplitude;
  }
}
