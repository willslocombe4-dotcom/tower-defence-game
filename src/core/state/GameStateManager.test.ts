import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { GameState, DEFAULT_GAME_STATE_DATA } from './GameState';

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager();
  });

  describe('initial state', () => {
    it('should start in LOADING state', () => {
      expect(manager.state).toBe(GameState.LOADING);
    });

    it('should have default lives', () => {
      expect(manager.lives).toBe(DEFAULT_GAME_STATE_DATA.lives);
    });

    it('should have default gold', () => {
      expect(manager.gold).toBe(DEFAULT_GAME_STATE_DATA.gold);
    });

    it('should start at wave 0', () => {
      expect(manager.currentWave).toBe(0);
    });

    it('should start with score 0', () => {
      expect(manager.score).toBe(0);
    });
  });

  describe('custom initial config', () => {
    it('should use custom initial lives', () => {
      const customManager = new GameStateManager({ initialLives: 50 });
      expect(customManager.lives).toBe(50);
    });

    it('should use custom initial gold', () => {
      const customManager = new GameStateManager({ initialGold: 500 });
      expect(customManager.gold).toBe(500);
    });

    it('should use custom total waves', () => {
      const customManager = new GameStateManager({ totalWaves: 15 });
      expect(customManager.stateData.totalWaves).toBe(15);
    });
  });

  describe('state transitions', () => {
    it('should transition to menu', () => {
      manager.transitionToMenu();
      expect(manager.state).toBe(GameState.MENU);
    });

    it('should start game from LOADING', () => {
      manager.startGame();
      expect(manager.state).toBe(GameState.PLAYING);
      expect(manager.isPlaying).toBe(true);
    });

    it('should start game from MENU', () => {
      manager.transitionToMenu();
      manager.startGame();
      expect(manager.state).toBe(GameState.PLAYING);
    });

    it('should not start game from PLAYING', () => {
      manager.startGame();
      const callback = vi.fn();
      manager.onStateChange('test', callback);
      manager.startGame();
      // Should remain in PLAYING, no state change
      expect(manager.state).toBe(GameState.PLAYING);
    });

    it('should pause game', () => {
      manager.startGame();
      manager.pauseGame();
      expect(manager.state).toBe(GameState.PAUSED);
    });

    it('should not pause when not playing', () => {
      manager.pauseGame();
      expect(manager.state).toBe(GameState.LOADING);
    });

    it('should resume game', () => {
      manager.startGame();
      manager.pauseGame();
      manager.resumeGame();
      expect(manager.state).toBe(GameState.PLAYING);
    });

    it('should not resume when not paused', () => {
      manager.startGame();
      manager.resumeGame();
      expect(manager.state).toBe(GameState.PLAYING);
    });

    it('should trigger game over', () => {
      manager.startGame();
      manager.triggerGameOver();
      expect(manager.state).toBe(GameState.GAME_OVER);
      expect(manager.isGameOver).toBe(true);
    });

    it('should not trigger game over when not playing', () => {
      manager.triggerGameOver();
      expect(manager.state).toBe(GameState.LOADING);
    });

    it('should trigger victory', () => {
      manager.startGame();
      manager.triggerVictory();
      expect(manager.state).toBe(GameState.VICTORY);
      expect(manager.isVictory).toBe(true);
    });

    it('should not trigger victory when not playing', () => {
      manager.triggerVictory();
      expect(manager.state).toBe(GameState.LOADING);
    });
  });

  describe('lives management', () => {
    beforeEach(() => {
      manager.startGame();
    });

    it('should lose lives', () => {
      manager.loseLife(5);
      expect(manager.lives).toBe(15);
    });

    it('should not go below zero', () => {
      manager.loseLife(100);
      expect(manager.lives).toBe(0);
    });

    it('should trigger game over when lives reach zero', () => {
      manager.loseLife(20);
      expect(manager.isGameOver).toBe(true);
    });

    it('should emit livesChanged event', () => {
      const callback = vi.fn();
      manager.on('livesChanged', 'test', callback);
      manager.loseLife(1);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('gold management', () => {
    beforeEach(() => {
      manager.startGame();
    });

    it('should add gold', () => {
      manager.addGold(50);
      expect(manager.gold).toBe(150);
    });

    it('should spend gold successfully', () => {
      const result = manager.spendGold(50);
      expect(result).toBe(true);
      expect(manager.gold).toBe(50);
    });

    it('should fail to spend more gold than available', () => {
      const result = manager.spendGold(200);
      expect(result).toBe(false);
      expect(manager.gold).toBe(100); // unchanged
    });

    it('should emit goldChanged event on add', () => {
      const callback = vi.fn();
      manager.on('goldChanged', 'test', callback);
      manager.addGold(10);
      expect(callback).toHaveBeenCalled();
    });

    it('should emit goldChanged event on spend', () => {
      const callback = vi.fn();
      manager.on('goldChanged', 'test', callback);
      manager.spendGold(10);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('score management', () => {
    it('should add score', () => {
      manager.addScore(100);
      expect(manager.score).toBe(100);
    });

    it('should emit scoreChanged event', () => {
      const callback = vi.fn();
      manager.on('scoreChanged', 'test', callback);
      manager.addScore(50);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('wave management', () => {
    beforeEach(() => {
      manager = new GameStateManager({ totalWaves: 5 });
      manager.startGame();
    });

    it('should advance wave', () => {
      manager.advanceWave();
      expect(manager.currentWave).toBe(1);
    });

    it('should set wave directly', () => {
      manager.setWave(3);
      expect(manager.currentWave).toBe(3);
    });

    it('should trigger victory when last wave completed', () => {
      manager.setWave(5);
      manager.advanceWave();
      expect(manager.isVictory).toBe(true);
    });

    it('should emit waveChanged event', () => {
      const callback = vi.fn();
      manager.on('waveChanged', 'test', callback);
      manager.advanceWave();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('reset and restart', () => {
    beforeEach(() => {
      manager.startGame();
      manager.addGold(100);
      manager.addScore(500);
      manager.loseLife(5);
      manager.advanceWave();
    });

    it('should reset to initial values', () => {
      manager.reset();
      expect(manager.lives).toBe(DEFAULT_GAME_STATE_DATA.lives);
      expect(manager.gold).toBe(DEFAULT_GAME_STATE_DATA.gold);
      expect(manager.score).toBe(0);
      expect(manager.currentWave).toBe(0);
    });

    it('should emit gameReset event', () => {
      const callback = vi.fn();
      manager.on('gameReset', 'test', callback);
      manager.reset();
      expect(callback).toHaveBeenCalled();
    });

    it('should restart and start playing', () => {
      manager.restart();
      expect(manager.isPlaying).toBe(true);
      expect(manager.lives).toBe(DEFAULT_GAME_STATE_DATA.lives);
    });

    it('should emit gameRestarted event', () => {
      const callback = vi.fn();
      manager.on('gameRestarted', 'test', callback);
      manager.restart();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('state change callbacks', () => {
    it('should call state change callback', () => {
      const callback = vi.fn();
      manager.onStateChange('test', callback);
      manager.startGame();

      expect(callback).toHaveBeenCalledWith(
        GameState.PLAYING,
        GameState.LOADING,
        expect.any(Object)
      );
    });

    it('should not call callback when state unchanged', () => {
      const callback = vi.fn();
      manager.startGame();
      manager.onStateChange('test', callback);
      manager.setState(GameState.PLAYING);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove state change callback', () => {
      const callback = vi.fn();
      manager.onStateChange('test', callback);
      manager.offStateChange('test');
      manager.startGame();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('event callbacks', () => {
    it('should register and call event callback', () => {
      const callback = vi.fn();
      manager.on('gameStarted', 'test', callback);
      manager.startGame();
      expect(callback).toHaveBeenCalled();
    });

    it('should remove event callback', () => {
      const callback = vi.fn();
      manager.on('gameStarted', 'test', callback);
      manager.off('gameStarted', 'test');
      manager.startGame();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call once callback only once', () => {
      const callback = vi.fn();
      manager.once('livesChanged', 'test', callback);
      manager.startGame();
      manager.loseLife(1);
      manager.loseLife(1);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle off for non-existent callback', () => {
      const result = manager.off('gameStarted', 'nonexistent');
      expect(result).toBe(false);
    });

    it('should handle off for non-existent event', () => {
      const result = manager.off('gamePaused', 'test');
      expect(result).toBe(false);
    });
  });

  describe('stateData', () => {
    it('should return readonly copy of state data', () => {
      const data = manager.stateData;
      expect(data.lives).toBe(DEFAULT_GAME_STATE_DATA.lives);
      expect(data.gold).toBe(DEFAULT_GAME_STATE_DATA.gold);
    });

    it('should not reflect modifications to returned object', () => {
      const data = manager.stateData as { lives: number };
      data.lives = 999;
      expect(manager.lives).toBe(DEFAULT_GAME_STATE_DATA.lives);
    });
  });

  describe('clearAllCallbacks', () => {
    it('should clear all callbacks', () => {
      const stateCallback = vi.fn();
      const eventCallback = vi.fn();

      manager.onStateChange('test', stateCallback);
      manager.on('gameStarted', 'test', eventCallback);

      manager.clearAllCallbacks();
      manager.startGame();

      expect(stateCallback).not.toHaveBeenCalled();
      expect(eventCallback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should clear callbacks and reset state', () => {
      const callback = vi.fn();
      manager.onStateChange('test', callback);
      manager.startGame();
      manager.addGold(100);

      manager.dispose();

      expect(manager.state).toBe(GameState.LOADING);
      expect(manager.gold).toBe(DEFAULT_GAME_STATE_DATA.gold);
    });
  });
});
