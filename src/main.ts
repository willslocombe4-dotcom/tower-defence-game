import { Game } from './core';
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

// Export systems for external access (debugging, UI, etc.)
let pathSystem: PathSystem;
let enemyManager: EnemyManager;
let waveManager: WaveManager;

async function bootstrap(): Promise<void> {
  try {
    await game.init();

    // Initialize path system
    pathSystem = new PathSystem();
    pathSystem.createDefaultPath(game.width, game.height);
    pathSystem.drawDebug(game.stage); // Show path visualization

    // Initialize enemy manager
    enemyManager = new EnemyManager(game.stage, pathSystem);

    // Initialize wave manager
    waveManager = new WaveManager(enemyManager);

    // Register update callbacks with game loop
    game.loop.addUpdateCallback('enemyManager', enemyManager.createUpdateCallback());
    game.loop.addUpdateCallback('waveManager', waveManager.createUpdateCallback());

    // Set up event listeners for debugging/UI feedback
    setupEventListeners();

    // Start the game
    game.start();

    // Start the first wave
    waveManager.start();

    console.log('Enemy system initialized. Waves starting...');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

/**
 * Set up event listeners for game events.
 * These can be used to update UI, play sounds, etc.
 */
function setupEventListeners(): void {
  // Enemy events
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

  // Wave events
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

// Export for external access and debugging
export { game, pathSystem, enemyManager, waveManager };
