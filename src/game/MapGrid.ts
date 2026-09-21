import { Tile, ResourceType } from '../types/game';

export class MapGrid {
  width: number;
  height: number;
  tiles: Tile[][];

  constructor(width: number = 60, height: number = 60) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.generateMap();
  }

  generateMap() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          resource: 'none',
          resourceAmount: 0,
          buildingId: null,
          isWaterTile: false
        });
      }
      this.tiles.push(row);
    }

    // River generation (water tiles)
    const riverX = Math.floor(this.width / 4);
    for (let y = 0; y < this.height; y++) {
      const xOffset = Math.floor(Math.sin(y / 4) * 2);
      const x = riverX + xOffset;
      if (x >= 0 && x < this.width) {
        this.tiles[y][x].isWaterTile = true;
        this.tiles[y][x].resource = 'water';
        if (x + 1 < this.width) {
          this.tiles[y][x + 1].isWaterTile = true;
          this.tiles[y][x + 1].resource = 'water';
        }
      }
    }

    // Helper to generate resource patches
    const createPatch = (resource: ResourceType, centerX: number, centerY: number, radius: number, amount: number) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = centerX + dx;
          const ny = centerY + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius && !this.tiles[ny][nx].isWaterTile) {
              this.tiles[ny][nx].resource = resource;
              this.tiles[ny][nx].resourceAmount = Math.floor(amount * (1 - dist / (radius + 1)));
            }
          }
        }
      }
    };

    // Scatter resource patches across the map
    const patchTypes: ResourceType[] = ['iron_ore', 'copper_ore', 'coal', 'stone', 'wood', 'fertile'];
    const patchCounts = Math.floor((this.width * this.height) / 400);

    for (const res of patchTypes) {
      for (let i = 0; i < Math.max(2, patchCounts); i++) {
        const cx = Math.floor(Math.random() * (this.width - 10)) + 5;
        const cy = Math.floor(Math.random() * (this.height - 10)) + 5;
        createPatch(res, cx, cy, Math.floor(Math.random() * 2) + 2, 1000 + Math.floor(Math.random() * 2000));
      }
    }
  }

  getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[y][x];
  }

  canPlaceBuilding(x: number, y: number, w: number, h: number): boolean {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (!tile || tile.buildingId !== null || tile.isWaterTile) {
          return false;
        }
      }
    }
    return true;
  }
}
