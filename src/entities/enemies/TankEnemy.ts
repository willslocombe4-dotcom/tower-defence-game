import { Enemy } from './Enemy';
import { ENEMY_CONFIGS } from '../../config/EnemyConfig';
import { EnemyType } from '../../types';

/**
 * Tank enemy type.
 *
 * Characteristics:
 * - Slow speed, high health
 * - Large size, easy to hit
 * - Red square shape indicating toughness
 * - Best countered by high-damage single-target towers
 */
export class TankEnemy extends Enemy {
  constructor(id: string) {
    super(id, ENEMY_CONFIGS[EnemyType.TANK]);
  }

  protected drawGraphics(): void {
    this.graphics.clear();

    const size = this.config.size;

    // Main body - square/rectangle for tank appearance
    this.graphics.rect(-size, -size * 0.8, size * 2, size * 1.6);
    this.graphics.fill(this.config.color);

    // Armor plates (visual detail)
    this.graphics.rect(-size * 0.6, -size * 0.5, size * 1.2, size);
    this.graphics.fill(0xcc0000);

    // Outline
    this.graphics.rect(-size, -size * 0.8, size * 2, size * 1.6);
    this.graphics.stroke({ color: 0x880000, width: 3 });
  }
}
