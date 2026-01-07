import { Application, Container } from 'pixi.js';
import { AssetLoader } from './AssetLoader';
import { GameLoop } from './GameLoop';
import { GameStateManager, GameState, GameStateManagerConfig } from './state';
import { GameOverScreen, HUD } from '../ui';

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  containerId: string;
  initialLives?: number;
  initialGold?: number;
  totalWaves?: number;
}

export class Game {
  private app: Application;
  private gameLoop: GameLoop;
  private assetLoader: AssetLoader;
  private gameContainer: Container;
  private uiContainer: Container;
  private stateManager: GameStateManager;
  private gameOverScreen: GameOverScreen | null = null;
  private hud: HUD | null = null;
  private initialized: boolean = false;

  constructor(private config: GameConfig) {
    this.app = new Application();
    this.assetLoader = new AssetLoader();
    this.gameLoop = new GameLoop();
    this.gameContainer = new Container();
    this.uiContainer = new Container();

    const stateConfig: GameStateManagerConfig = {
      initialLives: config.initialLives,
      initialGold: config.initialGold,
      totalWaves: config.totalWaves,
    };
    this.stateManager = new GameStateManager(stateConfig);
  }

  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('Game already initialized');
      return;
    }

    await this.app.init({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    const container = document.getElementById(this.config.containerId);
    if (!container) {
      throw new Error(`Container element #${this.config.containerId} not found`);
    }
    container.appendChild(this.app.canvas);

    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    await this.loadAssets();

    this.setupGameLoop();
    this.setupUI();
    this.setupStateListeners();

    this.initialized = true;
    console.log('Game initialized successfully');
  }

  private async loadAssets(): Promise<void> {
    await this.assetLoader.loadAll();
  }

  private setupGameLoop(): void {
    this.app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaTime / 60;
      this.gameLoop.update(deltaTime);
    });
  }

  private setupUI(): void {
    this.hud = new HUD({
      width: this.config.width,
      height: this.config.height,
    });
    this.hud.update(this.stateManager.stateData);
    this.uiContainer.addChild(this.hud);
  }

  private setupStateListeners(): void {
    this.stateManager.onStateChange('game', (newState, _oldState, data) => {
      if (newState === GameState.GAME_OVER || newState === GameState.VICTORY) {
        this.showGameOverScreen(newState === GameState.VICTORY);
        this.gameLoop.pause();
      } else if (newState === GameState.PLAYING) {
        this.hideGameOverScreen();
        this.hud?.show();
        this.gameLoop.resume();
      } else if (newState === GameState.PAUSED) {
        this.gameLoop.pause();
      }

      this.hud?.update(data);
    });

    this.stateManager.on('livesChanged', 'hud', (data) => {
      this.hud?.update(data);
    });

    this.stateManager.on('goldChanged', 'hud', (data) => {
      this.hud?.update(data);
    });

    this.stateManager.on('waveChanged', 'hud', (data) => {
      this.hud?.update(data);
    });

    this.stateManager.on('scoreChanged', 'hud', (data) => {
      this.hud?.update(data);
    });
  }

  private showGameOverScreen(isVictory: boolean): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
    }

    this.gameOverScreen = new GameOverScreen({
      width: this.config.width,
      height: this.config.height,
      isVictory,
      score: this.stateManager.score,
      wave: this.stateManager.currentWave,
      onRestart: () => this.restart(),
      onMainMenu: () => this.returnToMenu(),
    });

    this.uiContainer.addChild(this.gameOverScreen);
    this.gameOverScreen.show();
  }

  private hideGameOverScreen(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
      this.gameOverScreen = null;
    }
  }

  start(): void {
    if (!this.initialized) {
      console.error('Game not initialized. Call init() first.');
      return;
    }
    this.gameLoop.start();
    this.stateManager.startGame();
    console.log('Game started');
  }

  pause(): void {
    this.stateManager.pauseGame();
  }

  resume(): void {
    this.stateManager.resumeGame();
  }

  restart(): void {
    this.clearGameState();
    this.stateManager.restart();
    console.log('Game restarted');
  }

  returnToMenu(): void {
    this.clearGameState();
    this.stateManager.reset();
    this.stateManager.transitionToMenu();
    this.hideGameOverScreen();
    console.log('Returned to menu');
  }

  private clearGameState(): void {
    this.gameLoop.clearAllCallbacks();

    while (this.gameContainer.children.length > 0) {
      const child = this.gameContainer.children[0];
      this.gameContainer.removeChild(child);
      child.destroy();
    }
  }

  loseLife(amount: number = 1): void {
    this.stateManager.loseLife(amount);
  }

  addGold(amount: number): void {
    this.stateManager.addGold(amount);
  }

  spendGold(amount: number): boolean {
    return this.stateManager.spendGold(amount);
  }

  addScore(points: number): void {
    this.stateManager.addScore(points);
  }

  advanceWave(): void {
    this.stateManager.advanceWave();
  }

  triggerGameOver(): void {
    this.stateManager.triggerGameOver();
  }

  triggerVictory(): void {
    this.stateManager.triggerVictory();
  }

  get stage(): Container {
    return this.gameContainer;
  }

  get assets(): AssetLoader {
    return this.assetLoader;
  }

  get loop(): GameLoop {
    return this.gameLoop;
  }

  get width(): number {
    return this.config.width;
  }

  get height(): number {
    return this.config.height;
  }

  get pixiApp(): Application {
    return this.app;
  }

  get state(): GameStateManager {
    return this.stateManager;
  }

  get isPlaying(): boolean {
    return this.stateManager.isPlaying;
  }

  get isGameOver(): boolean {
    return this.stateManager.isGameOver;
  }

  get isVictory(): boolean {
    return this.stateManager.isVictory;
  }
}
