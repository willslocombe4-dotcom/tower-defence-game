export enum TileType {
  EMPTY = 'empty',
  PATH = 'path',
  BUILDABLE = 'buildable',
  BLOCKED = 'blocked',
  SPAWN = 'spawn',
  EXIT = 'exit',
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export interface TileConfig {
  type: TileType;
  walkable: boolean;
  buildable: boolean;
}

export interface PathWaypoint extends GridPosition {
  index: number;
}

export interface MapConfig {
  name: string;
  cols: number;
  rows: number;
  tileSize: number;
  tiles: TileType[][];
  path: GridPosition[];
  spawnPoint: GridPosition;
  exitPoint: GridPosition;
}

export const TILE_CONFIGS: Record<TileType, TileConfig> = {
  [TileType.EMPTY]: {
    type: TileType.EMPTY,
    walkable: false,
    buildable: false,
  },
  [TileType.PATH]: {
    type: TileType.PATH,
    walkable: true,
    buildable: false,
  },
  [TileType.BUILDABLE]: {
    type: TileType.BUILDABLE,
    walkable: false,
    buildable: true,
  },
  [TileType.BLOCKED]: {
    type: TileType.BLOCKED,
    walkable: false,
    buildable: false,
  },
  [TileType.SPAWN]: {
    type: TileType.SPAWN,
    walkable: true,
    buildable: false,
  },
  [TileType.EXIT]: {
    type: TileType.EXIT,
    walkable: true,
    buildable: false,
  },
};

export const TILE_COLORS: Record<TileType, number> = {
  [TileType.EMPTY]: 0x2d2d44,
  [TileType.PATH]: 0x8b7355,
  [TileType.BUILDABLE]: 0x3d5c3d,
  [TileType.BLOCKED]: 0x1a1a1a,
  [TileType.SPAWN]: 0xcc4444,
  [TileType.EXIT]: 0x44cc44,
};
