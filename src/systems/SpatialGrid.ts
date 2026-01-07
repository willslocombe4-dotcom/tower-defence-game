import type { Position, Bounds } from '../types/combat';

/**
 * Spatial hash grid for efficient collision detection.
 * Divides the game world into cells and tracks which entities are in each cell.
 * This reduces collision checks from O(n*m) to approximately O(n+m) for sparse distributions.
 *
 * Usage:
 * ```typescript
 * const grid = new SpatialGrid(1280, 720, 64);
 * grid.insert('enemy1', enemy.getBounds());
 * const nearby = grid.query(projectile.getBounds());
 * ```
 */
export class SpatialGrid<T = string> {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private cells: Map<number, Set<T>> = new Map();
  private entityCells: Map<T, Set<number>> = new Map();

  /**
   * Create a spatial hash grid.
   * @param worldWidth - Width of the game world
   * @param worldHeight - Height of the game world
   * @param cellSize - Size of each grid cell (default: 64)
   */
  constructor(worldWidth: number, worldHeight: number, cellSize: number = 64) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
  }

  /**
   * Get the cell index for a position.
   */
  private getCellIndex(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    // Clamp to grid bounds
    const clampedCol = Math.max(0, Math.min(this.cols - 1, col));
    const clampedRow = Math.max(0, Math.min(this.rows - 1, row));
    return clampedRow * this.cols + clampedCol;
  }

  /**
   * Get all cell indices that a bounds overlaps.
   */
  private getCellIndices(bounds: Bounds): number[] {
    const indices: number[] = [];

    const minCol = Math.max(0, Math.floor(bounds.x / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((bounds.x + bounds.width) / this.cellSize));
    const minRow = Math.max(0, Math.floor(bounds.y / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((bounds.y + bounds.height) / this.cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        indices.push(row * this.cols + col);
      }
    }

    return indices;
  }

  /**
   * Insert an entity into the grid.
   * @param entity - Entity identifier
   * @param bounds - Entity's bounding box
   */
  insert(entity: T, bounds: Bounds): void {
    const cellIndices = this.getCellIndices(bounds);

    // Track which cells this entity is in
    if (!this.entityCells.has(entity)) {
      this.entityCells.set(entity, new Set());
    }
    const entityCellSet = this.entityCells.get(entity)!;

    for (const index of cellIndices) {
      if (!this.cells.has(index)) {
        this.cells.set(index, new Set());
      }
      this.cells.get(index)!.add(entity);
      entityCellSet.add(index);
    }
  }

  /**
   * Remove an entity from the grid.
   * @param entity - Entity identifier
   */
  remove(entity: T): void {
    const cellSet = this.entityCells.get(entity);
    if (!cellSet) return;

    for (const index of cellSet) {
      const cell = this.cells.get(index);
      if (cell) {
        cell.delete(entity);
        if (cell.size === 0) {
          this.cells.delete(index);
        }
      }
    }

    this.entityCells.delete(entity);
  }

  /**
   * Update an entity's position in the grid.
   * More efficient than remove + insert for moving entities.
   * @param entity - Entity identifier
   * @param bounds - Entity's new bounding box
   */
  update(entity: T, bounds: Bounds): void {
    const newCellIndices = new Set(this.getCellIndices(bounds));
    const oldCellSet = this.entityCells.get(entity);

    if (!oldCellSet) {
      // Entity wasn't in grid, just insert
      this.insert(entity, bounds);
      return;
    }

    // Remove from cells no longer occupied
    for (const index of oldCellSet) {
      if (!newCellIndices.has(index)) {
        const cell = this.cells.get(index);
        if (cell) {
          cell.delete(entity);
          if (cell.size === 0) {
            this.cells.delete(index);
          }
        }
        oldCellSet.delete(index);
      }
    }

    // Add to new cells
    for (const index of newCellIndices) {
      if (!oldCellSet.has(index)) {
        if (!this.cells.has(index)) {
          this.cells.set(index, new Set());
        }
        this.cells.get(index)!.add(entity);
        oldCellSet.add(index);
      }
    }
  }

  /**
   * Query for entities that might overlap with a bounds.
   * Returns candidates - you still need to do precise collision checks.
   * @param bounds - Query bounding box
   * @param exclude - Optional entity to exclude from results
   */
  query(bounds: Bounds, exclude?: T): T[] {
    const cellIndices = this.getCellIndices(bounds);
    const candidates = new Set<T>();

    for (const index of cellIndices) {
      const cell = this.cells.get(index);
      if (cell) {
        for (const entity of cell) {
          if (entity !== exclude) {
            candidates.add(entity);
          }
        }
      }
    }

    return Array.from(candidates);
  }

  /**
   * Query for entities near a point.
   * @param position - Center point
   * @param radius - Search radius
   * @param exclude - Optional entity to exclude
   */
  queryRadius(position: Position, radius: number, exclude?: T): T[] {
    return this.query(
      {
        x: position.x - radius,
        y: position.y - radius,
        width: radius * 2,
        height: radius * 2,
      },
      exclude
    );
  }

  /**
   * Query for entities in a specific cell (by position).
   */
  queryCell(x: number, y: number): T[] {
    const index = this.getCellIndex(x, y);
    const cell = this.cells.get(index);
    return cell ? Array.from(cell) : [];
  }

  /**
   * Clear all entities from the grid.
   */
  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  /**
   * Get the number of entities in the grid.
   */
  get entityCount(): number {
    return this.entityCells.size;
  }

  /**
   * Get the number of occupied cells.
   */
  get cellCount(): number {
    return this.cells.size;
  }

  /**
   * Get grid statistics for debugging.
   */
  getStats(): {
    entityCount: number;
    cellCount: number;
    avgEntitiesPerCell: number;
    maxEntitiesInCell: number;
  } {
    let maxEntitiesInCell = 0;
    let totalEntities = 0;

    for (const cell of this.cells.values()) {
      totalEntities += cell.size;
      maxEntitiesInCell = Math.max(maxEntitiesInCell, cell.size);
    }

    return {
      entityCount: this.entityCells.size,
      cellCount: this.cells.size,
      avgEntitiesPerCell: this.cells.size > 0 ? totalEntities / this.cells.size : 0,
      maxEntitiesInCell,
    };
  }
}
