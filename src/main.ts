import { Game } from './core';

const game = new Game({
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  containerId: 'game-container',
});

async function bootstrap(): Promise<void> {
  try {
    await game.init();
    game.start();

    game.loop.addUpdateCallback('debug', (deltaTime) => {
      // Game update logic will go here
      void deltaTime;
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

bootstrap();

export { game };
