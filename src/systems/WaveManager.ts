/**
 * WaveManager - Manages wave spawning, timing, and progression
 *
 * Responsibilities:
 * - Wave configuration and enemy composition
 * - Spawn queue and timing system
 * - Countdown timer between waves
 * - Difficulty scaling
 * - Event emission for wave lifecycle
 */

import {
  WaveDefinition,
  WaveState,
  WaveEventType,
  WaveStartedEvent,
  WaveCompletedEvent,
  AllWavesCompletedEvent,
  CountdownStartedEvent,
  CountdownTickEvent,
  EnemySpawnedEvent,
  WaveEventData,
  WaveEventCallback,
  SpawnQueueEntry,
  DifficultyScaling,
  EnemyType,
  IEnemyManager,
  WaveManagerState,
  SpawnMode,
} from '../types';
import {
  WAVE_DEFINITIONS,
  WAVE_TIMING,
  DIFFICULTY_PRESETS,
  getWaveEnemyCount,
  getScaledWaveDefinition,
  generateEndlessWave,
} from '../config/WaveConfig';

// ============================================================================
// WaveManager Configuration
// ============================================================================

export interface WaveManagerConfig {
  /** Wave definitions to use */
  waves?: WaveDefinition[];
  /** Difficulty scaling preset or custom scaling */
  difficulty?: string | DifficultyScaling;
  /** EnemyManager instance for spawning */
  enemyManager?: IEnemyManager;
  /** Auto-start next wave after countdown */
  autoStartWaves?: boolean;
  /** Enable endless mode (generates waves beyond defined ones) */
  endlessMode?: boolean;
  /** Path ID to spawn enemies on */
  pathId?: string;
  /** Spawn mode for mixed enemy waves (default: sequential) */
  spawnMode?: SpawnMode;
}

// ============================================================================
// WaveManager Class
// ============================================================================

export class WaveManager {
  // Configuration
  private waves: WaveDefinition[];
  private difficulty: DifficultyScaling;
  private enemyManager: IEnemyManager | null;
  private autoStartWaves: boolean;
  private endlessMode: boolean;
  private pathId: string | undefined;
  private spawnMode: SpawnMode;

  // State machine
  private _state: WaveManagerState = WaveManagerState.IDLE;
  private currentWaveIndex: number = -1;
  private isPaused: boolean = false;

  // Legacy state getters (for backwards compatibility)
  private get isActive(): boolean {
    return this._state !== WaveManagerState.IDLE && this._state !== WaveManagerState.COMPLETE;
  }
  private get isComplete(): boolean {
    return this._state === WaveManagerState.COMPLETE;
  }
  private get isCountingDown(): boolean {
    return this._state === WaveManagerState.COUNTDOWN;
  }

  // Spawn queue
  private spawnQueue: SpawnQueueEntry[] = [];
  private spawnQueueIndex: number = 0;
  private waveElapsedTime: number = 0;

  // Countdown
  private countdownTime: number = 0;
  private countdownElapsed: number = 0;
  private lastCountdownTick: number = 0;

  // Statistics
  private enemiesSpawnedThisWave: number = 0;
  private enemiesKilledThisWave: number = 0;
  private enemiesLeakedThisWave: number = 0;
  private totalEnemiesKilled: number = 0;
  private totalEnemiesLeaked: number = 0;

  // Event system
  private eventListeners: Map<WaveEventType, Set<WaveEventCallback<WaveEventData>>> =
    new Map();

  // Bound event handlers for cleanup
  private boundOnEnemyKilled: () => void;
  private boundOnEnemyReachedEnd: () => void;

