import { Container, FederatedPointerEvent } from 'pixi.js';
import { Grid } from './Grid';
import { PathManager } from './PathManager';
import { Tile } from './Tile';
import { MapConfig, TileType, GridPosition, WorldPosition } from './types';

export interface TileClickEvent {
  tile: Tile;
  gridPosition: GridPosition;
  worldPosition: WorldPosition;
  canBuild: boolean;
}

export type TileClickCallback = (event: TileClickEvent) => void;

export class GameMap extends Container {
  private grid: Grid;
  private pathManager: PathManager;
  private config: MapConfig;
  private tileClickCallbacks: TileClickCallback[] = [];
  private hoveredTile: Tile | null = null;

  constructor(config: MapConfig) {
    super();

    this.config = config;
    this.grid = new Grid(config.cols, config.rows, config.tileSize);
    this.pathManager = new PathManager(this.grid);

    this.addChild(this.grid);
    this.addChild(this.pathManager);

    this.applyMapConfig();
    this.setupInteraction();
  }

  private applyMapConfig(): void {
    const { tiles, path, spawnPoint, exitPoint } = this.config;

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        this.grid.setTileType(col, row, tiles[row][col]);
      }
    }

    this.grid.setTileType(spawnPoint.col, spawnPoint.row, TileType.SPAWN);
    this.grid.setTileType(exitPoint.col, exitPoint.row, TileType.EXIT);

    this.pathManager.setPath(path);
  }

  private setupInteraction(): void {
    this.eventMode = 'static';

    this.on('pointermove', this.onPointerMove, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerleave', this.onPointerLeave, this);
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    const localPos = this.toLocal(event.global);
    const gridPos = this.grid.worldToGrid(localPos.x, localPos.y);

    if (!gridPos) {
      if (this.hoveredTile) {
        this.hoveredTile.setHovered(false);
        this.hoveredTile = null;
      }
      return;
    }

    const tile = this.grid.getTileAt(gridPos);
    if (tile !== this.hoveredTile) {
      if (this.hoveredTile) {
        this.hoveredTile.setHovered(false);
      }
      if (tile) {
        tile.setHovered(true);
        this.hoveredTile = tile;
      }
    }
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    const localPos = this.toLocal(event.global);
    const gridPos = this.grid.worldToGrid(localPos.x, localPos.y);

    if (!gridPos) {
      return;
    }

    const tile = this.grid.getTileAt(gridPos);
    if (!tile) {
      return;
    }

    const clickEvent: TileClickEvent = {
      tile,
      gridPosition: gridPos,
      worldPosition: tile.getWorldCenter(),
      canBuild: tile.canBuild(),
    };

    for (const callback of this.tileClickCallbacks) {
      callback(clickEvent);
    }
  }

  private onPointerLeave(): void {
    if (this.hoveredTile) {
      this.hoveredTile.setHovered(false);
      this.hoveredTile = null;
    }
  }

  onTileClick(callback: TileClickCallback): void {
    this.tileClickCallbacks.push(callback);
  }

  offTileClick(callback: TileClickCallback): void {
    const index = this.tileClickCallbacks.indexOf(callback);
    if (index !== -1) {
      this.tileClickCallbacks.splice(index, 1);
    }
  }

  getGrid(): Grid {
    return this.grid;
  }

  getPathManager(): PathManager {
    return this.pathManager;
  }

  getConfig(): MapConfig {
    return this.config;
  }

  getTileAt(col: number, row: number): Tile | null {
    return this.grid.getTile(col, row);
  }

  worldToGrid(worldX: number, worldY: number): GridPosition | null {
    return this.grid.worldToGrid(worldX, worldY);
  }

  gridToWorld(col: number, row: number): WorldPosition {
    return this.grid.gridToWorld(col, row);
  }

  gridToWorldCenter(col: number, row: number): WorldPosition {
    return this.grid.gridToWorldCenter(col, row);
  }

  getBuildableTiles(): Tile[] {
    return this.grid.getBuildableTiles();
  }

  getSpawnPosition(): WorldPosition | null {
    return this.pathManager.getSpawnPosition();
  }

  getExitPosition(): WorldPosition | null {
    return this.pathManager.getExitPosition();
  }

  setDebugPathVisible(visible: boolean): void {
    this.pathManager.setDebugVisible(visible);
  }

  getWidth(): number {
    return this.grid.getWidth();
  }

  getHeight(): number {
    return this.grid.getHeight();
  }

  centerInContainer(containerWidth: number, containerHeight: number): void {
    this.position.set(
      (containerWidth - this.getWidth()) / 2,
      (containerHeight - this.getHeight()) / 2
    );
  }
}
