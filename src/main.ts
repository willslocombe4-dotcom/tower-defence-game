import { Game, GameState } from './core';

const game = new Game({
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  containerId: 'game-container',
  initialLives: 20,
  initialGold: 100,
  totalWaves: 10,
});

async function bootstrap(): Promise<void> {
  try {
    await game.init();
    game.start();

    game.state.onStateChange('debug', (newState, oldState) => {
      console.log(`Game state changed: ${oldState} -> ${newState}`);
    });

    game.loop.addUpdateCallback('debug', (deltaTime) => {
      // Game update logic will go here
      void deltaTime;
    });

    setupDebugControls();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
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
}

bootstrap();

export { game };