  constructor(config: WaveManagerConfig = {}) {
    // Apply configuration with defaults
    this.waves = config.waves ?? [...WAVE_DEFINITIONS];
    this.difficulty = this.resolveDifficulty(config.difficulty);
    this.enemyManager = config.enemyManager ?? null;
    this.autoStartWaves = config.autoStartWaves ?? true;
    this.endlessMode = config.endlessMode ?? false;
    this.pathId = config.pathId;
    this.spawnMode = config.spawnMode ?? SpawnMode.SEQUENTIAL;

    // Initialize event listener maps
    Object.values(WaveEventType).forEach((eventType) => {
      this.eventListeners.set(eventType, new Set());
    });

    // Bind event handlers
    this.boundOnEnemyKilled = this.onEnemyKilled.bind(this);
    this.boundOnEnemyReachedEnd = this.onEnemyReachedEnd.bind(this);

    // Subscribe to enemy manager events if available
    if (this.enemyManager) {
      this.subscribeToEnemyManager(this.enemyManager);
    }
  }

  // ==========================================================================
  // Public API - Lifecycle
  // ==========================================================================

  /**
   * Start the wave system
   */
  start(): void {
    if (this.isActive) {
      console.warn('WaveManager: Already active');
      return;
    }

    this.transitionTo(WaveManagerState.COUNTDOWN);
    this.isPaused = false;
    this.currentWaveIndex = -1;
    this.resetStatistics();

    // Start countdown to first wave
    this.startCountdown(WAVE_TIMING.timeBetweenWaves);
  }

  /**
   * Stop the wave system
   */
  stop(): void {
    this.transitionTo(WaveManagerState.IDLE);
    this.isPaused = false;
    this.spawnQueue = [];
  }

  /**
   * Get the current state machine state
   */
  get internalState(): WaveManagerState {
    return this._state;
  }

  /**
   * Set the spawn mode for mixed enemy waves
   */
  setSpawnMode(mode: SpawnMode): void {
    this.spawnMode = mode;
  }

  /**
   * Transition to a new state (internal state machine)
   */
  private transitionTo(newState: WaveManagerState): void {
    const validTransitions: Record<WaveManagerState, WaveManagerState[]> = {
      [WaveManagerState.IDLE]: [WaveManagerState.COUNTDOWN],
      [WaveManagerState.COUNTDOWN]: [WaveManagerState.SPAWNING, WaveManagerState.IDLE],
      [WaveManagerState.SPAWNING]: [WaveManagerState.WAITING_FOR_CLEAR, WaveManagerState.IDLE],
      [WaveManagerState.WAITING_FOR_CLEAR]: [WaveManagerState.COUNTDOWN, WaveManagerState.COMPLETE, WaveManagerState.IDLE],
      [WaveManagerState.COMPLETE]: [WaveManagerState.IDLE],
    };

    const allowed = validTransitions[this._state];
    if (!allowed.includes(newState)) {
      console.warn(`WaveManager: Invalid state transition from ${this._state} to ${newState}`);
      return;
    }

    this._state = newState;
  }

  /**
   * Pause the wave system
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the wave system
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Start the next wave immediately (skip countdown)
   */
  startNextWave(): void {
    if (!this.isActive || this.isPaused) {
      return;
    }

    this.isCountingDown = false;
    this.countdownTime = 0;
    this.countdownElapsed = 0;

    this.beginWave();
  }

  /**
   * Call next wave early (ends countdown, starts wave)
   */
  callNextWaveEarly(): void {
    if (this.isCountingDown) {
      this.startNextWave();
    }
  }

  /**
   * Skip current wave (for debugging/testing)
   */
  skipCurrentWave(): void {
    if (!this.isActive || this.currentWaveIndex < 0) {
      return;
    }

    // Clear spawn queue
    this.spawnQueue = [];
    this.spawnQueueIndex = 0;

    // Mark wave as complete
    this.completeCurrentWave();
  }

  // ==========================================================================
  // Public API - Configuration
  // ==========================================================================

  /**
   * Set the enemy manager for spawning
   */
  setEnemyManager(enemyManager: IEnemyManager): void {
    // Unsubscribe from old manager
    if (this.enemyManager) {
      this.unsubscribeFromEnemyManager(this.enemyManager);
    }

    this.enemyManager = enemyManager;
    this.subscribeToEnemyManager(enemyManager);
  }

