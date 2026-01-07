import { EnemyManager } from './EnemyManager';
import {
  WaveDefinition,
  WaveState,
  EnemyType,
  GameEvent,
  GameEventCallback,
  WaveStartedEventData,
  WaveCompletedEventData,
  AllWavesCompletedEventData,
} from '../types';
import { WAVE_DEFINITIONS, WAVE_TIMING, getWaveEnemyCount } from '../config/WaveConfig';

/**
 * Internal spawn queue entry.
 */
interface SpawnQueueEntry {
  type: EnemyType;
  spawnTime: number;
}

/**
 * Manages wave-based enemy spawning.
 *
 * Features:
 * - Configurable wave definitions
 * - Timed spawn queues
 * - Auto-advance between waves
 * - Wave skip/pause controls
 * - Event emission for UI
 *
 * Future enhancements:
 * - Endless mode with procedural waves
 * - Boss waves with special mechanics
 * - Wave modifiers (speed, health bonuses)
 * - Save/load wave progress
 */
export class WaveManager {
  private enemyManager: EnemyManager;
  private waveDefinitions: WaveDefinition[];
  private currentWaveIndex: number = -1;

  // State flags
  private _isActive: boolean = false;
  private _isWaveInProgress: boolean = false;
  private _isPaused: boolean = false;

  // Spawn queue
  private spawnQueue: SpawnQueueEntry[] = [];
  private elapsedTime: number = 0;

  // Wave statistics
  private enemiesSpawnedThisWave: number = 0;
  private enemiesKilledThisWave: number = 0;
  private enemiesLeakedThisWave: number = 0;
  private totalEnemiesThisWave: number = 0;

  // Timing
  private timeBetweenWaves: number;
  private timeUntilNextWave: number = 0;
  private _autoAdvance: boolean = true;

  // Events
  private eventListeners: Map<string, GameEventCallback[]> = new Map();

  constructor(enemyManager: EnemyManager, waveDefinitions?: WaveDefinition[]) {
    this.enemyManager = enemyManager;
    this.waveDefinitions = waveDefinitions || [...WAVE_DEFINITIONS];
    this.timeBetweenWaves = WAVE_TIMING.timeBetweenWaves;

    // Listen for enemy events to track wave progress
    this.setupEnemyListeners();
  }

  /**
   * Set up listeners on the enemy manager.
   */
  private setupEnemyListeners(): void {
    this.enemyManager.on('enemy_killed', () => {
      if (this._isWaveInProgress) {
        this.enemiesKilledThisWave++;
        this.checkWaveComplete();
      }
    });

    this.enemyManager.on('enemy_reached_end', () => {
      if (this._isWaveInProgress) {
        this.enemiesLeakedThisWave++;
        this.checkWaveComplete();
      }
    });
  }

  /**
   * Start the wave system.
   */
  start(): void {
    this._isActive = true;
    this._isPaused = false;
    this.currentWaveIndex = -1;
    this.elapsedTime = 0;
    this.startNextWave();
  }

  /**
   * Stop the wave system.
   */
  stop(): void {
    this._isActive = false;
    this._isWaveInProgress = false;
    this.spawnQueue = [];
  }

  /**
   * Pause the wave system.
   */
  pause(): void {
    this._isPaused = true;
  }

  /**
   * Resume the wave system.
   */
  resume(): void {
    this._isPaused = false;
  }

  /**
   * Start the next wave.
   */
  startNextWave(): void {
    this.currentWaveIndex++;

    if (this.currentWaveIndex >= this.waveDefinitions.length) {
      this.onAllWavesComplete();
      return;
    }

    const waveDef = this.waveDefinitions[this.currentWaveIndex];
    this.prepareWave(waveDef);

    this.emit<WaveStartedEventData>('wave_started', {
      waveNumber: waveDef.waveNumber,
      totalEnemies: this.totalEnemiesThisWave,
    });
  }

