/**
 * Core types and interfaces for the tower defence game.
 * Designed for extensibility - new enemy types, abilities, and systems
 * can be added by extending these base interfaces.
 */

// ============================================================================
// GEOMETRY
// ============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Waypoint extends Vector2D {
  // Extensible: add properties like speed modifier, trigger events, etc.
}

export interface PathDefinition {
  id: string;
  waypoints: Waypoint[];
  // Extensible: add properties like difficulty, terrain type, etc.
}

// ============================================================================
// ENEMY TYPES
// ============================================================================

/**
 * Enemy type identifiers. Add new types here as the game expands.
 */
export enum EnemyType {
  FAST = 'fast',
  TANK = 'tank',
  FLYING = 'flying',
  // Future types: BOSS, HEALER, SPLITTER, INVISIBLE, etc.
}

/**
 * Base configuration for all enemy types.
 * Extend this interface for enemies with special abilities.
 */
export interface EnemyConfig {
  type: EnemyType;
  maxHealth: number;
  speed: number;              // pixels per second
  size: number;               // radius for collision/rendering
  color: number;              // hex color for placeholder graphics
  goldReward: number;
  damageToBase: number;
  ignoresObstacles: boolean;  // flying enemies bypass ground obstacles
  // Extensible: armor, resistances, abilities, etc.
}

/**
 * Runtime state of an enemy instance.
 * Used for targeting, UI, and game logic.
 */
export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector2D;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  pathProgress: number;       // 0 to 1, progress along path
  // Extensible: status effects, buffs/debuffs, etc.
}

// ============================================================================
// WAVE SYSTEM
// ============================================================================

/**
 * Defines a group of enemies to spawn within a wave.
 */
export interface WaveEnemySpawn {
  type: EnemyType;
  count: number;
  spawnDelay: number;         // ms between each spawn in this group
  // Extensible: spawn position override, buff modifiers, etc.
}

/**
 * Complete wave definition.
 */
export interface WaveDefinition {
  waveNumber: number;
  enemies: WaveEnemySpawn[];
  startDelay: number;         // ms before wave begins
  // Extensible: boss wave flag, special events, rewards, etc.
}

/**
 * Runtime state of the wave system.
 */
export interface WaveState {
  currentWave: number;
  totalWaves: number;
  isActive: boolean;
  isComplete: boolean;
  enemiesRemaining: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  timeUntilNextWave: number;  // ms
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * Event types emitted by the enemy and wave systems.
 * Subscribe to these for UI updates, achievements, sound effects, etc.
 */
export type EnemyEventType =
  | 'enemy_spawned'
  | 'enemy_damaged'
  | 'enemy_killed'
  | 'enemy_reached_end'
  | 'wave_started'
  | 'wave_completed'
  | 'all_waves_completed';
  // Extensible: add enemy_ability_used, enemy_buffed, etc.

/**
 * Base event structure. Data payload varies by event type.
 */
export interface GameEvent<T = unknown> {
  type: EnemyEventType;
  timestamp: number;
  data: T;
}

/**
 * Typed event data for each event type.
 */
export interface EnemySpawnedEventData {
  enemy: EnemyState;
}

export interface EnemyDamagedEventData {
  enemy: EnemyState;
  damage: number;
  source?: string;            // tower id, ability name, etc.
}

export interface EnemyKilledEventData {
  enemy: EnemyState;
  reward: number;
  killedBy?: string;
}

export interface EnemyReachedEndEventData {
  enemy: EnemyState;
  damage: number;
}

export interface WaveStartedEventData {
  waveNumber: number;
  totalEnemies: number;
}

export interface WaveCompletedEventData {
  waveNumber: number;
  enemiesKilled: number;
  enemiesLeaked: number;
}

export interface AllWavesCompletedEventData {
  totalWaves: number;
  totalKills: number;
}

/**
 * Generic event callback type.
 */
export type GameEventCallback<T = unknown> = (event: GameEvent<T>) => void;

// ============================================================================
// TARGETING (for future tower system integration)
// ============================================================================

/**
 * Targeting strategies for towers.
 */
export enum TargetingStrategy {
  FIRST = 'first',            // Closest to end
  LAST = 'last',              // Furthest from end
  STRONGEST = 'strongest',    // Highest health
  WEAKEST = 'weakest',        // Lowest health
  CLOSEST = 'closest',        // Closest to tower
  // Extensible: FLYING_PRIORITY, BOSS_PRIORITY, etc.
}

/**
 * Filter options for enemy queries.
 */
export interface EnemyFilter {
  types?: EnemyType[];        // Only these types
  excludeTypes?: EnemyType[]; // Exclude these types
  minHealth?: number;
  maxHealth?: number;
  inRange?: { x: number; y: number; range: number };
  // Extensible: has status effect, is boss, etc.
}
