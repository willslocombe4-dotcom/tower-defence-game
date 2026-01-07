import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TowerType, TOWER_CONFIGS, GridPosition, WorldPosition } from './types.js';
import { TowerManager } from './TowerManager.js';

export type TowerSelectedCallback = (towerType: TowerType | null) => void;
export type PlacementAttemptCallback = (towerType: TowerType, gridPosition: GridPosition, success: boolean) => void;

export interface TowerPlacementUIConfig {
  screenWidth: number;
  screenHeight: number;
  tileSize: number;
  worldToGrid: (x: number, y: number) => GridPosition;
  gridToWorldCenter: (col: number, row: number) => WorldPosition;
  canPlaceTower: (col: number, row: number) => boolean;
}

export class TowerPlacementUI {
  private container: Container;
  private selectionPanel: Container;
  private placementPreview: Graphics;
  private rangePreview: Graphics;

  private config: TowerPlacementUIConfig;
  private towerManager: TowerManager;

  private selectedTowerType: TowerType | null = null;
  private previewGridPosition: GridPosition | null = null;
  private currentGold: number = 0;

  private onTowerSelectedCallbacks: TowerSelectedCallback[] = [];
  private onPlacementAttemptCallbacks: PlacementAttemptCallback[] = [];

  private towerButtons: Map<TowerType, Container> = new Map();

  constructor(config: TowerPlacementUIConfig, towerManager: TowerManager) {
    this.config = config;
    this.towerManager = towerManager;

    this.container = new Container();
    this.selectionPanel = new Container();
    this.placementPreview = new Graphics();
    this.rangePreview = new Graphics();

    this.placementPreview.visible = false;
    this.rangePreview.visible = false;

    this.container.addChild(this.rangePreview);
    this.container.addChild(this.placementPreview);
    this.container.addChild(this.selectionPanel);

    this.createSelectionPanel();
  }

