import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  let gameLoop: GameLoop;

  beforeEach(() => {
    gameLoop = new GameLoop();
  });

  describe('initial state', () => {
    it('should not be running initially', () => {
      expect(gameLoop.isRunning).toBe(false);
    });

    it('should not be paused initially', () => {
      expect(gameLoop.isPaused).toBe(false);
    });

    it('should have no callbacks initially', () => {
      expect(gameLoop.getCallbackIds()).toEqual([]);
    });
  });

  describe('start/stop/pause/resume', () => {
    it('should set running to true when started', () => {
      gameLoop.start();
      expect(gameLoop.isRunning).toBe(true);
    });

    it('should set paused to false when started', () => {
      gameLoop.pause();
      gameLoop.start();
      expect(gameLoop.isPaused).toBe(false);
    });

    it('should stop the loop', () => {
      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.isRunning).toBe(false);
    });

    it('should pause the loop', () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(true);
    });

    it('should resume the loop', () => {
      gameLoop.start();
      gameLoop.pause();
      gameLoop.resume();
      expect(gameLoop.isPaused).toBe(false);
    });
  });

  describe('update callbacks', () => {
    it('should add update callback', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      expect(gameLoop.hasUpdateCallback('test')).toBe(true);
    });

    it('should call callbacks on update', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.start();
      gameLoop.update(0.016);
      expect(callback).toHaveBeenCalledWith(0.016);
    });

    it('should not call callbacks when not running', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.update(0.016);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not call callbacks when paused', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.start();
      gameLoop.pause();
      gameLoop.update(0.016);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      gameLoop.addUpdateCallback('cb1', callback1);
      gameLoop.addUpdateCallback('cb2', callback2);
      gameLoop.start();
      gameLoop.update(0.016);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should warn when replacing existing callback', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      gameLoop.addUpdateCallback('test', callback1);
      gameLoop.addUpdateCallback('test', callback2);

      expect(warnSpy).toHaveBeenCalledWith(
        'Update callback with id "test" already exists. Replacing.'
      );
      warnSpy.mockRestore();
    });

    it('should remove callback', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      const removed = gameLoop.removeUpdateCallback('test');

      expect(removed).toBe(true);
      expect(gameLoop.hasUpdateCallback('test')).toBe(false);
    });

    it('should return false when removing non-existent callback', () => {
      const removed = gameLoop.removeUpdateCallback('nonexistent');
      expect(removed).toBe(false);
    });

    it('should return callback ids', () => {
      gameLoop.addUpdateCallback('cb1', vi.fn());
      gameLoop.addUpdateCallback('cb2', vi.fn());
      gameLoop.addUpdateCallback('cb3', vi.fn());

      const ids = gameLoop.getCallbackIds();
      expect(ids).toContain('cb1');
      expect(ids).toContain('cb2');
      expect(ids).toContain('cb3');
      expect(ids.length).toBe(3);
    });
  });

  describe('clearAllCallbacks', () => {
    it('should remove all callbacks', () => {
      gameLoop.addUpdateCallback('cb1', vi.fn());
      gameLoop.addUpdateCallback('cb2', vi.fn());

      gameLoop.clearAllCallbacks();

      expect(gameLoop.getCallbackIds()).toEqual([]);
    });

    it('should not call cleared callbacks on update', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.clearAllCallbacks();
      gameLoop.start();
      gameLoop.update(0.016);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('deltaTime handling', () => {
    it('should pass correct deltaTime to callbacks', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.start();

      gameLoop.update(0.016);
      expect(callback).toHaveBeenCalledWith(0.016);

      gameLoop.update(0.032);
      expect(callback).toHaveBeenCalledWith(0.032);
    });

    it('should handle zero deltaTime', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.start();
      gameLoop.update(0);

      expect(callback).toHaveBeenCalledWith(0);
    });

    it('should handle large deltaTime', () => {
      const callback = vi.fn();
      gameLoop.addUpdateCallback('test', callback);
      gameLoop.start();
      gameLoop.update(1.0); // 1 second

      expect(callback).toHaveBeenCalledWith(1.0);
    });
  });
});
