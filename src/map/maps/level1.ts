import { MapConfig, TileType } from '../types';

const E = TileType.EMPTY;
const P = TileType.PATH;
const B = TileType.BUILDABLE;
const X = TileType.BLOCKED;

export const level1: MapConfig = {
  name: 'Level 1 - The Beginning',
  cols: 16,
  rows: 9,
  tileSize: 64,
  tiles: [
    [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
    [E, P, P, P, B, B, B, B, B, B, B, B, B, B, B, X],
    [E, B, B, P, B, B, B, B, B, B, B, B, B, B, B, X],
    [E, B, B, P, P, P, P, B, B, B, B, B, B, B, B, X],
    [E, B, B, B, B, B, P, B, B, B, P, P, P, P, P, E],
    [E, B, B, B, B, B, P, B, B, B, P, B, B, B, B, X],
    [E, B, B, B, B, B, P, P, P, P, P, B, B, B, B, X],
    [E, B, B, B, B, B, B, B, B, B, B, B, B, B, B, X],
    [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
  ],
  path: [
    { col: 0, row: 1 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 2 },
    { col: 3, row: 3 },
    { col: 4, row: 3 },
    { col: 5, row: 3 },
    { col: 6, row: 3 },
    { col: 6, row: 4 },
    { col: 6, row: 5 },
    { col: 6, row: 6 },
    { col: 7, row: 6 },
    { col: 8, row: 6 },
    { col: 9, row: 6 },
    { col: 10, row: 6 },
    { col: 10, row: 5 },
    { col: 10, row: 4 },
    { col: 11, row: 4 },
    { col: 12, row: 4 },
    { col: 13, row: 4 },
    { col: 14, row: 4 },
    { col: 15, row: 4 },
  ],
  spawnPoint: { col: 0, row: 1 },
  exitPoint: { col: 15, row: 4 },
};
