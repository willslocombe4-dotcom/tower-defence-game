import { Game, GameState } from './core';
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
  initialLives: 20,
  initialGold: 100,
  totalWaves: 10,
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

    // Set up game state change listener
    game.state.onStateChange('debug', (newState, oldState) => {
      console.log(`Game state changed: ${oldState} -> ${newState}`);
    });

    // Start the game
    game.start();

    // Start the first wave
    waveManager.start();

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
  window.addEventListener('keydown', (event) => {
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

  console.log('Debug controls enabled:');
  console.log('  L - Lose 1 life');
  console.log('  G - Add 50 gold');
  console.log('  W - Advance wave');
  console.log('  S - Add 100 score');
  console.log('  P - Pause/Resume');
  console.log('  O - Trigger Game Over');
  console.log('  V - Trigger Victory');
  console.log('  N - Call next wave early');
}

bootstrap();

export { game, gameMap, pathSystem, enemyManager, waveManager };
