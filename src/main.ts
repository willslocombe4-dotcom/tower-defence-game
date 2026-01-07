import { Game } from './core';
import { Enemy } from './entities';
import { ProjectileManager, CombatSystem, EffectsManager } from './systems';
import { ProjectileType } from './types/combat';

const game = new Game({
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  containerId: 'game-container',
});

// Systems (initialized after game.init)
let projectileManager: ProjectileManager;
let combatSystem: CombatSystem;
let effectsManager: EffectsManager;

// Test enemies
const enemies: Enemy[] = [];

async function bootstrap(): Promise<void> {
  try {
    await game.init();

    // Initialize combat systems
    projectileManager = new ProjectileManager(game.stage);
    combatSystem = new CombatSystem(projectileManager);
    effectsManager = new EffectsManager(game.stage);

    // Wire up combat events to effects
    combatSystem.on('projectile_hit', (event) => {
      effectsManager.playHitEffect(event.position);
      if (event.projectileType === ProjectileType.MAGIC) {
        effectsManager.playAreaIndicator(event.position, 40, 0x9933ff);
      }
    });

    combatSystem.on('target_damaged', (event) => {
      if (event.damage) {
        effectsManager.playDamageNumber(event.position, event.damage.amount);
      }
    });

    combatSystem.on('target_killed', (event) => {
      effectsManager.playDeathEffect(event.position);
    });

    // Create test enemies
    spawnTestEnemies();

    // Register main update loop
    game.loop.addUpdateCallback('combat', (deltaTime) => {
      projectileManager.update(deltaTime);
      combatSystem.update(deltaTime);
      effectsManager.update(deltaTime);

      // Update enemies
      for (const enemy of enemies) {
        enemy.update(deltaTime);
      }

      // Clean up dead enemies
      cleanupDeadEnemies();
    });

    // Demo: Click to fire projectiles at mouse position
    setupClickToFire();

    game.start();

    console.log('Combat system initialized! Click anywhere to fire projectiles.');
    console.log('Press 1 for Bullet, 2 for Arrow, 3 for Magic');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

function spawnTestEnemies(): void {
  // Spawn a variety of test enemies
  const enemyConfigs = [
    { type: 'basic' as const, x: 400, y: 200 },
    { type: 'basic' as const, x: 500, y: 300 },
    { type: 'fast' as const, x: 600, y: 200 },
    { type: 'tank' as const, x: 700, y: 350 },
    { type: 'flying' as const, x: 800, y: 250 },
    { type: 'basic' as const, x: 900, y: 400 },
    { type: 'tank' as const, x: 500, y: 500 },
  ];

  for (const config of enemyConfigs) {
    const enemy = Enemy.create(config.type);
    enemy.setPosition(config.x, config.y);

    // Give enemies a simple patrol path
    enemy.setPath([
      { x: config.x, y: config.y },
      { x: config.x + 100, y: config.y },
      { x: config.x + 100, y: config.y + 50 },
      { x: config.x, y: config.y + 50 },
      { x: config.x, y: config.y },
    ]);

    enemies.push(enemy);
    game.stage.addChild(enemy.container);
    combatSystem.registerTarget(enemy);
  }
}

function cleanupDeadEnemies(): void {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (!enemy.isAlive) {
      combatSystem.unregisterTarget(enemy.id);
      game.stage.removeChild(enemy.container);
      enemy.destroy();
      enemies.splice(i, 1);
    }
  }
}

function setupClickToFire(): void {
  let selectedType: ProjectileType = ProjectileType.BULLET;

  // Keyboard selection
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1':
        selectedType = ProjectileType.BULLET;
        console.log('Selected: Bullet');
        break;
      case '2':
        selectedType = ProjectileType.ARROW;
        console.log('Selected: Arrow');
        break;
      case '3':
        selectedType = ProjectileType.MAGIC;
        console.log('Selected: Magic');
        break;
      case 'r':
      case 'R':
        // Respawn enemies
        for (const enemy of enemies) {
          combatSystem.unregisterTarget(enemy.id);
          game.stage.removeChild(enemy.container);
          enemy.destroy();
        }
        enemies.length = 0;
        spawnTestEnemies();
        console.log('Enemies respawned!');
        break;
    }
  });

  // Click to fire
  game.pixiApp.canvas.addEventListener('click', (e) => {
    const rect = game.pixiApp.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Fire from bottom center of screen
    const startX = game.width / 2;
    const startY = game.height - 50;

    projectileManager.spawn({
      start: { x: startX, y: startY },
      target: { x: mouseX, y: mouseY },
      type: selectedType,
    });
  });
}

bootstrap();

export { game, projectileManager, combatSystem, effectsManager };
