import { Graphics, Container } from 'pixi.js';
import { Waypoint, PathDefinition } from '../types';

/**
 * Manages enemy paths through the game map.
 *
 * Features:
 * - Store and retrieve waypoint paths
 * - Multiple named paths support
 * - Debug visualization
 * - Path length calculation
 *
 * Future enhancements:
 * - Bezier curve paths for smooth movement
 * - Path branching/merging
 * - Dynamic path modification
 * - Path validation
 */
export class PathSystem {
  private paths: Map<string, PathDefinition> = new Map();
  private defaultPathId: string = 'main';
  private debugGraphics: Graphics | null = null;
  private isDebugVisible: boolean = false;

  constructor() {}

  /**
   * Add or update a path definition.
   */
  addPath(path: PathDefinition): void {
    this.paths.set(path.id, path);
  }

  /**
   * Get a path by ID.
   */
  getPath(id: string): PathDefinition | undefined {
    return this.paths.get(id);
  }

  /**
   * Get the default path.
   */
  getDefaultPath(): PathDefinition | undefined {
    return this.paths.get(this.defaultPathId);
  }

  /**
   * Get waypoints for a path.
   */
  getWaypoints(pathId?: string): Waypoint[] {
    const path = pathId ? this.paths.get(pathId) : this.getDefaultPath();
    return path ? [...path.waypoints] : [];
  }

  /**
   * Set the default path ID.
   */
  setDefaultPath(id: string): void {
    this.defaultPathId = id;
  }

  /**
   * Get the spawn point (first waypoint) of a path.
   */
  getSpawnPoint(pathId?: string): Waypoint | null {
    const waypoints = this.getWaypoints(pathId);
    return waypoints.length > 0 ? waypoints[0] : null;
  }

  /**
   * Get the end point (last waypoint) of a path.
   */
  getEndPoint(pathId?: string): Waypoint | null {
    const waypoints = this.getWaypoints(pathId);
    return waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;
  }

  /**
   * Calculate the total length of a path.
   */
  getPathLength(pathId?: string): number {
    const waypoints = this.getWaypoints(pathId);
    let length = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dx = waypoints[i].x - waypoints[i - 1].x;
      const dy = waypoints[i].y - waypoints[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Create a default S-curve path for testing.
   */
  createDefaultPath(gameWidth: number, gameHeight: number): void {
    const path: PathDefinition = {
      id: 'main',
      waypoints: [
        { x: -50, y: gameHeight * 0.5 },                  // Start off-screen left
        { x: gameWidth * 0.1, y: gameHeight * 0.5 },
        { x: gameWidth * 0.2, y: gameHeight * 0.25 },
        { x: gameWidth * 0.35, y: gameHeight * 0.25 },
        { x: gameWidth * 0.45, y: gameHeight * 0.5 },
        { x: gameWidth * 0.55, y: gameHeight * 0.75 },
        { x: gameWidth * 0.7, y: gameHeight * 0.75 },
        { x: gameWidth * 0.8, y: gameHeight * 0.5 },
        { x: gameWidth * 0.9, y: gameHeight * 0.5 },
        { x: gameWidth + 50, y: gameHeight * 0.5 },       // End off-screen right
      ],
    };
    this.addPath(path);
    this.setDefaultPath('main');
  }

  /**
   * Create a straight horizontal path for testing.
   */
  createStraightPath(gameWidth: number, gameHeight: number): void {
    const path: PathDefinition = {
      id: 'straight',
      waypoints: [
        { x: -50, y: gameHeight * 0.5 },
        { x: gameWidth + 50, y: gameHeight * 0.5 },
      ],
    };
    this.addPath(path);
  }

  /**
   * Draw debug visualization of paths.
   */
  drawDebug(container: Container, pathId?: string): void {
    this.clearDebug();

    this.debugGraphics = new Graphics();

    const waypoints = this.getWaypoints(pathId);
    if (waypoints.length < 2) return;

    // Draw path road/track
    this.debugGraphics.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      this.debugGraphics.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.debugGraphics.stroke({
      color: 0x4a4a4a,
      width: 40,
      alpha: 0.6,
      cap: 'round',
      join: 'round',
    });

    // Draw path center line
    this.debugGraphics.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      this.debugGraphics.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.debugGraphics.stroke({
      color: 0x666666,
      width: 4,
      alpha: 0.4,
    });

    // Draw waypoint markers
    waypoints.forEach((wp, index) => {
      // Waypoint circle
      this.debugGraphics!.circle(wp.x, wp.y, 8);
      this.debugGraphics!.fill({
        color: index === 0 ? 0x00ff00 : index === waypoints.length - 1 ? 0xff0000 : 0xffff00,
        alpha: 0.7,
      });

      // Waypoint border
      this.debugGraphics!.circle(wp.x, wp.y, 8);
      this.debugGraphics!.stroke({ color: 0x000000, width: 2, alpha: 0.5 });
    });

    container.addChildAt(this.debugGraphics, 0); // Add at bottom layer
    this.isDebugVisible = true;
  }

  /**
   * Clear debug visualization.
   */
  clearDebug(): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
    this.isDebugVisible = false;
  }

  /**
   * Toggle debug visualization.
   */
  toggleDebug(container: Container, pathId?: string): void {
    if (this.isDebugVisible) {
      this.clearDebug();
    } else {
      this.drawDebug(container, pathId);
    }
  }

  /**
   * Show debug visualization.
   */
  showDebug(): void {
    if (this.debugGraphics) {
      this.debugGraphics.visible = true;
      this.isDebugVisible = true;
    }
  }

  /**
   * Hide debug visualization.
   */
  hideDebug(): void {
    if (this.debugGraphics) {
      this.debugGraphics.visible = false;
      this.isDebugVisible = false;
    }
  }

  /**
   * Check if a point is on the path (within tolerance).
   */
  isPointOnPath(x: number, y: number, tolerance: number = 20, pathId?: string): boolean {
    const waypoints = this.getWaypoints(pathId);
    if (waypoints.length < 2) return false;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const dist = this.pointToLineDistance(
        x, y,
        waypoints[i].x, waypoints[i].y,
        waypoints[i + 1].x, waypoints[i + 1].y
      );
      if (dist <= tolerance) return true;
    }
    return false;
  }

  /**
   * Calculate distance from point to line segment.
   */
  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    // Project point onto line
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
  }

  /**
   * Get all path IDs.
   */
  getPathIds(): string[] {
    return Array.from(this.paths.keys());
  }

  /**
   * Remove a path.
   */
  removePath(id: string): boolean {
    return this.paths.delete(id);
  }

  /**
   * Clear all paths.
   */
  clearAllPaths(): void {
    this.paths.clear();
    this.clearDebug();
  }
}
