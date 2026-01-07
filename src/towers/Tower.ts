import { Container, Graphics } from 'pixi.js';
import {
  TowerType,
  TowerConfig,
  TowerStats,
  WorldPosition,
  GridPosition,
  TargetInfo,
  TargetingStrategy,
  TOWER_CONFIGS,
} from './types.js';

export class Tower extends Container {
  readonly id: string;
  readonly towerType: TowerType;
  readonly config: TowerConfig;
  readonly gridPosition: GridPosition;

  private baseGraphics: Graphics;
  private turretGraphics: Graphics;
  private rangeGraphics: Graphics;

  private currentTarget: TargetInfo | null = null;
  private attackCooldown: number = 0;
  private targetingStrategy: TargetingStrategy = 'first';

  private static idCounter: number = 0;

  constructor(
    towerType: TowerType,
    gridPosition: GridPosition,
    worldPosition: WorldPosition,
    tileSize: number = 64
  ) {
    super();

    this.id = `tower_${Tower.idCounter++}`;
    this.towerType = towerType;
    this.config = TOWER_CONFIGS[towerType];
    this.gridPosition = gridPosition;

    this.position.set(worldPosition.x, worldPosition.y);

    this.baseGraphics = new Graphics();
    this.turretGraphics = new Graphics();
    this.rangeGraphics = new Graphics();

    this.addChild(this.rangeGraphics);
    this.addChild(this.baseGraphics);
    this.addChild(this.turretGraphics);

    this.drawTower(tileSize);
    this.drawRangeIndicator();

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerenter', this.onPointerEnter, this);
    this.on('pointerleave', this.onPointerLeave, this);
  }

  private drawTower(tileSize: number): void {
    const centerOffset = tileSize / 2;
    const baseSize = tileSize * 0.7;
    const turretSize = tileSize * 0.3;

    // Draw base
    this.baseGraphics.clear();

    switch (this.towerType) {
      case TowerType.CANNON:
        this.drawCannonBase(centerOffset, baseSize);
        this.drawCannonTurret(centerOffset, turretSize);
        break;
      case TowerType.ARCHER:
        this.drawArcherBase(centerOffset, baseSize);
        this.drawArcherTurret(centerOffset, turretSize);
        break;
      case TowerType.MAGE:
        this.drawMageBase(centerOffset, baseSize);
        this.drawMageTurret(centerOffset, turretSize);
        break;
    }
  }

  private drawCannonBase(centerOffset: number, size: number): void {
    // Square base for cannon
    this.baseGraphics.rect(
      centerOffset - size / 2,
      centerOffset - size / 2,
      size,
      size
    );
    this.baseGraphics.fill({ color: 0x555555 });
    this.baseGraphics.stroke({ width: 2, color: 0x333333 });
  }

  private drawCannonTurret(centerOffset: number, size: number): void {
    // Circular cannon barrel mount
    this.turretGraphics.clear();
    this.turretGraphics.circle(centerOffset, centerOffset, size);
    this.turretGraphics.fill({ color: this.config.color });
    this.turretGraphics.stroke({ width: 2, color: 0x5c3317 });

    // Barrel
    this.turretGraphics.rect(centerOffset - 4, centerOffset - size - 10, 8, 15);
    this.turretGraphics.fill({ color: 0x444444 });
  }

  private drawArcherBase(centerOffset: number, size: number): void {
    // Octagonal tower base
    const radius = size / 2;
    const points: number[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
      points.push(
        centerOffset + Math.cos(angle) * radius,
        centerOffset + Math.sin(angle) * radius
      );
    }
    this.baseGraphics.poly(points);
    this.baseGraphics.fill({ color: 0x8b7355 });
    this.baseGraphics.stroke({ width: 2, color: 0x5c4a3d });
  }

  private drawArcherTurret(centerOffset: number, size: number): void {
    // Archer figure on top
    this.turretGraphics.clear();
    this.turretGraphics.circle(centerOffset, centerOffset - 5, size * 0.6);
    this.turretGraphics.fill({ color: this.config.color });

    // Bow
    this.turretGraphics.arc(
      centerOffset + 10,
      centerOffset - 5,
      12,
      -Math.PI / 2,
      Math.PI / 2
    );
    this.turretGraphics.stroke({ width: 2, color: 0x654321 });
  }

  private drawMageBase(centerOffset: number, size: number): void {
    // Circular mystical base
    this.baseGraphics.circle(centerOffset, centerOffset, size / 2);
    this.baseGraphics.fill({ color: 0x4a3c6e });
    this.baseGraphics.stroke({ width: 2, color: 0x2d2440 });

    // Inner rune circle
    this.baseGraphics.circle(centerOffset, centerOffset, size / 3);
    this.baseGraphics.stroke({ width: 1, color: 0x9932cc, alpha: 0.6 });
  }

