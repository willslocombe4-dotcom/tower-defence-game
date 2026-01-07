export enum TowerType {
  CANNON = 'cannon',
  ARCHER = 'archer',
  MAGE = 'mage',
}

export interface TowerStats {
  damage: number;
  range: number;
  attackSpeed: number; // attacks per second
  projectileSpeed: number;
  cost: number;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  description: string;
  stats: TowerStats;
  color: number; // fallback color when no sprite
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export interface TargetInfo {
  id: string;
  position: WorldPosition;
  distanceToExit: number;
}

export type TargetingStrategy = 'first' | 'last' | 'closest' | 'strongest';

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  [TowerType.CANNON]: {
    type: TowerType.CANNON,
    name: 'Cannon',
    description: 'High damage, slow attack speed. Deals splash damage.',
    stats: {
      damage: 50,
      range: 150,
      attackSpeed: 0.8,
      projectileSpeed: 400,
      cost: 100,
    },
    color: 0x8b4513, // brown
  },
  [TowerType.ARCHER]: {
    type: TowerType.ARCHER,
    name: 'Archer Tower',
    description: 'Fast attack speed, moderate damage. Long range.',
    stats: {
      damage: 15,
      range: 200,
      attackSpeed: 2.0,
      projectileSpeed: 600,
      cost: 75,
    },
    color: 0x228b22, // forest green
  },
  [TowerType.MAGE]: {
    type: TowerType.MAGE,
    name: 'Mage Tower',
    description: 'Magical attacks that slow enemies. Medium range.',
    stats: {
      damage: 25,
      range: 175,
      attackSpeed: 1.2,
      projectileSpeed: 500,
      cost: 125,
    },
    color: 0x9932cc, // purple
  },
};
