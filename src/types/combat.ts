import { Container } from 'pixi.js';

// ============================================================================
// Core Types
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Projectile Types
// ============================================================================

export enum ProjectileType {
  BULLET = 'bullet',
  ARROW = 'arrow',
  MAGIC = 'magic',
}

export interface ProjectileConfig {
  type: ProjectileType;
  damage: number;
  speed: number;
  size: number;
  color: number;
  pierce: number; // How many enemies it can hit (0 = unlimited for area)
  areaRadius?: number; // For area damage (magic type)
}

export interface ProjectileSpawnOptions {
  startPosition: Position;
  targetPosition: Position;
  config: ProjectileConfig;
  sourceId?: string; // ID of the tower/entity that fired it
}

// Default configurations for each projectile type - easy to extend
export const PROJECTILE_CONFIGS: Record<ProjectileType, ProjectileConfig> = {
  [ProjectileType.BULLET]: {
    type: ProjectileType.BULLET,
    damage: 10,
    speed: 8,
    size: 4,
    color: 0xffdd00, // Yellow
    pierce: 1,
  },
  [ProjectileType.ARROW]: {
    type: ProjectileType.ARROW,
    damage: 15,
    speed: 5,
    size: 8,
    color: 0x8b4513, // Brown
    pierce: 2, // Can hit 2 enemies
  },
  [ProjectileType.MAGIC]: {
    type: ProjectileType.MAGIC,
    damage: 25,
    speed: 3,
    size: 10,
    color: 0x9933ff, // Purple
    pierce: 0, // Area damage hits all in radius
    areaRadius: 40,
  },
};

// ============================================================================
// Damage Types
// ============================================================================

export enum DamageType {
  PHYSICAL = 'physical',
  MAGICAL = 'magical',
  TRUE = 'true', // Ignores armor
}

export interface DamageInfo {
  amount: number;
  type: DamageType;
  sourceId?: string;
  isCritical?: boolean;
}

// ============================================================================
// Target Interface - Any entity that can receive damage
// ============================================================================

export interface ITarget {
  id: string;
  getTargetPosition(): Position;
  health: number;
  maxHealth: number;
  armor: number;
  isAlive: boolean;
  container: Container;

  takeDamage(damage: DamageInfo): void;
  getEntityBounds(): Bounds;
  onDeath?(): void;
}

// ============================================================================
// Effect Types
// ============================================================================

export enum EffectType {
  HIT = 'hit',
  DEATH = 'death',
  DAMAGE_NUMBER = 'damage_number',
  AREA_INDICATOR = 'area_indicator',
}

export interface EffectConfig {
  type: EffectType;
  position: Position;
  color?: number;
  duration?: number;
  value?: number; // For damage numbers
  radius?: number; // For area effects
}

// ============================================================================
// Event Types - For decoupled communication
// ============================================================================

export type CombatEventType =
  | 'projectile_hit'
  | 'target_damaged'
  | 'target_killed'
  | 'projectile_expired';

export interface CombatEvent {
  type: CombatEventType;
  position: Position;
  damage?: DamageInfo;
  targetId?: string;
  projectileType?: ProjectileType;
}

export type CombatEventCallback = (event: CombatEvent) => void;