  /**
   * Prepare a wave for spawning.
   */
  private prepareWave(waveDef: WaveDefinition): void {
    this._isWaveInProgress = true;
    this.spawnQueue = [];
    this.enemiesSpawnedThisWave = 0;
    this.enemiesKilledThisWave = 0;
    this.enemiesLeakedThisWave = 0;
    this.totalEnemiesThisWave = getWaveEnemyCount(waveDef);

    // Build spawn queue
    let currentDelay = waveDef.startDelay / 1000; // Convert to seconds

    for (const enemyGroup of waveDef.enemies) {
      for (let i = 0; i < enemyGroup.count; i++) {
        this.spawnQueue.push({
          type: enemyGroup.type,
          spawnTime: this.elapsedTime + currentDelay,
        });
        currentDelay += enemyGroup.spawnDelay / 1000;
      }
    }

    // Sort by spawn time (should already be sorted, but ensure it)
    this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);
  }

  /**
   * Update the wave manager.
   */
  update(deltaTime: number): void {
    if (!this._isActive || this._isPaused) return;

    this.elapsedTime += deltaTime;

    // Process spawn queue
    while (
      this.spawnQueue.length > 0 &&
      this.spawnQueue[0].spawnTime <= this.elapsedTime
    ) {
      const spawn = this.spawnQueue.shift()!;
      this.enemyManager.spawnEnemy(spawn.type);
      this.enemiesSpawnedThisWave++;
    }

    // Handle time between waves
    if (!this._isWaveInProgress && this._autoAdvance && this.hasMoreWaves()) {
      this.timeUntilNextWave -= deltaTime * 1000;
      if (this.timeUntilNextWave <= 0) {
        this.startNextWave();
      }
    }
  }

  /**
   * Check if the current wave is complete.
   */
  private checkWaveComplete(): void {
    if (!this._isWaveInProgress) return;

    const allSpawned = this.spawnQueue.length === 0;
    const allHandled =
      this.enemiesKilledThisWave + this.enemiesLeakedThisWave >=
      this.enemiesSpawnedThisWave;

    if (allSpawned && allHandled && this.enemyManager.getActiveCount() === 0) {
      this.onWaveComplete();
    }
  }

  /**
   * Called when a wave is completed.
   */
  private onWaveComplete(): void {
    this._isWaveInProgress = false;
    this.timeUntilNextWave = this.timeBetweenWaves;

    this.emit<WaveCompletedEventData>('wave_completed', {
      waveNumber: this.currentWaveIndex + 1,
      enemiesKilled: this.enemiesKilledThisWave,
      enemiesLeaked: this.enemiesLeakedThisWave,
    });
  }

  /**
   * Called when all waves are completed.
   */
  private onAllWavesComplete(): void {
    this._isActive = false;
    this._isWaveInProgress = false;

    const totalKills = this.enemyManager.getStats().totalKilled;

    this.emit<AllWavesCompletedEventData>('all_waves_completed', {
      totalWaves: this.waveDefinitions.length,
      totalKills,
    });
  }

  /**
   * Check if there are more waves.
   */
  hasMoreWaves(): boolean {
    return this.currentWaveIndex < this.waveDefinitions.length - 1;
  }

  /**
   * Skip to the next wave immediately.
   */
  skipToNextWave(): void {
    if (!this.hasMoreWaves()) return;

    // Clear current wave
    this.enemyManager.clearAll();
    this.spawnQueue = [];
    this._isWaveInProgress = false;
    this.timeUntilNextWave = 0;

    this.startNextWave();
  }

  /**
   * Call the next wave early (during countdown).
   */
  callNextWaveEarly(): void {
    if (this._isWaveInProgress || !this.hasMoreWaves()) return;

    this.timeUntilNextWave = 0;
    this.startNextWave();
  }

  /**
   * Get the current wave state.
   */
  getState(): WaveState {
    return {
      currentWave: this.currentWaveIndex + 1,
      totalWaves: this.waveDefinitions.length,
      isActive: this._isActive,
      isComplete: !this.hasMoreWaves() && !this._isWaveInProgress,
      enemiesRemaining: Math.max(
        0,
        this.totalEnemiesThisWave -
          this.enemiesKilledThisWave -
          this.enemiesLeakedThisWave
      ),
      enemiesSpawned: this.enemiesSpawnedThisWave,
      enemiesKilled: this.enemiesKilledThisWave,
      timeUntilNextWave: Math.max(0, this.timeUntilNextWave),
    };
  }

  /**
   * Get current wave number (1-indexed).
   */
  getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  /**
   * Get total wave count.
   */
  getTotalWaves(): number {
    return this.waveDefinitions.length;
  }

  /**
   * Set auto-advance behavior.
   */
  setAutoAdvance(auto: boolean): void {
    this._autoAdvance = auto;
  }

  /**
   * Set time between waves.
   */
  setTimeBetweenWaves(ms: number): void {
    this.timeBetweenWaves = Math.max(WAVE_TIMING.minTimeBetweenWaves, ms);
  }

  /**
   * Add a custom wave.
   */
  addWave(wave: WaveDefinition): void {
    this.waveDefinitions.push(wave);
  }

  /**
   * Replace all wave definitions.
   */
  setWaves(waves: WaveDefinition[]): void {
    this.waveDefinitions = [...waves];
  }

  /**
   * Check if active.
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Check if wave in progress.
   */
  get isWaveInProgress(): boolean {
    return this._isWaveInProgress;
  }

  /**
   * Check if paused.
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  // =========================================================================
  // EVENT SYSTEM
  // =========================================================================

  /**
   * Subscribe to an event.
   */
  on<T = unknown>(eventType: string, callback: GameEventCallback<T>): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback as GameEventCallback);
  }

  /**
   * Unsubscribe from an event.
   */
  off<T = unknown>(eventType: string, callback: GameEventCallback<T>): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback as GameEventCallback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event.
   */
  private emit<T>(type: string, data: T): void {
    const event: GameEvent<T> = {
      type: type as GameEvent<T>['type'],
      timestamp: Date.now(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  /**
   * Create an update callback for GameLoop integration.
   */
  createUpdateCallback(): (deltaTime: number) => void {
    return (deltaTime: number) => this.update(deltaTime);
  }
}
