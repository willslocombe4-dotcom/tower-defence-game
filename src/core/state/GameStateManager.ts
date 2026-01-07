import { GameState, GameStateData, DEFAULT_GAME_STATE_DATA } from './GameState';

export type StateChangeCallback = (
  newState: GameState,
  oldState: GameState,
  data: GameStateData
) => void;

export type GameEventCallback = (data: GameStateData) => void;

export type GameEventName =
  | 'gameStarted'
  | 'gamePaused'
  | 'gameResumed'
  | 'gameOver'
  | 'victory'
  | 'livesChanged'
  | 'goldChanged'
  | 'scoreChanged'
  | 'waveChanged'
  | 'gameReset'
  | 'gameRestarted';

export interface GameStateManagerConfig {
  initialLives?: number;
  initialGold?: number;
  totalWaves?: number;
}

export class GameStateManager {
  private currentState: GameState = GameState.LOADING;
  private data: GameStateData;
  private initialConfig: GameStateManagerConfig;
  private stateChangeCallbacks: Map<string, StateChangeCallback> = new Map();
  private eventCallbacks: Map<string, Map<string, GameEventCallback>> = new Map();

  constructor(config: GameStateManagerConfig = {}) {
    this.initialConfig = { ...config };
    this.data = this.createInitialData(config);
  }

  private createInitialData(config: GameStateManagerConfig): GameStateData {
    return {
      ...DEFAULT_GAME_STATE_DATA,
      lives: config.initialLives ?? DEFAULT_GAME_STATE_DATA.lives,
      maxLives: config.initialLives ?? DEFAULT_GAME_STATE_DATA.maxLives,
      gold: config.initialGold ?? DEFAULT_GAME_STATE_DATA.gold,
      totalWaves: config.totalWaves ?? DEFAULT_GAME_STATE_DATA.totalWaves,
    };
  }

  get state(): GameState {
    return this.currentState;
  }

  get stateData(): Readonly<GameStateData> {
    return { ...this.data };
  }

  get lives(): number {
    return this.data.lives;
  }

  get gold(): number {
    return this.data.gold;
  }

  get currentWave(): number {
    return this.data.currentWave;
  }

  get score(): number {
    return this.data.score;
  }

  get isPlaying(): boolean {
    return this.currentState === GameState.PLAYING;
  }

  get isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER;
  }

  get isVictory(): boolean {
    return this.currentState === GameState.VICTORY;
  }

  setState(newState: GameState): void {
    if (newState === this.currentState) return;

    const oldState = this.currentState;
    this.currentState = newState;

    this.notifyStateChange(newState, oldState);
  }

  transitionToMenu(): void {
    this.setState(GameState.MENU);
  }

  startGame(): void {
    if (this.currentState === GameState.MENU || this.currentState === GameState.LOADING) {
      this.setState(GameState.PLAYING);
      this.emitEvent('gameStarted');
    }
  }

  pauseGame(): void {
    if (this.currentState === GameState.PLAYING) {
      this.setState(GameState.PAUSED);
      this.emitEvent('gamePaused');
    }
  }

  resumeGame(): void {
    if (this.currentState === GameState.PAUSED) {
      this.setState(GameState.PLAYING);
      this.emitEvent('gameResumed');
    }
  }

  triggerGameOver(): void {
    if (this.currentState === GameState.PLAYING) {
      this.setState(GameState.GAME_OVER);
      this.emitEvent('gameOver');
    }
  }

  triggerVictory(): void {
    if (this.currentState === GameState.PLAYING) {
      this.setState(GameState.VICTORY);
      this.emitEvent('victory');
    }
  }

  loseLife(amount: number = 1): void {
    this.data.lives = Math.max(0, this.data.lives - amount);
    this.emitEvent('livesChanged');

    if (this.data.lives <= 0) {
      this.triggerGameOver();
    }
  }

  addGold(amount: number): void {
    this.data.gold += amount;
    this.emitEvent('goldChanged');
  }

  spendGold(amount: number): boolean {
    if (this.data.gold >= amount) {
      this.data.gold -= amount;
      this.emitEvent('goldChanged');
      return true;
    }
    return false;
  }

  addScore(points: number): void {
    this.data.score += points;
    this.emitEvent('scoreChanged');
  }

  advanceWave(): void {
    this.data.currentWave++;
    this.emitEvent('waveChanged');

    if (this.data.currentWave > this.data.totalWaves) {
      this.triggerVictory();
    }
  }

  setWave(wave: number): void {
    this.data.currentWave = wave;
    this.emitEvent('waveChanged');
  }

  reset(config?: GameStateManagerConfig): void {
    const configToUse = config ?? this.initialConfig;
    this.data = this.createInitialData(configToUse);
    this.emitEvent('gameReset');
  }

  restart(): void {
    this.reset();
    this.setState(GameState.PLAYING);
    this.emitEvent('gameRestarted');
  }

  onStateChange(id: string, callback: StateChangeCallback): void {
    this.stateChangeCallbacks.set(id, callback);
  }

  offStateChange(id: string): boolean {
    return this.stateChangeCallbacks.delete(id);
  }

  on(eventName: GameEventName, id: string, callback: GameEventCallback): void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Map());
    }
    this.eventCallbacks.get(eventName)!.set(id, callback);
  }

  off(eventName: GameEventName, id: string): boolean {
    const eventMap = this.eventCallbacks.get(eventName);
    if (eventMap) {
      return eventMap.delete(id);
    }
    return false;
  }

  once(eventName: GameEventName, id: string, callback: GameEventCallback): void {
    const wrappedCallback: GameEventCallback = (data) => {
      callback(data);
      this.off(eventName, id);
    };
    this.on(eventName, id, wrappedCallback);
  }

  private notifyStateChange(newState: GameState, oldState: GameState): void {
    this.stateChangeCallbacks.forEach((callback) => {
      callback(newState, oldState, this.stateData);
    });
  }

  private emitEvent(eventName: GameEventName): void {
    const eventMap = this.eventCallbacks.get(eventName);
    if (eventMap) {
      eventMap.forEach((callback) => {
        callback(this.stateData);
      });
    }
  }

  clearAllCallbacks(): void {
    this.stateChangeCallbacks.clear();
    this.eventCallbacks.clear();
  }

  /**
   * Dispose of the state manager and clear all resources.
   * Call this when the game is being destroyed.
   */
  dispose(): void {
    this.clearAllCallbacks();
    this.currentState = GameState.LOADING;
    this.data = this.createInitialData(this.initialConfig);
  }
}
