import * as PIXI from 'pixi.js';

export class SpriteGenerator {
  static textures: Record<string, PIXI.Texture> = {};

  static generateAll(): Record<string, PIXI.Texture> {
    if (Object.keys(this.textures).length > 0) return this.textures;

    this.textures['water'] = this.createWaterTexture();
    this.textures['grass'] = this.createGrassTexture();
    this.textures['iron_ore'] = this.createResourceTexture(0x8b5a2b, 0xd35400, 'iron');
    this.textures['copper_ore'] = this.createResourceTexture(0xb87333, 0xe67e22, 'copper');
    this.textures['coal'] = this.createResourceTexture(0x1a1a1a, 0x444444, 'coal');
    this.textures['stone'] = this.createResourceTexture(0x7f8c8d, 0xbdc3c7, 'stone');
    this.textures['wood'] = this.createTreeTexture();
    this.textures['fertile'] = this.createGrainTexture();

    // Buildings
    this.textures['bldg_dirt_road'] = this.createRoadTexture(false);
    this.textures['bldg_paved_road'] = this.createRoadTexture(true);
    this.textures['bldg_rail_line'] = this.createRailTexture();
    this.textures['bldg_boiler'] = this.createBoilerTexture();
    this.textures['bldg_furnace'] = this.createFurnaceTexture();
    this.textures['bldg_worker_cottage'] = this.createCottageTexture();
    this.textures['bldg_steam_drill'] = this.createDrillTexture();
    this.textures['bldg_assembly_workshop'] = this.createWorkshopTexture();
    this.textures['bldg_heavy_foundry'] = this.createFoundryTexture();
    this.textures['bldg_research_lab'] = this.createLabTexture();
    this.textures['bldg_caravan_depot'] = this.createDepotTexture();
    this.textures['bldg_train_station'] = this.createStationTexture();
    this.textures['bldg_transcontinental_terminal'] = this.createTerminalTexture();

    // Entities
    this.textures['worker'] = this.createWorkerTexture();
    this.textures['locomotive'] = this.createLocomotiveTexture();
    this.textures['caravan'] = this.createCaravanTexture();

    return this.textures;
  }

  private static createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  private static canvasToTexture(canvas: HTMLCanvasElement): PIXI.Texture {
    return PIXI.Texture.from(canvas);
  }

