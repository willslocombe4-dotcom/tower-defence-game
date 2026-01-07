export { Entity } from './Entity';
export { Projectile } from './Projectile';
export { Enemy, ENEMY_CONFIGS } from './Enemy';
export type { ProjectileOptions } from './Projectile';
export type { EnemyConfig, EnemyType } from './Enemy';
// Re-export enemy variants from enemies folder for backwards compatibility
export { FastEnemy, TankEnemy, FlyingEnemy } from './enemies';
