/**
 * Core type definitions for the tower defence game
 */

// ============================================================================
// Geometry Types
// ============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Waypoint extends Vector2D {
  index: number;
}

export interface PathDefinition {
  id: string;
  waypoints: Waypoint[];
}

// ============================================================================
// Enemy Types
// ============================================================================

export enum EnemyType {
  FAST = 'fast',
  TANK = 'tank',
  FLYING = 'flying',
}

export interface EnemyConfig {
  type: EnemyType;
  maxHealth: number;
  speed: number; // pixels per second
  size: number; // radius for collision
  color: number; // hex fallback color
  goldReward: number;
  damageToBase: number;
  ignoresObstacles: boolean;
}

export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector2D;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  pathProgress: number; // 0-1
}

// ============================================================================
// Wave System Types
// ============================================================================

/**
 * Defines a group of enemies to spawn within a wave
 */
export interface WaveEnemySpawn {
  type: EnemyType;
  count: number;
  spawnDelay: number; // milliseconds between spawns in this group
}

/**
 * Defines a complete wave configuration
 */
export interface WaveDefinition {
  waveNumber: number;
  enemies: WaveEnemySpawn[];
  startDelay: number; // milliseconds before wave begins
}

/**
 * Runtime state of the wave system
 */
export interface WaveState {
  currentWave: number;
  totalWaves: number;
  isActive: boolean;
  isPaused: boolean;
  isComplete: boolean;
  isCountingDown: boolean;
  enemiesRemaining: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  enemiesLeaked: number;
  timeUntilNextWave: number; // milliseconds
  countdownTime: number; // milliseconds remaining in countdown
}

/**
 * Configuration for difficulty scaling
 */
export interface DifficultyScaling {
  healthMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  countMultiplier: number;
}

/**
 * Internal spawn queue entry
 */
export interface SpawnQueueEntry {
  type: EnemyType;
  spawnTime: number; // milliseconds from wave start
}

// ============================================================================
// Wave Manager State Machine
// ============================================================================

/**
 * Internal state machine states for WaveManager.
 * Provides clear lifecycle tracking and valid state transitions.
 */
export enum WaveManagerState {
  /** Initial state, waiting to start */
  IDLE = 'idle',
  /** Counting down to next wave */
  COUNTDOWN = 'countdown',
  /** Actively spawning enemies */
  SPAWNING = 'spawning',
  /** All enemies spawned, waiting for them to be cleared */
  WAITING_FOR_CLEAR = 'waiting_for_clear',
  /** All waves completed */
  COMPLETE = 'complete',
}

/**
 * Spawn mode for mixed enemy waves
 */
export enum SpawnMode {
  /** Sequential: Spawn all of type A, then all of type B (default) */
  SEQUENTIAL = 'sequential',
  /** Interleaved: Alternate between enemy types for mixed encounters */
  INTERLEAVED = 'interleaved',
  /** Random: Randomly select from available enemy types */
  RANDOM = 'random',
}

// ============================================================================
// Wave Event Types
// ============================================================================

export enum WaveEventType {
  WAVE_STARTED = 'wave_started',
  WAVE_COMPLETED = 'wave_completed',
  ALL_WAVES_COMPLETED = 'all_waves_completed',
  COUNTDOWN_STARTED = 'countdown_started',
  COUNTDOWN_TICK = 'countdown_tick',
  ENEMY_SPAWNED = 'enemy_spawned',
}

export interface WaveStartedEvent {
  waveNumber: number;
  totalEnemies: number;
}

export interface WaveCompletedEvent {
  waveNumber: number;
  enemiesKilled: number;
  enemiesLeaked: number;
}

export interface AllWavesCompletedEvent {
  totalWaves: number;
  totalKills: number;
  totalLeaked: number;
}

export interface CountdownStartedEvent {
  nextWave: number;
  duration: number; // milliseconds
}

export interface CountdownTickEvent {
  nextWave: number;
  timeRemaining: number; // milliseconds
}

export interface EnemySpawnedEvent {
  enemyType: EnemyType;
  waveNumber: number;
  spawnIndex: number;
  totalInWave: number;
}

export type WaveEventData =
  | WaveStartedEvent
  | WaveCompletedEvent
  | AllWavesCompletedEvent
  | CountdownStartedEvent
  | CountdownTickEvent
  | EnemySpawnedEvent;

export type WaveEventCallback<T extends WaveEventData> = (event: T) => void;

// ============================================================================
// Enemy Manager Interface (for WaveManager integration)
// ============================================================================

/**
 * Interface for EnemyManager that WaveManager depends on
 * This allows WaveManager to work with any EnemyManager implementation
 */
export interface IEnemyManager {
  spawnEnemy(type: EnemyType, pathId?: string): unknown;
  on(eventType: string, callback: (event: unknown) => void): void;
  off(eventType: string, callback: (event: unknown) => void): void;
  getActiveEnemyCount(): number;
}