  private static createWaterTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    const grad = ctx.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, '#1a5276');
    grad.addColorStop(1, '#2980b9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Wave highlights
    ctx.strokeStyle = '#5dade2';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const y = 10 + i * 12;
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.bezierCurveTo(20, y - 4, 30, y + 4, 42, y);
      ctx.stroke();
    }
    return this.canvasToTexture(canvas);
  }

  private static createGrassTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#273746';
    ctx.fillRect(0, 0, 64, 64);

    // Subtle ground noise & grass blades
    ctx.fillStyle = '#1e8449';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 60;
      const y = Math.random() * 60;
      ctx.fillRect(x, y, 3, 3);
    }
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 58 + 2;
      const y = Math.random() * 58 + 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 5);
      ctx.stroke();
    }
    return this.canvasToTexture(canvas);
  }

  private static createResourceTexture(baseHex: number, highlightHex: number, type: string): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#273746';
    ctx.fillRect(0, 0, 64, 64);

    const baseColor = '#' + baseHex.toString(16).padStart(6, '0');
    const highlightColor = '#' + highlightHex.toString(16).padStart(6, '0');

    // Rock mound
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.fill();

    // Ore flecks / cracks
    ctx.fillStyle = highlightColor;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 8 + Math.random() * 10;
      const x = 32 + Math.cos(angle) * r;
      const y = 32 + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.canvasToTexture(canvas);
  }

  private static createTreeTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#273746';
    ctx.fillRect(0, 0, 64, 64);

    // Trunk
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(26, 36, 12, 22);

    // Tiered Canopy
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.arc(32, 28, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(32, 22, 14, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createGrainTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#1e8449';
    ctx.fillRect(0, 0, 64, 64);

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    for (let x = 8; x < 64; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 56);
      ctx.lineTo(x, 12);
      ctx.stroke();

      // Grain heads
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(x, 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.canvasToTexture(canvas);
  }

  private static createRoadTexture(paved: boolean): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(32, 32);
    if (paved) {
      ctx.fillStyle = '#5d6d7e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 32; i += 8) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(32, i); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6e2c00';
      ctx.fillRect(8, 0, 16, 32);
    }
    return this.canvasToTexture(canvas);
  }

  private static createRailTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#273746';
    ctx.fillRect(0, 0, 32, 32);

    // Wooden ties
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(4, 4, 24, 4);
    ctx.fillRect(4, 14, 24, 4);
    ctx.fillRect(4, 24, 24, 4);

    // Steel rails
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(8, 0, 3, 32);
    ctx.fillRect(21, 0, 3, 32);

    return this.canvasToTexture(canvas);
  }

  private static createBoilerTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#78281f';
    ctx.fillRect(2, 2, 60, 60);

    // Boiler tank cylinder
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(10, 10, 44, 44);

    // Metallic rivets
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(14, 14, 4, 4);
    ctx.fillRect(46, 14, 4, 4);
    ctx.fillRect(14, 46, 4, 4);
    ctx.fillRect(46, 46, 4, 4);

    // Firebox window
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(24, 36, 16, 12);

    // Smokestack
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(32, 20, 8, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createFurnaceTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#6e2c00';
    ctx.fillRect(2, 2, 60, 60);

    // Furnace opening
    ctx.fillStyle = '#111111';
    ctx.fillRect(16, 20, 32, 32);

    // Glowing fire hearth
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(32, 38, 12, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createCottageTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    // Walls
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(4, 16, 56, 44);

    // Roof
    ctx.fillStyle = '#78281f';
    ctx.beginPath();
    ctx.moveTo(2, 16);
    ctx.lineTo(32, 2);
    ctx.lineTo(62, 16);
    ctx.closePath();
    ctx.fill();

    // Door & Windows
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(12, 26, 10, 10);
    ctx.fillRect(42, 26, 10, 10);

    ctx.fillStyle = '#4a235a';
    ctx.fillRect(26, 36, 12, 24);

    return this.canvasToTexture(canvas);
  }

  private static createDrillTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(2, 2, 60, 60);

    // Heavy iron gear frame
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(12, 12, 40, 40);

    // Drill bit
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(32, 32, 12, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createWorkshopTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#16a085';
    ctx.fillRect(2, 2, 60, 60);

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(24, 24, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(40, 40, 12, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createFoundryTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(96, 96);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(4, 4, 88, 88);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 20, 56, 56);

    ctx.fillStyle = '#f39c12';
    ctx.fillRect(36, 36, 24, 24);

    return this.canvasToTexture(canvas);
  }

  private static createLabTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(96, 96);
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(4, 4, 88, 88);

    // Stained glass dome
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(48, 48, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    return this.canvasToTexture(canvas);
  }

  private static createDepotTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(2, 2, 60, 60);

    ctx.fillStyle = '#5c4033';
    ctx.fillRect(10, 10, 44, 44);

    return this.canvasToTexture(canvas);
  }

  private static createStationTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(96, 64);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(2, 2, 92, 60);

    ctx.fillStyle = '#f39c12';
    ctx.fillRect(10, 10, 76, 16);

    return this.canvasToTexture(canvas);
  }

  private static createTerminalTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(128, 128);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(4, 4, 120, 120);

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(16, 16, 96, 96);

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(64, 64, 32, 0, Math.PI * 2);
    ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createWorkerTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(24, 24);
    // Body
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(6, 8, 12, 10);

    // Head
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(12, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cap
    ctx.fillStyle = '#4a235a';
    ctx.fillRect(5, 1, 14, 3);

    // Boots
    ctx.fillStyle = '#111111';
    ctx.fillRect(6, 18, 4, 5);
    ctx.fillRect(14, 18, 4, 5);

    return this.canvasToTexture(canvas);
  }

  private static createLocomotiveTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(32, 32);
    // Boiler body
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(2, 10, 20, 12);

    // Cab
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(20, 4, 10, 18);

    // Smokestack
    ctx.fillStyle = '#111111';
    ctx.fillRect(4, 4, 4, 6);

    // Wheels
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath(); ctx.arc(6, 24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 24, 4, 0, Math.PI * 2); ctx.fill();

    return this.canvasToTexture(canvas);
  }

  private static createCaravanTexture(): PIXI.Texture {
    const { canvas, ctx } = this.createCanvas(32, 32);
    // Wagon box
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(2, 8, 16, 12);

    // Horse
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(20, 10, 10, 8);

    // Wheels
    ctx.fillStyle = '#111111';
    ctx.beginPath(); ctx.arc(5, 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 22, 3, 0, Math.PI * 2); ctx.fill();

    return this.canvasToTexture(canvas);
  }
}
