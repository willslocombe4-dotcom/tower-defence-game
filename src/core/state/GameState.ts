export enum GameState {
  LOADING = 'loading',
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  VICTORY = 'victory',
  GAME_OVER = 'game_over',
}

export interface GameStateData {
  lives: number;
  maxLives: number;
  gold: number;
  currentWave: number;
  totalWaves: number;
  score: number;
}

export const DEFAULT_GAME_STATE_DATA: GameStateData = {
  lives: 20,
  maxLives: 20,
  gold: 100,
  currentWave: 0,
  totalWaves: 10,
  score: 0,
};