  /**
   * Set difficulty scaling
   */
  setDifficulty(difficulty: string | DifficultyScaling): void {
    this.difficulty = this.resolveDifficulty(difficulty);
  }

  /**
   * Set wave definitions
   * @throws Error if waves array is empty or contains invalid wave numbers
   */
  setWaves(waves: WaveDefinition[]): void {
    if (!waves || waves.length === 0) {
      throw new Error('WaveManager: waves array cannot be empty');
    }

    // Validate wave definitions
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];
      if (!wave.enemies || wave.enemies.length === 0) {
        console.warn(`WaveManager: Wave ${wave.waveNumber} has no enemies defined`);
      }
      for (const spawn of wave.enemies) {
        if (spawn.count <= 0) {
          console.warn(`WaveManager: Wave ${wave.waveNumber} has enemy spawn with invalid count: ${spawn.count}`);
        }
      }
    }

    this.waves = [...waves];
  }

  /**
   * Set path ID for spawning
   */
  setPathId(pathId: string): void {
    this.pathId = pathId;
  }

  // ==========================================================================
  // Public API - State Queries
  // ==========================================================================

  /**
   * Get current wave state
   */
  getState(): WaveState {
    const totalEnemiesInWave =
      this.currentWaveIndex >= 0 && this.currentWaveIndex < this.waves.length
        ? getWaveEnemyCount(
            getScaledWaveDefinition(
              this.waves[this.currentWaveIndex],
              this.difficulty
            )
          )
        : 0;

    return {
      currentWave: this.currentWaveIndex + 1,
      totalWaves: this.endlessMode ? Infinity : this.waves.length,
      isActive: this.isActive,
      isPaused: this.isPaused,
      isComplete: this.isComplete,
      isCountingDown: this.isCountingDown,
      enemiesRemaining:
        totalEnemiesInWave -
        this.enemiesKilledThisWave -
        this.enemiesLeakedThisWave,
      enemiesSpawned: this.enemiesSpawnedThisWave,
      enemiesKilled: this.enemiesKilledThisWave,
      enemiesLeaked: this.enemiesLeakedThisWave,
      timeUntilNextWave: Math.max(
        0,
        this.countdownTime - this.countdownElapsed
      ),
      countdownTime: Math.max(0, this.countdownTime - this.countdownElapsed),
    };
  }

  /**
   * Get current wave number (1-indexed)
   */
  getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  /**
   * Get total number of waves
   */
  getTotalWaves(): number {
    return this.endlessMode ? Infinity : this.waves.length;
  }

  /**
   * Check if currently in a wave
   */
  isInWave(): boolean {
    return (
      this.isActive &&
      !this.isCountingDown &&
      this.currentWaveIndex >= 0 &&
      !this.isComplete
    );
  }

  /**
   * Get total statistics
   */
  getTotalStats(): {
    totalKills: number;
    totalLeaked: number;
    wavesCompleted: number;
  } {
    return {
      totalKills: this.totalEnemiesKilled,
      totalLeaked: this.totalEnemiesLeaked,
      wavesCompleted: this.currentWaveIndex,
    };
  }

  // ==========================================================================
  // Public API - Update
  // ==========================================================================

  /**
   * Update the wave manager (called from game loop)
   * @param deltaTime Time since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.isActive || this.isPaused) {
      return;
    }

    // Convert to milliseconds for internal timing
    const deltaMs = deltaTime * 1000;

    if (this.isCountingDown) {
      this.updateCountdown(deltaMs);
    } else if (this.currentWaveIndex >= 0) {
      this.updateWaveSpawning(deltaMs);
      this.checkWaveCompletion();
    }
  }

  /**
   * Create update callback for GameLoop integration
   */
  createUpdateCallback(): (deltaTime: number) => void {
    return (deltaTime: number) => this.update(deltaTime);
  }

  // ==========================================================================
  // Public API - Events
  // ==========================================================================

  /**
   * Subscribe to wave events
   */
  on<T extends WaveEventData>(
    eventType: WaveEventType,
    callback: WaveEventCallback<T>
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(callback as WaveEventCallback<WaveEventData>);
    }
  }

  /**
   * Unsubscribe from wave events
   */
  off<T extends WaveEventData>(
    eventType: WaveEventType,
    callback: WaveEventCallback<T>
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback as WaveEventCallback<WaveEventData>);
    }
  }

  // ==========================================================================
  // Public API - Cleanup
  // ==========================================================================

  /**
   * Clean up resources and event listeners
   */
  destroy(): void {
    this.stop();

    if (this.enemyManager) {
      this.unsubscribeFromEnemyManager(this.enemyManager);
    }

    // Clear all event listeners
    this.eventListeners.forEach((listeners) => listeners.clear());
  }

  // ==========================================================================
  // Private - Wave Management
  // ==========================================================================

  private beginWave(): void {
    this.currentWaveIndex++;

    // Check if all waves complete
    if (!this.endlessMode && this.currentWaveIndex >= this.waves.length) {
      this.completeAllWaves();
      return;
    }

    this.transitionTo(WaveManagerState.SPAWNING);

    // Get wave definition (generate if endless mode)
    const waveDefinition = this.getWaveDefinition(this.currentWaveIndex);
    const scaledWave = getScaledWaveDefinition(waveDefinition, this.difficulty);

    // Reset wave statistics
    this.enemiesSpawnedThisWave = 0;
    this.enemiesKilledThisWave = 0;
    this.enemiesLeakedThisWave = 0;

    // Build spawn queue
    this.buildSpawnQueue(scaledWave);
    this.spawnQueueIndex = 0;
    this.waveElapsedTime = 0;

    // Apply start delay
    if (scaledWave.startDelay > 0) {
      this.waveElapsedTime = -scaledWave.startDelay;
    }

    // Emit wave started event
    this.emit(WaveEventType.WAVE_STARTED, {
      waveNumber: this.currentWaveIndex + 1,
      totalEnemies: getWaveEnemyCount(scaledWave),
    } as WaveStartedEvent);
  }

  private buildSpawnQueue(wave: WaveDefinition): void {
    this.spawnQueue = [];

    switch (this.spawnMode) {
      case SpawnMode.INTERLEAVED:
        this.buildInterleavedQueue(wave);
        break;
      case SpawnMode.RANDOM:
        this.buildRandomQueue(wave);
        break;
      case SpawnMode.SEQUENTIAL:
      default:
        this.buildSequentialQueue(wave);
        break;
    }

    // Sort by spawn time
    this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);
  }

  /**
   * Build spawn queue with sequential spawning (all of type A, then B, etc.)
   */
  private buildSequentialQueue(wave: WaveDefinition): void {
    let currentTime = 0;

    for (const enemySpawn of wave.enemies) {
      for (let i = 0; i < enemySpawn.count; i++) {
        this.spawnQueue.push({
          type: enemySpawn.type,
          spawnTime: currentTime,
        });
        currentTime += enemySpawn.spawnDelay;
      }
    }
  }

  /**
   * Build spawn queue with interleaved spawning (alternates between types)
   * Creates more varied and challenging mixed encounters.
   */
  private buildInterleavedQueue(wave: WaveDefinition): void {
    // Create spawn counters for each enemy type
    const spawnCounters = wave.enemies.map((spawn) => ({
      type: spawn.type,
      remaining: spawn.count,
      delay: spawn.spawnDelay,
    }));

    let currentTime = 0;
    let typeIndex = 0;

    // Round-robin through enemy types until all are spawned
    while (spawnCounters.some((s) => s.remaining > 0)) {
      const counter = spawnCounters[typeIndex];

      if (counter.remaining > 0) {
        this.spawnQueue.push({
          type: counter.type,
          spawnTime: currentTime,
        });
        counter.remaining--;
        currentTime += counter.delay;
      }

      // Move to next type
      typeIndex = (typeIndex + 1) % spawnCounters.length;
    }
  }

  /**
   * Build spawn queue with randomized spawning order.
   * Uses weighted random selection based on remaining counts.
   */
  private buildRandomQueue(wave: WaveDefinition): void {
    // Create a pool of enemies to spawn
    const pool: { type: EnemyType; delay: number }[] = [];
    for (const enemySpawn of wave.enemies) {
      for (let i = 0; i < enemySpawn.count; i++) {
        pool.push({ type: enemySpawn.type, delay: enemySpawn.spawnDelay });
      }
    }

    // Shuffle the pool (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Build queue from shuffled pool
    let currentTime = 0;
    for (const entry of pool) {
      this.spawnQueue.push({
        type: entry.type,
        spawnTime: currentTime,
      });
      currentTime += entry.delay;
    }
  }

  private updateWaveSpawning(deltaMs: number): void {
    this.waveElapsedTime += deltaMs;

    // Skip if still in start delay
    if (this.waveElapsedTime < 0) {
      return;
    }

    // Process spawn queue
    while (this.spawnQueueIndex < this.spawnQueue.length) {
      const entry = this.spawnQueue[this.spawnQueueIndex];

      if (this.waveElapsedTime >= entry.spawnTime) {
        this.spawnEnemy(entry.type);
        this.spawnQueueIndex++;
      } else {
        break;
      }
    }
  }

  private spawnEnemy(type: EnemyType): void {
    if (this.enemyManager) {
      this.enemyManager.spawnEnemy(type, this.pathId);
    }

    this.enemiesSpawnedThisWave++;

    // Emit spawn event
    const waveDefinition = this.getWaveDefinition(this.currentWaveIndex);
    const totalInWave = getWaveEnemyCount(
      getScaledWaveDefinition(waveDefinition, this.difficulty)
    );

    this.emit(WaveEventType.ENEMY_SPAWNED, {
      enemyType: type,
      waveNumber: this.currentWaveIndex + 1,
      spawnIndex: this.enemiesSpawnedThisWave,
      totalInWave,
    } as EnemySpawnedEvent);
  }

  private checkWaveCompletion(): void {
    // Check if all enemies spawned
    const allSpawned = this.spawnQueueIndex >= this.spawnQueue.length;

    if (!allSpawned) {
      return;
    }

    // Transition to waiting state once all enemies are spawned
    if (this._state === WaveManagerState.SPAWNING) {
      this.transitionTo(WaveManagerState.WAITING_FOR_CLEAR);
    }

    // Check if all enemies handled (killed or leaked)
    const totalHandled =
      this.enemiesKilledThisWave + this.enemiesLeakedThisWave;
    const allHandled = totalHandled >= this.enemiesSpawnedThisWave;

    // Also check if any enemies are still active
    const activeEnemies = this.enemyManager?.getActiveEnemyCount() ?? 0;

    if (allHandled && activeEnemies === 0) {
      this.completeCurrentWave();
    }
  }

  private completeCurrentWave(): void {
    // Emit wave completed event
    this.emit(WaveEventType.WAVE_COMPLETED, {
      waveNumber: this.currentWaveIndex + 1,
      enemiesKilled: this.enemiesKilledThisWave,
      enemiesLeaked: this.enemiesLeakedThisWave,
    } as WaveCompletedEvent);

    // Update total statistics
    this.totalEnemiesKilled += this.enemiesKilledThisWave;
    this.totalEnemiesLeaked += this.enemiesLeakedThisWave;

    // Check if all waves complete
    if (!this.endlessMode && this.currentWaveIndex + 1 >= this.waves.length) {
      this.completeAllWaves();
      return;
    }

    // Start countdown to next wave
    if (this.autoStartWaves) {
      this.startCountdown(WAVE_TIMING.timeBetweenWaves);
    }
  }

  private completeAllWaves(): void {
    this.transitionTo(WaveManagerState.COMPLETE);

    this.emit(WaveEventType.ALL_WAVES_COMPLETED, {
      totalWaves: this.currentWaveIndex + 1,
      totalKills: this.totalEnemiesKilled,
      totalLeaked: this.totalEnemiesLeaked,
    } as AllWavesCompletedEvent);
  }

  // ==========================================================================
  // Private - Countdown Management
  // ==========================================================================

  private startCountdown(duration: number): void {
    this.isCountingDown = true;
    this.countdownTime = duration;
    this.countdownElapsed = 0;
    this.lastCountdownTick = 0;

    this.emit(WaveEventType.COUNTDOWN_STARTED, {
      nextWave: this.currentWaveIndex + 2,
      duration,
    } as CountdownStartedEvent);
  }

  private updateCountdown(deltaMs: number): void {
    this.countdownElapsed += deltaMs;

    // Emit countdown tick at intervals
    const ticksSinceStart = Math.floor(
      this.countdownElapsed / WAVE_TIMING.countdownTickInterval
    );
    if (ticksSinceStart > this.lastCountdownTick) {
      this.lastCountdownTick = ticksSinceStart;

      const timeRemaining = Math.max(
        0,
        this.countdownTime - this.countdownElapsed
      );
      this.emit(WaveEventType.COUNTDOWN_TICK, {
        nextWave: this.currentWaveIndex + 2,
        timeRemaining,
      } as CountdownTickEvent);
    }

    // Check if countdown complete
    if (this.countdownElapsed >= this.countdownTime) {
      this.isCountingDown = false;
      this.beginWave();
    }
  }

  // ==========================================================================
  // Private - Enemy Manager Integration
  // ==========================================================================

  private subscribeToEnemyManager(manager: IEnemyManager): void {
    manager.on('enemy_killed', this.boundOnEnemyKilled);
    manager.on('enemy_reached_end', this.boundOnEnemyReachedEnd);
  }

  private unsubscribeFromEnemyManager(manager: IEnemyManager): void {
    manager.off('enemy_killed', this.boundOnEnemyKilled);
    manager.off('enemy_reached_end', this.boundOnEnemyReachedEnd);
  }

  private onEnemyKilled(): void {
    if (this.isActive && this.currentWaveIndex >= 0) {
      this.enemiesKilledThisWave++;
    }
  }

  private onEnemyReachedEnd(): void {
    if (this.isActive && this.currentWaveIndex >= 0) {
      this.enemiesLeakedThisWave++;
    }
  }

  // ==========================================================================
  // Private - Helpers
  // ==========================================================================

  private resolveDifficulty(
    difficulty: string | DifficultyScaling | undefined
  ): DifficultyScaling {
    if (!difficulty) {
      return DIFFICULTY_PRESETS.normal;
    }

    if (typeof difficulty === 'string') {
      const preset = DIFFICULTY_PRESETS[difficulty];
      if (!preset) {
        console.warn(`WaveManager: Unknown difficulty preset "${difficulty}", falling back to "normal"`);
        return DIFFICULTY_PRESETS.normal;
      }
      return preset;
    }

    return difficulty;
  }

  private getWaveDefinition(index: number): WaveDefinition {
    if (index < this.waves.length) {
      return this.waves[index];
    }

    // Generate endless wave using shared function
    if (this.endlessMode) {
      return generateEndlessWave(index, this.waves);
    }

    // Fallback (shouldn't happen)
    return this.waves[this.waves.length - 1];
  }

  private resetStatistics(): void {
    this.enemiesSpawnedThisWave = 0;
    this.enemiesKilledThisWave = 0;
    this.enemiesLeakedThisWave = 0;
    this.totalEnemiesKilled = 0;
    this.totalEnemiesLeaked = 0;
  }

  private emit<T extends WaveEventData>(eventType: WaveEventType, data: T): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}