  private drawMageTurret(centerOffset: number, size: number): void {
    // Crystal/orb on top
    this.turretGraphics.clear();
    this.turretGraphics.circle(centerOffset, centerOffset - 8, size * 0.8);
    this.turretGraphics.fill({ color: this.config.color, alpha: 0.8 });
    this.turretGraphics.stroke({ width: 2, color: 0xdda0dd });

    // Glow effect
    this.turretGraphics.circle(centerOffset, centerOffset - 8, size * 0.5);
    this.turretGraphics.fill({ color: 0xffffff, alpha: 0.3 });
  }

  private drawRangeIndicator(): void {
    this.rangeGraphics.clear();
    this.rangeGraphics.circle(32, 32, this.config.stats.range);
    this.rangeGraphics.fill({ color: 0xffffff, alpha: 0.1 });
    this.rangeGraphics.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
    this.rangeGraphics.visible = false;
  }

  private onPointerEnter(): void {
    this.setRangeVisible(true);
  }

  private onPointerLeave(): void {
    this.setRangeVisible(false);
  }

  setRangeVisible(visible: boolean): void {
    this.rangeGraphics.visible = visible;
  }

  get stats(): TowerStats {
    return this.config.stats;
  }

  get range(): number {
    return this.config.stats.range;
  }

  get worldCenter(): WorldPosition {
    return {
      x: this.position.x + 32,
      y: this.position.y + 32,
    };
  }

  setTargetingStrategy(strategy: TargetingStrategy): void {
    this.targetingStrategy = strategy;
  }

  getTargetingStrategy(): TargetingStrategy {
    return this.targetingStrategy;
  }

  update(deltaTime: number, potentialTargets: TargetInfo[]): TargetInfo | null {
    // Reduce attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Find targets in range
    const targetsInRange = this.findTargetsInRange(potentialTargets);

    if (targetsInRange.length === 0) {
      this.currentTarget = null;
      return null;
    }

    // Select target based on strategy
    this.currentTarget = this.selectTarget(targetsInRange);

    // Rotate turret towards target
    if (this.currentTarget) {
      this.rotateTurretToTarget(this.currentTarget);
    }

    // Attack if cooldown is ready
    if (this.attackCooldown <= 0 && this.currentTarget) {
      this.attackCooldown = 1 / this.config.stats.attackSpeed;
      return this.currentTarget; // Return target to signal attack
    }

    return null;
  }

  private findTargetsInRange(targets: TargetInfo[]): TargetInfo[] {
    const center = this.worldCenter;
    const rangeSquared = this.range * this.range;

    return targets.filter((target) => {
      const dx = target.position.x - center.x;
      const dy = target.position.y - center.y;
      return dx * dx + dy * dy <= rangeSquared;
    });
  }

  private selectTarget(targetsInRange: TargetInfo[]): TargetInfo {
    switch (this.targetingStrategy) {
      case 'first':
        // Target closest to exit (lowest distanceToExit)
        return targetsInRange.reduce((a, b) =>
          a.distanceToExit < b.distanceToExit ? a : b
        );

      case 'last':
        // Target farthest from exit (highest distanceToExit)
        return targetsInRange.reduce((a, b) =>
          a.distanceToExit > b.distanceToExit ? a : b
        );

      case 'closest':
        // Target closest to tower
        const center = this.worldCenter;
        return targetsInRange.reduce((a, b) => {
          const distA =
            Math.pow(a.position.x - center.x, 2) +
            Math.pow(a.position.y - center.y, 2);
          const distB =
            Math.pow(b.position.x - center.x, 2) +
            Math.pow(b.position.y - center.y, 2);
          return distA < distB ? a : b;
        });

      case 'strongest':
        // For now, just pick first - would need health info
        return targetsInRange[0];

      default:
        return targetsInRange[0];
    }
  }

  private rotateTurretToTarget(target: TargetInfo): void {
    const center = this.worldCenter;
    const angle = Math.atan2(
      target.position.y - center.y,
      target.position.x - center.x
    );

    // Rotate turret graphics - add PI/2 since turret points up by default
    this.turretGraphics.rotation = angle + Math.PI / 2;
  }

  isInRange(position: WorldPosition): boolean {
    const center = this.worldCenter;
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.range;
  }

  getCurrentTarget(): TargetInfo | null {
    return this.currentTarget;
  }

  destroy(): void {
    this.off('pointerenter', this.onPointerEnter, this);
    this.off('pointerleave', this.onPointerLeave, this);
    super.destroy({ children: true });
  }
}
