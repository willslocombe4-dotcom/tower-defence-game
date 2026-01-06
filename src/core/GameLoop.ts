export type UpdateCallback = (deltaTime: number) => void;

export class GameLoop {
  private updateCallbacks: Map<string, UpdateCallback> = new Map();
  private running: boolean = false;
  private paused: boolean = false;

  start(): void {
    this.running = true;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  stop(): void {
    this.running = false;
  }

  update(deltaTime: number): void {
    if (!this.running || this.paused) {
      return;
    }

    for (const callback of this.updateCallbacks.values()) {
      callback(deltaTime);
    }
  }

  addUpdateCallback(id: string, callback: UpdateCallback): void {
    if (this.updateCallbacks.has(id)) {
      console.warn(`Update callback with id "${id}" already exists. Replacing.`);
    }
    this.updateCallbacks.set(id, callback);
  }

  removeUpdateCallback(id: string): boolean {
    return this.updateCallbacks.delete(id);
  }

  hasUpdateCallback(id: string): boolean {
    return this.updateCallbacks.has(id);
  }

  clearAllCallbacks(): void {
    this.updateCallbacks.clear();
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }
}
