import { Container } from 'pixi.js';
import { Tile } from './Tile';
import { TileType, GridPosition, WorldPosition } from './types';

export class Grid extends Container {
  private tiles: Tile[][] = [];
  private cols: number;
  private rows: number;
  private tileSize: number;

  constructor(cols: number, rows: number, tileSize: number) {
    super();

    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;

    this.createTiles();
  }

  private createTiles(): void {
    for (let row = 0; row < this.rows; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const tile = new Tile(col, row, this.tileSize, TileType.EMPTY);
        this.tiles[row][col] = tile;
        this.addChild(tile);
      }
    }
  }

  getTile(col: number, row: number): Tile | null {
    if (!this.isValidPosition(col, row)) {
      return null;
    }
    return this.tiles[row][col];
  }

  getTileAt(position: GridPosition): Tile | null {
    return this.getTile(position.col, position.row);
  }

  setTileType(col: number, row: number, type: TileType): boolean {
    const tile = this.getTile(col, row);
    if (!tile) {
      return false;
    }
    tile.setType(type);
    return true;
  }

  isValidPosition(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  worldToGrid(worldX: number, worldY: number): GridPosition | null {
    const col = Math.floor(worldX / this.tileSize);
    const row = Math.floor(worldY / this.tileSize);

    if (!this.isValidPosition(col, row)) {
      return null;
    }

    return { col, row };
  }

  gridToWorld(col: number, row: number): WorldPosition {
    return {
      x: col * this.tileSize,
      y: row * this.tileSize,
    };
  }

  gridToWorldCenter(col: number, row: number): WorldPosition {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  getBuildableTiles(): Tile[] {
    const buildable: Tile[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.tiles[row][col];
        if (tile.canBuild()) {
          buildable.push(tile);
        }
      }
    }
    return buildable;
  }

  getPathTiles(): Tile[] {
    const pathTiles: Tile[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.tiles[row][col];
        if (tile.isWalkable()) {
          pathTiles.push(tile);
        }
      }
    }
    return pathTiles;
  }

  getAllTiles(): Tile[][] {
    return this.tiles;
  }

  getCols(): number {
    return this.cols;
  }

  getRows(): number {
    return this.rows;
  }

  getTileSize(): number {
    return this.tileSize;
  }

  getWidth(): number {
    return this.cols * this.tileSize;
  }

  getHeight(): number {
    return this.rows * this.tileSize;
  }

  forEachTile(callback: (tile: Tile, col: number, row: number) => void): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        callback(this.tiles[row][col], col, row);
      }
    }
  }
}
