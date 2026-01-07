import { Graphics, Container } from 'pixi.js';
import { GridPosition, WorldPosition, PathWaypoint } from './types';
import { Grid } from './Grid';

export class PathManager extends Container {
  private waypoints: PathWaypoint[] = [];
  private grid: Grid;
  private pathGraphics: Graphics;
  private showDebug: boolean = false;

  constructor(grid: Grid) {
    super();

    this.grid = grid;
    this.pathGraphics = new Graphics();
    this.addChild(this.pathGraphics);
  }

  setPath(positions: GridPosition[]): void {
    this.waypoints = positions.map((pos, index) => ({
      ...pos,
      index,
    }));

    if (this.showDebug) {
      this.drawDebugPath();
    }
  }

  getWaypoints(): PathWaypoint[] {
    return [...this.waypoints];
  }

  getWaypointCount(): number {
    return this.waypoints.length;
  }

  getWaypoint(index: number): PathWaypoint | null {
    if (index < 0 || index >= this.waypoints.length) {
      return null;
    }
    return { ...this.waypoints[index] };
  }

  getWaypointWorldPosition(index: number): WorldPosition | null {
    const waypoint = this.getWaypoint(index);
    if (!waypoint) {
      return null;
    }
    return this.grid.gridToWorldCenter(waypoint.col, waypoint.row);
  }

  getSpawnPosition(): WorldPosition | null {
    return this.getWaypointWorldPosition(0);
  }

  getExitPosition(): WorldPosition | null {
    return this.getWaypointWorldPosition(this.waypoints.length - 1);
  }

  getNextWaypoint(currentIndex: number): PathWaypoint | null {
    return this.getWaypoint(currentIndex + 1);
  }

  isAtEnd(waypointIndex: number): boolean {
    return waypointIndex >= this.waypoints.length - 1;
  }

  getDistanceToWaypoint(
    worldX: number,
    worldY: number,
    waypointIndex: number
  ): number {
    const waypointPos = this.getWaypointWorldPosition(waypointIndex);
    if (!waypointPos) {
      return Infinity;
    }

    const dx = waypointPos.x - worldX;
    const dy = waypointPos.y - worldY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDirectionToWaypoint(
    worldX: number,
    worldY: number,
    waypointIndex: number
  ): { x: number; y: number } | null {
    const waypointPos = this.getWaypointWorldPosition(waypointIndex);
    if (!waypointPos) {
      return null;
    }

    const dx = waypointPos.x - worldX;
    const dy = waypointPos.y - worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: dx / distance,
      y: dy / distance,
    };
  }

  getTotalPathLength(): number {
    let totalLength = 0;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const current = this.getWaypointWorldPosition(i);
      const next = this.getWaypointWorldPosition(i + 1);
      if (current && next) {
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    }
    return totalLength;
  }

  setDebugVisible(visible: boolean): void {
    this.showDebug = visible;
    if (visible) {
      this.drawDebugPath();
    } else {
      this.pathGraphics.clear();
    }
  }

  private drawDebugPath(): void {
    this.pathGraphics.clear();

    if (this.waypoints.length < 2) {
      return;
    }

    const firstPos = this.getWaypointWorldPosition(0);
    if (!firstPos) {
      return;
    }

    this.pathGraphics.moveTo(firstPos.x, firstPos.y);

    for (let i = 1; i < this.waypoints.length; i++) {
      const pos = this.getWaypointWorldPosition(i);
      if (pos) {
        this.pathGraphics.lineTo(pos.x, pos.y);
      }
    }

    this.pathGraphics.stroke({ color: 0xffaa00, width: 3, alpha: 0.7 });

    for (let i = 0; i < this.waypoints.length; i++) {
      const pos = this.getWaypointWorldPosition(i);
      if (pos) {
        let color = 0xffaa00;
        if (i === 0) {
          color = 0xff0000;
        } else if (i === this.waypoints.length - 1) {
          color = 0x00ff00;
        }

        this.pathGraphics.circle(pos.x, pos.y, 8);
        this.pathGraphics.fill({ color, alpha: 0.8 });
      }
    }
  }
}
