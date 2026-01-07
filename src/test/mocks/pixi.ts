import { vi } from 'vitest';

// Mock Graphics class
export class MockGraphics {
  tint: number = 0xffffff;
  destroyed: boolean = false;

  clear = vi.fn().mockReturnThis();
  rect = vi.fn().mockReturnThis();
  circle = vi.fn().mockReturnThis();
  fill = vi.fn().mockReturnThis();
  stroke = vi.fn().mockReturnThis();
  destroy = vi.fn(() => {
    this.destroyed = true;
  });
}

// Mock Container class
export class MockContainer {
  children: MockContainer[] = [];
  x: number = 0;
  y: number = 0;
  visible: boolean = true;
  eventMode: string = 'auto';
  cursor: string = 'default';
  position = {
    set: vi.fn((x: number, y: number) => {
      this.x = x;
      this.y = y;
    }),
  };

  addChild = vi.fn((child: MockContainer) => {
    this.children.push(child);
    return child;
  });

  removeChild = vi.fn((child: MockContainer) => {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
    return child;
  });

  destroy = vi.fn((options?: { children?: boolean }) => {
    if (options?.children) {
      this.children.forEach(child => child.destroy?.());
    }
    this.children = [];
  });
}

// Mock Application class
export class MockApplication {
  stage = new MockContainer();
  canvas = document.createElement('canvas');
  ticker = {
    add: vi.fn(),
    remove: vi.fn(),
  };

  init = vi.fn().mockResolvedValue(undefined);
  destroy = vi.fn();
}

// Setup the mock for pixi.js module
export function setupPixiMock() {
  vi.mock('pixi.js', () => ({
    Application: MockApplication,
    Container: MockContainer,
    Graphics: MockGraphics,
    Assets: {
      addBundle: vi.fn(),
      loadBundle: vi.fn().mockResolvedValue({}),
    },
  }));
}
