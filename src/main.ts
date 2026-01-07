import { Game } from './core';
import { GameMap, level1 } from './map';
import { PathSystem, EnemyManager, WaveManager } from './systems';
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
});

// Game systems
let gameMap: GameMap;
let pathSystem: PathSystem;
let enemyManager: EnemyManager;
let waveManager: WaveManager;

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

    // Register update callbacks with game loop
    game.loop.addUpdateCallback('enemyManager', enemyManager.createUpdateCallback());
    game.loop.addUpdateCallback('waveManager', waveManager.createUpdateCallback());

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

    // Start the game
    game.start();

    // Start the first wave
    waveManager.start();

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
  });

  enemyManager.on<EnemyReachedEndEventData>('enemy_reached_end', (event) => {
    const { enemy, damage } = event.data;
    console.log(`Enemy reached base: ${enemy.id} - Damage: ${damage}`);
  });

  waveManager.on<WaveStartedEventData>('wave_started', (event) => {
    const { waveNumber, totalEnemies } = event.data;
    console.log(`=== Wave ${waveNumber} Started === (${totalEnemies} enemies)`);
  });

  waveManager.on<WaveCompletedEventData>('wave_completed', (event) => {
    const { waveNumber, enemiesKilled, enemiesLeaked } = event.data;
    console.log(`=== Wave ${waveNumber} Complete === Killed: ${enemiesKilled}, Leaked: ${enemiesLeaked}`);
  });

  waveManager.on<AllWavesCompletedEventData>('all_waves_completed', (event) => {
    const { totalWaves, totalKills } = event.data;
    console.log(`All ${totalWaves} waves completed! Total kills: ${totalKills}`);
  });
}

bootstrap();

export { game, gameMap, pathSystem, enemyManager, waveManager };
