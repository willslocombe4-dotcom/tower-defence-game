import { Game } from './core';
import { GameMap, level1 } from './map';

const game = new Game({
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  containerId: 'game-container',
});

let gameMap: GameMap;

async function bootstrap(): Promise<void> {
  try {
    await game.init();

    gameMap = new GameMap(level1);
    gameMap.centerInContainer(game.width, game.height);
    game.stage.addChild(gameMap);

    gameMap.setDebugPathVisible(true);

    gameMap.onTileClick((event) => {
      if (event.canBuild) {
        console.log(
          `Clicked buildable tile at (${event.gridPosition.col}, ${event.gridPosition.row})`
        );
        event.tile.placeTower();
      }
    });

    game.start();

    game.loop.addUpdateCallback('game', (deltaTime) => {
      void deltaTime;
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

bootstrap();

export { game, gameMap };
