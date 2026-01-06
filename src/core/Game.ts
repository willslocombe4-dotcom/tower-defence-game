import { Application, Container } from 'pixi.js';
import { AssetLoader } from './AssetLoader';
import { GameLoop } from './GameLoop';

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  containerId: string;
}

export class Game {
  private app: Application;
  private gameLoop: GameLoop;
  private assetLoader: AssetLoader;
  private gameContainer: Container;
  private initialized: boolean = false;

  constructor(private config: GameConfig) {
    this.app = new Application();
    this.assetLoader = new AssetLoader();
    this.gameLoop = new GameLoop();
    this.gameContainer = new Container();
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

    await this.loadAssets();

    this.setupGameLoop();

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

  start(): void {
    if (!this.initialized) {
      console.error('Game not initialized. Call init() first.');
      return;
    }
    this.gameLoop.start();
    console.log('Game started');
  }

  pause(): void {
    this.gameLoop.pause();
  }

  resume(): void {
    this.gameLoop.resume();
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
}
