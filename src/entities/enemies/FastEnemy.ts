import { Enemy } from './Enemy';
import { ENEMY_CONFIGS } from '../../config/EnemyConfig';
import { EnemyType } from '../../types';

/**
 * Fast enemy type.
 *
 * Characteristics:
 * - High speed, low health
 * - Small size, harder to hit
 * - Green color with speed indicator
 * - Best countered by area damage or rapid-fire towers
 */
export class FastEnemy extends Enemy {
  constructor(id: string) {
    super(id, ENEMY_CONFIGS[EnemyType.FAST]);
  }

  protected drawGraphics(): void {
    this.graphics.clear();

    const size = this.config.size;

    // Main body - circle
    this.graphics.circle(0, 0, size);
    this.graphics.fill(this.config.color);

    // Speed indicator - small triangle pointing in movement direction
    this.graphics.moveTo(size + 4, 0);
    this.graphics.lineTo(size - 2, -4);
    this.graphics.lineTo(size - 2, 4);
    this.graphics.closePath();
    this.graphics.fill(this.config.color);

    // Outline
    this.graphics.circle(0, 0, size);
    this.graphics.stroke({ color: 0x008800, width: 2 });
  }
}