  private createSelectionPanel(): void {
    const panelWidth = 280;
    const panelHeight = 120;
    const panelX = (this.config.screenWidth - panelWidth) / 2;
    const panelY = this.config.screenHeight - panelHeight - 10;

    // Panel background
    const panelBg = new Graphics();
    panelBg.roundRect(0, 0, panelWidth, panelHeight, 10);
    panelBg.fill({ color: 0x222233, alpha: 0.9 });
    panelBg.stroke({ width: 2, color: 0x444466 });

    this.selectionPanel.addChild(panelBg);
    this.selectionPanel.position.set(panelX, panelY);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xcccccc,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'Select Tower', style: titleStyle });
    title.position.set(panelWidth / 2 - title.width / 2, 8);
    this.selectionPanel.addChild(title);

    // Tower buttons
    const towerTypes = [TowerType.CANNON, TowerType.ARCHER, TowerType.MAGE];
    const buttonSize = 70;
    const buttonSpacing = 15;
    const startX = (panelWidth - (buttonSize * 3 + buttonSpacing * 2)) / 2;

    towerTypes.forEach((towerType, index) => {
      const button = this.createTowerButton(
        towerType,
        buttonSize,
        startX + index * (buttonSize + buttonSpacing),
        35
      );
      this.selectionPanel.addChild(button);
      this.towerButtons.set(towerType, button);
    });
  }

  private createTowerButton(
    towerType: TowerType,
    size: number,
    x: number,
    y: number
  ): Container {
    const config = TOWER_CONFIGS[towerType];
    const button = new Container();
    button.position.set(x, y);

    // Button background
    const bg = new Graphics();
    bg.roundRect(0, 0, size, size + 15, 5);
    bg.fill({ color: 0x333344 });
    bg.stroke({ width: 2, color: 0x555577 });
    button.addChild(bg);

    // Tower icon (simplified)
    const icon = new Graphics();
    const iconSize = 30;
    const iconX = size / 2;
    const iconY = 25;

    icon.circle(iconX, iconY, iconSize / 2);
    icon.fill({ color: config.color });
    icon.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    button.addChild(icon);

    // Cost text
    const costStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xffdd44,
    });
    const costText = new Text({ text: `${config.stats.cost}g`, style: costStyle });
    costText.position.set(size / 2 - costText.width / 2, 45);
    button.addChild(costText);

    // Tower name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xaaaaaa,
    });
    const nameText = new Text({ text: config.name.split(' ')[0], style: nameStyle });
    nameText.position.set(size / 2 - nameText.width / 2, 60);
    button.addChild(nameText);

    // Interactivity
    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerdown', () => this.selectTower(towerType));
    button.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(0, 0, size, size + 15, 5);
      bg.fill({ color: 0x444455 });
      bg.stroke({ width: 2, color: 0x7777aa });
    });
    button.on('pointerleave', () => {
      this.updateButtonAppearance(towerType, bg, size);
    });

    return button;
  }

  private updateButtonAppearance(
    towerType: TowerType,
    bg: Graphics,
    size: number
  ): void {
    const isSelected = this.selectedTowerType === towerType;
    const canAfford = this.towerManager.canAfford(towerType, this.currentGold);

    bg.clear();
    bg.roundRect(0, 0, size, size + 15, 5);

    if (isSelected) {
      bg.fill({ color: 0x445566 });
      bg.stroke({ width: 3, color: 0x88aacc });
    } else if (!canAfford) {
      bg.fill({ color: 0x332222 });
      bg.stroke({ width: 2, color: 0x553333 });
    } else {
      bg.fill({ color: 0x333344 });
      bg.stroke({ width: 2, color: 0x555577 });
    }
  }

  selectTower(towerType: TowerType | null): void {
    this.selectedTowerType = towerType;
    this.updateAllButtonAppearances();
    this.updatePreviewVisibility();

    this.onTowerSelectedCallbacks.forEach((cb) => cb(towerType));
  }

  deselectTower(): void {
    this.selectTower(null);
  }

  private updateAllButtonAppearances(): void {
    const size = 70;
    for (const [towerType, button] of this.towerButtons) {
      const bg = button.getChildAt(0) as Graphics;
      this.updateButtonAppearance(towerType, bg, size);
    }
  }

  private updatePreviewVisibility(): void {
    const showPreview = this.selectedTowerType !== null && this.previewGridPosition !== null;
    this.placementPreview.visible = showPreview;
    this.rangePreview.visible = showPreview;
  }

  updatePreviewPosition(worldX: number, worldY: number): void {
    if (this.selectedTowerType === null) {
      this.placementPreview.visible = false;
      this.rangePreview.visible = false;
      return;
    }

    const gridPos = this.config.worldToGrid(worldX, worldY);
    this.previewGridPosition = gridPos;

    const canPlace = this.config.canPlaceTower(gridPos.col, gridPos.row) &&
                     !this.towerManager.hasTowerAt(gridPos);
    const canAfford = this.towerManager.canAfford(this.selectedTowerType, this.currentGold);
    const isValid = canPlace && canAfford;

    const worldCenter = this.config.gridToWorldCenter(gridPos.col, gridPos.row);
    const tileSize = this.config.tileSize;

    // Draw placement preview
    this.placementPreview.clear();
    this.placementPreview.rect(
      worldCenter.x - tileSize / 2,
      worldCenter.y - tileSize / 2,
      tileSize,
      tileSize
    );
    this.placementPreview.fill({
      color: isValid ? 0x44ff44 : 0xff4444,
      alpha: 0.3,
    });
    this.placementPreview.stroke({
      width: 2,
      color: isValid ? 0x44ff44 : 0xff4444,
      alpha: 0.8,
    });

    // Draw range preview
    const towerConfig = TOWER_CONFIGS[this.selectedTowerType];
    this.rangePreview.clear();
    this.rangePreview.circle(worldCenter.x, worldCenter.y, towerConfig.stats.range);
    this.rangePreview.fill({
      color: isValid ? 0x44ff44 : 0xff4444,
      alpha: 0.1,
    });
    this.rangePreview.stroke({
      width: 1,
      color: isValid ? 0x44ff44 : 0xff4444,
      alpha: 0.4,
    });

    this.placementPreview.visible = true;
    this.rangePreview.visible = true;
  }

  hidePreview(): void {
    this.placementPreview.visible = false;
    this.rangePreview.visible = false;
    this.previewGridPosition = null;
  }

  tryPlaceTower(worldX: number, worldY: number): boolean {
    if (this.selectedTowerType === null) {
      return false;
    }

    const gridPos = this.config.worldToGrid(worldX, worldY);

    // Check if can afford
    if (!this.towerManager.canAfford(this.selectedTowerType, this.currentGold)) {
      this.onPlacementAttemptCallbacks.forEach((cb) =>
        cb(this.selectedTowerType!, gridPos, false)
      );
      return false;
    }

    // Try to place tower
    const tower = this.towerManager.placeTower(this.selectedTowerType, gridPos);

    if (tower) {
      this.onPlacementAttemptCallbacks.forEach((cb) =>
        cb(this.selectedTowerType!, gridPos, true)
      );

      // Deselect after successful placement (optional behavior)
      // this.deselectTower();

      return true;
    }

    this.onPlacementAttemptCallbacks.forEach((cb) =>
      cb(this.selectedTowerType!, gridPos, false)
    );
    return false;
  }

  setGold(amount: number): void {
    this.currentGold = amount;
    this.updateAllButtonAppearances();
  }

  getSelectedTowerType(): TowerType | null {
    return this.selectedTowerType;
  }

  isPlacementMode(): boolean {
    return this.selectedTowerType !== null;
  }

  onTowerSelected(callback: TowerSelectedCallback): void {
    this.onTowerSelectedCallbacks.push(callback);
  }

  onPlacementAttempt(callback: PlacementAttemptCallback): void {
    this.onPlacementAttemptCallbacks.push(callback);
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.onTowerSelectedCallbacks = [];
    this.onPlacementAttemptCallbacks = [];
    this.towerButtons.clear();
    this.container.destroy({ children: true });
  }
}
