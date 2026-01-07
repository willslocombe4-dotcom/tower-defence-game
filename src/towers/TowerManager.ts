import { Container } from 'pixi.js';
import { Tower } from './Tower.js';
import {
  TowerType,
  GridPosition,
  WorldPosition,
  TargetInfo,
  TOWER_CONFIGS,
} from './types.js';

export type TowerPlacedCallback = (tower: Tower) => void;
export type TowerRemovedCallback = (tower: Tower) => void;
export type TowerAttackCallback = (tower: Tower, target: TargetInfo) => void;

export interface TowerManagerConfig {
  tileSize: number;
  gridToWorldCenter: (col: number, row: number) => WorldPosition;
  canPlaceTower: (col: number, row: number) => boolean;
}

export class TowerManager {
  private container: Container;
  private towers: Map<string, Tower> = new Map();
  private towersByGrid: Map<string, Tower> = new Map();
  private config: TowerManagerConfig;

  private onTowerPlacedCallbacks: TowerPlacedCallback[] = [];
  private onTowerRemovedCallbacks: TowerRemovedCallback[] = [];
  private onTowerAttackCallbacks: TowerAttackCallback[] = [];

  constructor(config: TowerManagerConfig) {
    this.config = config;
    this.container = new Container();
  }

  getContainer(): Container {
    return this.container;
  }

  placeTower(towerType: TowerType, gridPosition: GridPosition): Tower | null {
    const gridKey = this.getGridKey(gridPosition);

    // Check if position already has a tower
    if (this.towersByGrid.has(gridKey)) {
      console.warn(`Tower already exists at grid position (${gridPosition.col}, ${gridPosition.row})`);
      return null;
    }

    // Check if placement is allowed
    if (!this.config.canPlaceTower(gridPosition.col, gridPosition.row)) {
      console.warn(`Cannot place tower at grid position (${gridPosition.col}, ${gridPosition.row})`);
      return null;
    }

    // Get world position (top-left of tile)
    const worldCenter = this.config.gridToWorldCenter(gridPosition.col, gridPosition.row);
    const worldPosition: WorldPosition = {
      x: worldCenter.x - this.config.tileSize / 2,
      y: worldCenter.y - this.config.tileSize / 2,
    };

    // Create tower
    const tower = new Tower(
      towerType,
      gridPosition,
      worldPosition,
      this.config.tileSize
    );

    // Store tower
    this.towers.set(tower.id, tower);
    this.towersByGrid.set(gridKey, tower);

    // Add to container
    this.container.addChild(tower);

    // Notify listeners
    this.onTowerPlacedCallbacks.forEach((cb) => cb(tower));

    return tower;
  }

  removeTower(towerId: string): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) {
      return false;
    }

    const gridKey = this.getGridKey(tower.gridPosition);

    // Remove from storage
    this.towers.delete(towerId);
    this.towersByGrid.delete(gridKey);

    // Remove from container
    this.container.removeChild(tower);

    // Notify listeners
    this.onTowerRemovedCallbacks.forEach((cb) => cb(tower));

    // Cleanup
    tower.destroy();

    return true;
  }

  removeTowerAt(gridPosition: GridPosition): boolean {
    const gridKey = this.getGridKey(gridPosition);
    const tower = this.towersByGrid.get(gridKey);

    if (!tower) {
      return false;
    }

    return this.removeTower(tower.id);
  }

  getTower(towerId: string): Tower | undefined {
    return this.towers.get(towerId);
  }

  getTowerAt(gridPosition: GridPosition): Tower | undefined {
    return this.towersByGrid.get(this.getGridKey(gridPosition));
  }

  hasTowerAt(gridPosition: GridPosition): boolean {
    return this.towersByGrid.has(this.getGridKey(gridPosition));
  }

  getAllTowers(): Tower[] {
    return Array.from(this.towers.values());
  }

  getTowerCount(): number {
    return this.towers.size;
  }

  getTowersByType(towerType: TowerType): Tower[] {
    return this.getAllTowers().filter((t) => t.towerType === towerType);
  }

  update(deltaTime: number, potentialTargets: TargetInfo[]): void {
    for (const tower of this.towers.values()) {
      const attackTarget = tower.update(deltaTime, potentialTargets);

      if (attackTarget) {
        // Tower is attacking, notify listeners
        this.onTowerAttackCallbacks.forEach((cb) => cb(tower, attackTarget));
      }
    }
  }

  canAfford(towerType: TowerType, currentGold: number): boolean {
    return currentGold >= TOWER_CONFIGS[towerType].stats.cost;
  }

  getTowerCost(towerType: TowerType): number {
    return TOWER_CONFIGS[towerType].stats.cost;
  }

  getSellValue(tower: Tower): number {
    // Return 50% of tower cost when selling
    return Math.floor(tower.config.stats.cost * 0.5);
  }

  onTowerPlaced(callback: TowerPlacedCallback): void {
    this.onTowerPlacedCallbacks.push(callback);
  }

  onTowerRemoved(callback: TowerRemovedCallback): void {
    this.onTowerRemovedCallbacks.push(callback);
  }

  onTowerAttack(callback: TowerAttackCallback): void {
    this.onTowerAttackCallbacks.push(callback);
  }

  private getGridKey(position: GridPosition): string {
    return `${position.col},${position.row}`;
  }

  clear(): void {
    for (const tower of this.towers.values()) {
      this.container.removeChild(tower);
      tower.destroy();
    }
    this.towers.clear();
    this.towersByGrid.clear();
  }

  destroy(): void {
    this.clear();
    this.onTowerPlacedCallbacks = [];
    this.onTowerRemovedCallbacks = [];
    this.onTowerAttackCallbacks = [];
    this.container.destroy({ children: true });
  }
}
