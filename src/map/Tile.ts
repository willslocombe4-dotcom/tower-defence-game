import { Graphics, Container } from 'pixi.js';
import {
  TileType,
  TileConfig,
  GridPosition,
  WorldPosition,
  TILE_CONFIGS,
  TILE_COLORS,
} from './types';

export class Tile extends Container {
  private graphics: Graphics;
  private tileConfig: TileConfig;
  private gridPos: GridPosition;
  private tileSize: number;
  private hasTower: boolean = false;
  private hovered: boolean = false;

  constructor(
    col: number,
    row: number,
    tileSize: number,
    type: TileType = TileType.EMPTY
  ) {
    super();

    this.gridPos = { col, row };
    this.tileSize = tileSize;
    this.tileConfig = { ...TILE_CONFIGS[type] };
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    this.position.set(col * tileSize, row * tileSize);

    this.eventMode = 'static';
    this.cursor = this.tileConfig.buildable ? 'pointer' : 'default';

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    const color = TILE_COLORS[this.tileConfig.type];
    const borderColor = this.hovered && this.canBuild() ? 0xffff00 : 0x1a1a2e;
    const borderWidth = this.hovered && this.canBuild() ? 2 : 1;

    this.graphics.rect(0, 0, this.tileSize, this.tileSize);
    this.graphics.fill({ color });
    this.graphics.stroke({ color: borderColor, width: borderWidth });

    if (this.tileConfig.type === TileType.SPAWN) {
      this.drawSpawnIndicator();
    } else if (this.tileConfig.type === TileType.EXIT) {
      this.drawExitIndicator();
    }
  }

  private drawSpawnIndicator(): void {
    const centerX = this.tileSize / 2;
    const centerY = this.tileSize / 2;
    const radius = this.tileSize / 4;

    this.graphics.circle(centerX, centerY, radius);
    this.graphics.fill({ color: 0xff6666 });
  }

  private drawExitIndicator(): void {
    const centerX = this.tileSize / 2;
    const centerY = this.tileSize / 2;
    const radius = this.tileSize / 4;

    this.graphics.circle(centerX, centerY, radius);
    this.graphics.fill({ color: 0x66ff66 });
  }

  setType(type: TileType): void {
    this.tileConfig = { ...TILE_CONFIGS[type] };
    this.cursor = this.tileConfig.buildable ? 'pointer' : 'default';
    this.draw();
  }

  getType(): TileType {
    return this.tileConfig.type;
  }

  isWalkable(): boolean {
    return this.tileConfig.walkable;
  }

  isBuildable(): boolean {
    return this.tileConfig.buildable;
  }

  canBuild(): boolean {
    return this.tileConfig.buildable && !this.hasTower;
  }

  placeTower(): boolean {
    if (!this.canBuild()) {
      return false;
    }
    this.hasTower = true;
    this.draw();
    return true;
  }

  removeTower(): void {
    this.hasTower = false;
    this.draw();
  }

  hasTowerPlaced(): boolean {
    return this.hasTower;
  }

  getGridPosition(): GridPosition {
    return { ...this.gridPos };
  }

  getWorldCenter(): WorldPosition {
    return {
      x: this.gridPos.col * this.tileSize + this.tileSize / 2,
      y: this.gridPos.row * this.tileSize + this.tileSize / 2,
    };
  }

  getWorldPosition(): WorldPosition {
    return {
      x: this.gridPos.col * this.tileSize,
      y: this.gridPos.row * this.tileSize,
    };
  }

  setHovered(hovered: boolean): void {
    if (this.hovered !== hovered) {
      this.hovered = hovered;
      this.draw();
    }
  }

  getTileSize(): number {
    return this.tileSize;
  }
}
