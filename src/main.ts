import { Game, GameState } from './core';
import { GameMap, level1 } from './map';
import {
  PathSystem,
  EnemyManager,
  WaveManager,
  ProjectileManager,
  CombatSystem,
  EffectsManager,
} from './systems';
import { ProjectileType } from './types/combat';
import { ControlsHelpUI } from './ui';
import {
  EnemySpawnedEventData,
  EnemyKilledEventData,
  EnemyReachedEndEventData,
  WaveStartedEventData,
  WaveCompletedEventData,
  AllWavesCompletedEventData,
} from './types';

const game = new Game({
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  containerId: 'game-container',
  initialLives: 20,
  initialGold: 100,
  totalWaves: 10,
});

// Game systems
let gameMap: GameMap;
let pathSystem: PathSystem;
let enemyManager: EnemyManager;
let waveManager: WaveManager;

// Combat systems
let projectileManager: ProjectileManager;
let combatSystem: CombatSystem;
let effectsManager: EffectsManager;

// UI
let controlsHelpUI: ControlsHelpUI;

async function bootstrap(): Promise<void> {
  try {
    await game.init();

    // Initialize map
    gameMap = new GameMap(level1);
    gameMap.centerInContainer(game.width, game.height);
    game.stage.addChild(gameMap);
    gameMap.setDebugPathVisible(true);

    // Initialize path system from map
    pathSystem = new PathSystem();
    pathSystem.createPathFromMap(gameMap);

    // Initialize enemy manager
    enemyManager = new EnemyManager(game.stage, pathSystem);

    // Initialize wave manager
    waveManager = new WaveManager(enemyManager);

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

    // Register update callbacks with game loop
    game.loop.addUpdateCallback('enemyManager', enemyManager.createUpdateCallback());
    game.loop.addUpdateCallback('waveManager', waveManager.createUpdateCallback());
    game.loop.addUpdateCallback('combat', (deltaTime) => {
      projectileManager.update(deltaTime);
      combatSystem.update(deltaTime);
      effectsManager.update(deltaTime);
    });

    // Set up tile click handling for tower placement
    gameMap.onTileClick((event) => {
      if (event.canBuild) {
        console.log(
          `Clicked buildable tile at (${event.gridPosition.col}, ${event.gridPosition.row})`
        );
        event.tile.placeTower();
      }
    });

    // Set up event listeners for debugging/UI feedback
    setupEventListeners();

    // Set up game state change listener
    game.state.onStateChange('debug', (newState, oldState) => {
      console.log(`Game state changed: ${oldState} -> ${newState}`);
    });

    // Start the game
    game.start();

    // Start the first wave
    waveManager.start();

    // Initialize controls help UI
    controlsHelpUI = new ControlsHelpUI({
      screenWidth: game.width,
      screenHeight: game.height,
    });
    game.stage.addChild(controlsHelpUI);

    // Set up debug controls
    setupDebugControls();

    console.log('Game initialized. Waves starting...');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

function setupEventListeners(): void {
  enemyManager.on<EnemySpawnedEventData>('enemy_spawned', (event) => {
    const { enemy } = event.data;
    console.log(`Enemy spawned: ${enemy.type} (${enemy.id})`);
  });

  enemyManager.on<EnemyKilledEventData>('enemy_killed', (event) => {
    const { enemy, reward } = event.data;
    console.log(`Enemy killed: ${enemy.id} - Reward: ${reward} gold`);
    game.addGold(reward);
    game.addScore(reward * 10);
  });

  enemyManager.on<EnemyReachedEndEventData>('enemy_reached_end', (event) => {
    const { enemy, damage } = event.data;
    console.log(`Enemy reached base: ${enemy.id} - Damage: ${damage}`);
    game.loseLife(damage);
  });

  waveManager.on<WaveStartedEventData>('wave_started', (event) => {
    const { waveNumber, totalEnemies } = event.data;
    console.log(`=== Wave ${waveNumber} Started === (${totalEnemies} enemies)`);
    game.state.setWave(waveNumber);
  });

  waveManager.on<WaveCompletedEventData>('wave_completed', (event) => {
    const { waveNumber, enemiesKilled, enemiesLeaked } = event.data;
    console.log(`=== Wave ${waveNumber} Complete === Killed: ${enemiesKilled}, Leaked: ${enemiesLeaked}`);
  });

  waveManager.on<AllWavesCompletedEventData>('all_waves_completed', (event) => {
    const { totalWaves, totalKills } = event.data;
    console.log(`All ${totalWaves} waves completed! Total kills: ${totalKills}`);
    game.triggerVictory();
  });
}

function setupDebugControls(): void {
  let selectedProjectileType: ProjectileType = ProjectileType.BULLET;

  window.addEventListener('keydown', (event) => {
    // Toggle controls help (works anytime)
    if (event.key === 'h' || event.key === 'H') {
      controlsHelpUI.toggle();
      return;
    }

    // Projectile type selection (works anytime)
    switch (event.key) {
      case '1':
        selectedProjectileType = ProjectileType.BULLET;
        console.log('Selected: Bullet');
        return;
      case '2':
        selectedProjectileType = ProjectileType.ARROW;
        console.log('Selected: Arrow');
        return;
      case '3':
        selectedProjectileType = ProjectileType.MAGIC;
        console.log('Selected: Magic');
        return;
    }

    // Game controls (require playing or paused state)
    if (!game.isPlaying && game.state.state !== GameState.PAUSED) return;

    switch (event.key) {
      case 'l':
        game.loseLife(1);
        console.log(`Lost 1 life. Lives remaining: ${game.state.lives}`);
        break;
      case 'g':
        game.addGold(50);
        console.log(`Added 50 gold. Total gold: ${game.state.gold}`);
        break;
      case 'w':
        game.advanceWave();
        console.log(`Advanced to wave ${game.state.currentWave}`);
        break;
      case 's':
        game.addScore(100);
        console.log(`Added 100 score. Total score: ${game.state.score}`);
        break;
      case 'p':
        if (game.state.state === GameState.PAUSED) {
          game.resume();
          console.log('Game resumed');
        } else {
          game.pause();
          console.log('Game paused');
        }
        break;
      case 'o':
        game.triggerGameOver();
        break;
      case 'v':
        game.triggerVictory();
        break;
      case 'n':
        waveManager.callNextWaveEarly();
        console.log('Called next wave early');
        break;
    }
  });

  // Click to fire projectiles (for testing combat)
  game.pixiApp.canvas.addEventListener('click', (e) => {
    if (!game.isPlaying) return;

    const rect = game.pixiApp.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Fire from bottom center of screen
    const startX = game.width / 2;
    const startY = game.height - 50;

    projectileManager.spawn({
      start: { x: startX, y: startY },
      target: { x: mouseX, y: mouseY },
      type: selectedProjectileType,
    });
  });

  console.log('Debug controls enabled:');
  console.log('  H - Toggle controls help panel');
  console.log('  L - Lose 1 life');
  console.log('  G - Add 50 gold');
  console.log('  W - Advance wave');
  console.log('  S - Add 100 score');
  console.log('  P - Pause/Resume');
  console.log('  O - Trigger Game Over');
  console.log('  V - Trigger Victory');
  console.log('  N - Call next wave early');
  console.log('  1/2/3 - Select projectile type (Bullet/Arrow/Magic)');
  console.log('  Click - Fire projectile at mouse position');
}

bootstrap();

export { game, gameMap, pathSystem, enemyManager, waveManager, projectileManager, combatSystem, effectsManager, controlsHelpUI };
