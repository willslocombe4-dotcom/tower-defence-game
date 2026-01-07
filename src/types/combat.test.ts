import { describe, it, expect } from 'vitest';
import {
  ProjectileType,
  PROJECTILE_CONFIGS,
  DamageType,
  EffectType,
} from './combat';
import type {
  Position,
  Bounds,
  DamageInfo,
  ProjectileSpawnOptions,
  EffectConfig,
  CombatEvent,
  CombatEventType,
} from './combat';

describe('Combat Types', () => {
  describe('Position interface', () => {
    it('should have x and y properties', () => {
      const position: Position = { x: 100, y: 200 };
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });
  });

  describe('Bounds interface', () => {
    it('should have x, y, width, and height properties', () => {
      const bounds: Bounds = { x: 10, y: 20, width: 50, height: 60 };
      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(20);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(60);
    });
  });

  describe('ProjectileType enum', () => {
    it('should have all expected projectile types', () => {
      expect(ProjectileType.BULLET).toBe('bullet');
      expect(ProjectileType.ARROW).toBe('arrow');
      expect(ProjectileType.MAGIC).toBe('magic');
    });

    it('should have 3 projectile types', () => {
      expect(Object.keys(ProjectileType).length).toBe(3);
    });
  });

  describe('PROJECTILE_CONFIGS', () => {
    it('should have configs for all projectile types', () => {
      Object.values(ProjectileType).forEach((type) => {
        expect(PROJECTILE_CONFIGS[type]).toBeDefined();
      });
    });

    it('should have required properties in each config', () => {
      Object.values(PROJECTILE_CONFIGS).forEach((config) => {
        expect(config.type).toBeDefined();
        expect(config.damage).toBeGreaterThan(0);
        expect(config.speed).toBeGreaterThan(0);
        expect(config.size).toBeGreaterThan(0);
        expect(config.color).toBeGreaterThanOrEqual(0);
        expect(config.pierce).toBeGreaterThanOrEqual(0);
      });
    });

    describe('BULLET projectile', () => {
      const config = PROJECTILE_CONFIGS[ProjectileType.BULLET];

      it('should have correct type', () => {
        expect(config.type).toBe(ProjectileType.BULLET);
      });

      it('should be fast', () => {
        expect(config.speed).toBeGreaterThan(PROJECTILE_CONFIGS[ProjectileType.MAGIC].speed);
      });

      it('should hit only one enemy', () => {
        expect(config.pierce).toBe(1);
      });

      it('should not have area radius', () => {
        expect(config.areaRadius).toBeUndefined();
      });
    });

    describe('ARROW projectile', () => {
      const config = PROJECTILE_CONFIGS[ProjectileType.ARROW];

      it('should have correct type', () => {
        expect(config.type).toBe(ProjectileType.ARROW);
      });

      it('should pierce multiple enemies', () => {
        expect(config.pierce).toBe(2);
      });

      it('should not have area radius', () => {
        expect(config.areaRadius).toBeUndefined();
      });
    });

    describe('MAGIC projectile', () => {
      const config = PROJECTILE_CONFIGS[ProjectileType.MAGIC];

      it('should have correct type', () => {
        expect(config.type).toBe(ProjectileType.MAGIC);
      });

      it('should have highest damage', () => {
        expect(config.damage).toBeGreaterThan(PROJECTILE_CONFIGS[ProjectileType.BULLET].damage);
        expect(config.damage).toBeGreaterThan(PROJECTILE_CONFIGS[ProjectileType.ARROW].damage);
      });

      it('should be slowest', () => {
        expect(config.speed).toBeLessThan(PROJECTILE_CONFIGS[ProjectileType.BULLET].speed);
        expect(config.speed).toBeLessThan(PROJECTILE_CONFIGS[ProjectileType.ARROW].speed);
      });

      it('should have area radius', () => {
        expect(config.areaRadius).toBeGreaterThan(0);
      });

      it('should have unlimited pierce (0)', () => {
        expect(config.pierce).toBe(0);
      });
    });
  });

  describe('DamageType enum', () => {
    it('should have all expected damage types', () => {
      expect(DamageType.PHYSICAL).toBe('physical');
      expect(DamageType.MAGICAL).toBe('magical');
      expect(DamageType.TRUE).toBe('true');
    });

    it('should have 3 damage types', () => {
      expect(Object.keys(DamageType).length).toBe(3);
    });
  });

  describe('DamageInfo interface', () => {
    it('should support basic damage info', () => {
      const damage: DamageInfo = {
        amount: 25,
        type: DamageType.PHYSICAL,
      };
      expect(damage.amount).toBe(25);
      expect(damage.type).toBe(DamageType.PHYSICAL);
    });

    it('should support optional sourceId', () => {
      const damage: DamageInfo = {
        amount: 50,
        type: DamageType.MAGICAL,
        sourceId: 'mage-tower-1',
      };
      expect(damage.sourceId).toBe('mage-tower-1');
    });

    it('should support optional isCritical', () => {
      const damage: DamageInfo = {
        amount: 100,
        type: DamageType.PHYSICAL,
        isCritical: true,
      };
      expect(damage.isCritical).toBe(true);
    });
  });

  describe('EffectType enum', () => {
    it('should have all expected effect types', () => {
      expect(EffectType.HIT).toBe('hit');
      expect(EffectType.DEATH).toBe('death');
      expect(EffectType.DAMAGE_NUMBER).toBe('damage_number');
      expect(EffectType.AREA_INDICATOR).toBe('area_indicator');
    });

    it('should have 4 effect types', () => {
      expect(Object.keys(EffectType).length).toBe(4);
    });
  });

  describe('EffectConfig interface', () => {
    it('should support basic effect config', () => {
      const effect: EffectConfig = {
        type: EffectType.HIT,
        position: { x: 100, y: 100 },
      };
      expect(effect.type).toBe(EffectType.HIT);
      expect(effect.position).toEqual({ x: 100, y: 100 });
    });

    it('should support optional properties', () => {
      const effect: EffectConfig = {
        type: EffectType.DAMAGE_NUMBER,
        position: { x: 100, y: 100 },
        color: 0xff0000,
        duration: 500,
        value: 25,
        radius: 50,
      };
      expect(effect.color).toBe(0xff0000);
      expect(effect.duration).toBe(500);
      expect(effect.value).toBe(25);
      expect(effect.radius).toBe(50);
    });
  });

  describe('ProjectileSpawnOptions interface', () => {
    it('should support spawn options', () => {
      const options: ProjectileSpawnOptions = {
        startPosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
        config: PROJECTILE_CONFIGS[ProjectileType.BULLET],
      };
      expect(options.startPosition).toEqual({ x: 100, y: 100 });
      expect(options.targetPosition).toEqual({ x: 200, y: 200 });
    });

    it('should support optional sourceId', () => {
      const options: ProjectileSpawnOptions = {
        startPosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
        config: PROJECTILE_CONFIGS[ProjectileType.ARROW],
        sourceId: 'tower-1',
      };
      expect(options.sourceId).toBe('tower-1');
    });
  });

  describe('CombatEvent interface', () => {
    it('should support all event types', () => {
      const eventTypes: CombatEventType[] = [
        'projectile_hit',
        'target_damaged',
        'target_killed',
        'projectile_expired',
      ];

      eventTypes.forEach((type) => {
        const event: CombatEvent = {
          type,
          position: { x: 100, y: 100 },
        };
        expect(event.type).toBe(type);
      });
    });

    it('should support optional data properties', () => {
      const event: CombatEvent = {
        type: 'target_damaged',
        position: { x: 100, y: 100 },
        damage: { amount: 50, type: DamageType.PHYSICAL },
        targetId: 'enemy-1',
        projectileType: ProjectileType.BULLET,
      };

      expect(event.damage?.amount).toBe(50);
      expect(event.targetId).toBe('enemy-1');
      expect(event.projectileType).toBe(ProjectileType.BULLET);
    });
  });
});
