import * as PIXI from 'pixi.js';
import { GameSimulation } from './game/GameSimulation';
import { BUILDINGS, TECH_TREE, RECIPES, ITEMS } from './data/gameData';
import { BuildingInstance } from './types/game';

const TILE_SIZE = 32;

export class GameApp {
  app!: PIXI.Application;
  sim: GameSimulation;
  worldContainer!: PIXI.Container;
  gridContainer!: PIXI.Container;
  buildingsContainer!: PIXI.Container;
  vehiclesContainer!: PIXI.Container;
  workersContainer!: PIXI.Container;

  selectedBuildingDefId: string | null = null;
  selectedRotation: 0 | 90 | 180 | 270 = 0;
  ghostGraphics!: PIXI.Graphics;

  inspectedBuilding: BuildingInstance | null = null;

  simSpeed: number = 1.0;
  isDragging: boolean = false;
  dragStart = { x: 0, y: 0 };
  cameraStart = { x: 0, y: 0 };

  constructor(mapWidth: number = 60, mapHeight: number = 60) {
    this.sim = new GameSimulation(mapWidth, mapHeight);
  }

  async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1e1e1e,
      resizeTo: window
    });

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.app.canvas);
    }

    this.worldContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();
    this.buildingsContainer = new PIXI.Container();
    this.vehiclesContainer = new PIXI.Container();
    this.workersContainer = new PIXI.Container();

    this.worldContainer.addChild(this.gridContainer);
    this.worldContainer.addChild(this.buildingsContainer);
    this.worldContainer.addChild(this.vehiclesContainer);
    this.worldContainer.addChild(this.workersContainer);

    this.ghostGraphics = new PIXI.Graphics();
    this.worldContainer.addChild(this.ghostGraphics);

    this.app.stage.addChild(this.worldContainer);

    // Initial camera position
    this.worldContainer.x = window.innerWidth / 2 - (this.sim.map.width * TILE_SIZE) / 2;
    this.worldContainer.y = window.innerHeight / 2 - (this.sim.map.height * TILE_SIZE) / 2;

    this.renderGrid();
    this.setupInputs();
    this.setupUI();

    // Game loop
    this.app.ticker.add((ticker) => {
      const dt = (ticker.deltaTime / 60) * this.simSpeed;
      if (dt > 0) {
        this.sim.update(dt);
        this.renderBuildings();
        this.renderWorkersAndVehicles();
        this.updateHUD();
        this.updateInspectModal();
      }
    });
  }

  renderGrid() {
    this.gridContainer.removeChildren();
    const g = new PIXI.Graphics();

    for (let y = 0; y < this.sim.map.height; y++) {
      for (let x = 0; x < this.sim.map.width; x++) {
        const tile = this.sim.map.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile.isWaterTile) {
          // Water tile
          g.rect(px, py, TILE_SIZE, TILE_SIZE);
          g.fill(0x2980b9);
          // Water wave details
          g.moveTo(px + 4, py + 12).lineTo(px + 12, py + 12);
          g.moveTo(px + 18, py + 22).lineTo(px + 26, py + 22);
          g.stroke({ width: 2, color: 0x5dade2, alpha: 0.6 });
        } else {
          // Base grass/dirt
          g.rect(px, py, TILE_SIZE, TILE_SIZE);
          g.fill(0x2e4053);
          g.stroke({ width: 1, color: 0x212f3d, alpha: 0.4 });

          // Resource features
          if (tile.resource === 'iron_ore') {
            g.circle(px + 8, py + 12, 5);
            g.circle(px + 22, py + 20, 6);
            g.fill(0x8b5a2b);
          } else if (tile.resource === 'copper_ore') {
            g.circle(px + 10, py + 10, 5);
            g.circle(px + 20, py + 22, 6);
            g.fill(0xb87333);
          } else if (tile.resource === 'coal') {
            g.rect(px + 6, py + 6, 8, 8);
            g.rect(px + 18, py + 16, 9, 9);
            g.fill(0x111111);
          } else if (tile.resource === 'stone') {
            g.circle(px + 10, py + 16, 6);
            g.circle(px + 22, py + 10, 5);
            g.fill(0x7f8c8d);
          } else if (tile.resource === 'wood') {
            // Tree trunk & foliage
            g.rect(px + 13, py + 18, 6, 10);
            g.fill(0x5c4033);
            g.circle(px + 16, py + 12, 9);
            g.fill(0x27ae60);
          } else if (tile.resource === 'fertile') {
            // Grain crop rows
            g.rect(px + 4, py + 6, 4, 20);
            g.rect(px + 14, py + 6, 4, 20);
            g.rect(px + 24, py + 6, 4, 20);
            g.fill(0xd4ac0d);
          }
        }
      }
    }
    this.gridContainer.addChild(g);
  }

  renderBuildings() {
    this.buildingsContainer.removeChildren();
    const g = new PIXI.Graphics();

    for (const bldg of this.sim.buildings.values()) {
      const def = BUILDINGS[bldg.defId];
      if (!def) continue;

      let w = def.width * TILE_SIZE;
      let h = def.height * TILE_SIZE;
      if (bldg.rotation === 90 || bldg.rotation === 270) {
        w = def.height * TILE_SIZE;
        h = def.width * TILE_SIZE;
      }

      const px = bldg.x * TILE_SIZE;
      const py = bldg.y * TILE_SIZE;
      const isInspected = this.inspectedBuilding?.id === bldg.id;

      // Base building footprint background
      g.rect(px + 1, py + 1, w - 2, h - 2);
      g.fill(def.color);
      g.stroke({ width: isInspected ? 3 : 1, color: isInspected ? 0xf1c40f : 0x000000 });

      // Detailed procedural building features
      if (def.isRoad) {
        if (bldg.defId === 'dirt_road') {
          // Dirt track grooves
          g.rect(px + 4, py + 12, w - 8, 8);
          g.fill(0x8b5a2b);
        } else {
          // Cobblestone paved grid
          g.rect(px + 2, py + 2, w - 4, h - 4);
          g.stroke({ width: 1, color: 0x333333 });
        }
      } else if (def.isRail) {
        // Wooden ties
        for (let i = 4; i < h; i += 8) {
          g.rect(px + 4, py + i, w - 8, 3);
          g.fill(0x5c4033);
        }
        // Dual parallel steel rails
        g.rect(px + 8, py, 3, h);
        g.rect(px + w - 11, py, 3, h);
        g.fill(0xbdc3c7);
      } else if (def.isLoader) {
        // Mechanical Grabber base & articulated arm
        g.circle(px + w / 2, py + h / 2, 8);
        g.fill(0x34495e);
        g.circle(px + w / 2, py + h / 2, 4);
        g.fill(0xf1c40f);

        // Direction pointer
        let dx = 0, dy = 0;
        if (bldg.rotation === 0) dy = -10;
        else if (bldg.rotation === 90) dx = 10;
        else if (bldg.rotation === 180) dy = 10;
        else if (bldg.rotation === 270) dx = -10;

        g.moveTo(px + w / 2, py + h / 2);
        g.lineTo(px + w / 2 + dx, py + h / 2 + dy);
        g.stroke({ width: 3, color: 0xe67e22 });
      } else if (bldg.defId === 'boiler') {
        // Boiler firebox & chimney
        g.rect(px + 6, py + 6, w - 12, h - 12);
        g.fill(0x2c3e50);
        // Firebox glowing orange
        g.rect(px + 12, py + h - 16, w - 24, 8);
        g.fill(0xe67e22);
        // Smokestack
        g.circle(px + 14, py + 14, 6);
        g.fill(0x111111);
      } else if (bldg.defId === 'furnace') {
        // Stone furnace brick arch & hearth fire
        g.rect(px + 4, py + 4, w - 8, h - 8);
        g.fill(0x6e2c00);
        g.rect(px + 10, py + 12, w - 20, h - 20);
        g.fill(0x111111);
        if (bldg.isWorking) {
          g.rect(px + 12, py + 14, w - 24, h - 24);
          g.fill(0xf39c12);
        }
      } else if (bldg.defId === 'worker_cottage') {
        // Pitched roof, door & window
        g.moveTo(px + 4, py + h / 2);
        g.lineTo(px + w / 2, py + 4);
        g.lineTo(px + w - 4, py + h / 2);
        g.fill(0x78281f);
        // Window
        g.rect(px + 8, py + h / 2 + 4, 8, 8);
        g.fill(0xf1c40f);
        // Door
        g.rect(px + w - 18, py + h - 16, 10, 14);
        g.fill(0x4a235a);
      } else if (bldg.defId === 'steam_drill') {
        // Metal frame & center drill head
        g.rect(px + 6, py + 6, w - 12, h - 12);
        g.stroke({ width: 2, color: 0x111111 });
        g.rect(px + w / 2 - 4, py + h / 2 - 8, 8, 16);
        g.fill(0x95a5a6);
      } else if (bldg.defId === 'research_lab') {
        // Grand blue dome
        g.circle(px + w / 2, py + h / 2, Math.min(w, h) / 3);
        g.fill(0x2980b9);
        g.stroke({ width: 2, color: 0xffffff });
      } else if (bldg.defId === 'water_well') {
        // Cobblestone circle & wooden arch
        g.circle(px + w / 2, py + h / 2, 10);
        g.fill(0x2980b9);
        g.stroke({ width: 3, color: 0x7f8c8d });
      } else if (def.isCaravanDepot || def.isTrainStation || bldg.defId === 'transcontinental_terminal') {
        // Depot / station canopy structure
        g.rect(px + 4, py + 4, w - 8, h - 8);
        g.stroke({ width: 2, color: 0xf39c12 });
        g.rect(px + 8, py + 8, w - 16, 8);
        g.fill(0x34495e);
      }
    }
    this.buildingsContainer.addChild(g);
  }

  renderWorkersAndVehicles() {
    this.workersContainer.removeChildren();
    this.vehiclesContainer.removeChildren();

    // Render Little Worker Men Sprites
    const gW = new PIXI.Graphics();
    for (const w of this.sim.workers) {
      const wx = w.x * TILE_SIZE + 16;
      const wy = w.y * TILE_SIZE + 16;

      // Body / Shirt (Blue/Brown)
      gW.rect(wx - 4, wy - 2, 8, 10);
      gW.fill(0x2980b9);

      // Head (Skin Tone)
      gW.circle(wx, wy - 6, 4);
      gW.fill(0xf5cba7);

      // Flat Cap / Hat (Industrial Worker Cap)
      gW.rect(wx - 5, wy - 10, 10, 3);
      gW.fill(0x4a235a);

      // Legs
      gW.rect(wx - 3, wy + 8, 2, 5);
      gW.rect(wx + 1, wy + 8, 2, 5);
      gW.fill(0x1a252f);
    }
    this.workersContainer.addChild(gW);

    // Render Vehicles (Caravans & Steam Locomotives)
    const gV = new PIXI.Graphics();
    for (const v of this.sim.vehicles) {
      const vx = v.x * TILE_SIZE + 16;
      const vy = v.y * TILE_SIZE + 16;

      if (v.type === 'caravan') {
        // Horse (brown head & body) pulling a wooden wagon
        // Wagon box
        gV.rect(vx - 10, vy - 6, 12, 12);
        gV.fill(0x8b5a2b);
        gV.stroke({ width: 1, color: 0x000000 });
        // Wagon wheels
        gV.circle(vx - 8, vy + 6, 3);
        gV.circle(vx + 0, vy + 6, 3);
        gV.fill(0x111111);
        // Horse body
        gV.rect(vx + 4, vy - 4, 8, 8);
        gV.fill(0xa0522d);
      } else if (v.type === 'train') {
        // Steam Locomotive
        // Boiler cylinder
        gV.rect(vx - 12, vy - 6, 18, 12);
        gV.fill(0x2c3e50);
        // Cabin
        gV.rect(vx + 4, vy - 10, 10, 16);
        gV.fill(0xc0392b);
        // Smokestack & Steam Puff
        gV.rect(vx - 10, vy - 11, 4, 5);
        gV.fill(0x111111);
        gV.circle(vx - 8, vy - 14, 3);
        gV.fill({ color: 0xecf0f1, alpha: 0.8 });
        // Train wheels
        gV.circle(vx - 8, vy + 6, 4);
        gV.circle(vx + 2, vy + 6, 4);
        gV.circle(vx + 10, vy + 6, 4);
        gV.fill(0x7f8c8d);
      }
    }
    this.vehiclesContainer.addChild(gV);
  }

  setupInputs() {
    const canvas = this.app.canvas;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // left click
        const tile = this.screenToTile(e.clientX, e.clientY);
        if (tile) {
          if (this.selectedBuildingDefId) {
            this.sim.addBuilding(this.selectedBuildingDefId, tile.x, tile.y, this.selectedRotation);
          } else {
            // Select placed building to inspect
            if (tile.buildingId) {
              this.inspectedBuilding = this.sim.buildings.get(tile.buildingId) || null;
              this.openInspectModal();
            } else {
              this.inspectedBuilding = null;
              this.closeInspectModal();
              this.isDragging = true;
              this.dragStart = { x: e.clientX, y: e.clientY };
              this.cameraStart = { x: this.worldContainer.x, y: this.worldContainer.y };
            }
          }
        }
      } else if (e.button === 2) { // right click
        this.selectedBuildingDefId = null;
        this.updateGhost(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.worldContainer.x = this.cameraStart.x + (e.clientX - this.dragStart.x);
        this.worldContainer.y = this.cameraStart.y + (e.clientY - this.dragStart.y);
      }
      this.updateGhost(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(0.5, this.worldContainer.scale.x * zoomFactor), 2.5);
      this.worldContainer.scale.set(newScale);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.selectedRotation = ((this.selectedRotation + 90) % 360) as 0 | 90 | 180 | 270;
      } else if (e.key === 'Escape') {
        this.selectedBuildingDefId = null;
        this.closeInspectModal();
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  screenToTile(screenX: number, screenY: number) {
    const localX = (screenX - this.worldContainer.x) / this.worldContainer.scale.x;
    const localY = (screenY - this.worldContainer.y) / this.worldContainer.scale.y;

    const tileX = Math.floor(localX / TILE_SIZE);
    const tileY = Math.floor(localY / TILE_SIZE);

    if (tileX >= 0 && tileX < this.sim.map.width && tileY >= 0 && tileY < this.sim.map.height) {
      const tile = this.sim.map.getTile(tileX, tileY);
      return tile ? { x: tileX, y: tileY, buildingId: tile.buildingId } : null;
    }
    return null;
  }

  updateGhost(screenX: number, screenY: number) {
    this.ghostGraphics.clear();
    if (!this.selectedBuildingDefId) return;

    const tile = this.screenToTile(screenX, screenY);
    if (!tile) return;

    const def = BUILDINGS[this.selectedBuildingDefId];
    if (!def) return;

    let w = def.width * TILE_SIZE;
    let h = def.height * TILE_SIZE;
    if (this.selectedRotation === 90 || this.selectedRotation === 270) {
      w = def.height * TILE_SIZE;
      h = def.width * TILE_SIZE;
    }

    const canPlace = this.sim.map.canPlaceBuilding(tile.x, tile.y, def.width, def.height);
    const color = canPlace ? 0x2ecc71 : 0xe74c3c;

    this.ghostGraphics.rect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, w, h);
    this.ghostGraphics.fill({ color, alpha: 0.5 });
  }

  setupUI() {
    this.updateBuildingButtons();

    document.getElementById('btn-speed-pause')?.addEventListener('click', () => this.simSpeed = 0);
    document.getElementById('btn-speed-1')?.addEventListener('click', () => this.simSpeed = 1.0);
    document.getElementById('btn-speed-2')?.addEventListener('click', () => this.simSpeed = 2.0);
    document.getElementById('btn-speed-4')?.addEventListener('click', () => this.simSpeed = 4.0);

    const inspectModal = document.getElementById('inspect-modal');
    document.getElementById('close-inspect')?.addEventListener('click', () => {
      this.closeInspectModal();
    });

    const techModal = document.getElementById('tech-modal');
    document.getElementById('btn-open-tech')?.addEventListener('click', () => {
      this.renderTechTree();
      if (techModal) techModal.style.display = 'block';
    });
    document.getElementById('close-tech')?.addEventListener('click', () => {
      if (techModal) techModal.style.display = 'none';
    });

    const saveModal = document.getElementById('save-modal');
    document.getElementById('btn-open-save')?.addEventListener('click', () => {
      this.refreshSaveList();
      if (saveModal) saveModal.style.display = 'block';
    });
    document.getElementById('close-save')?.addEventListener('click', () => {
      if (saveModal) saveModal.style.display = 'none';
    });

    document.getElementById('btn-save-server')?.addEventListener('click', async () => {
      const filename = (document.getElementById('save-filename') as HTMLInputElement).value;
      const data = JSON.parse(this.sim.serialize());
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data })
      });
      this.refreshSaveList();
    });
  }

  updateBuildingButtons() {
    const listEl = document.getElementById('building-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    for (const def of Object.values(BUILDINGS)) {
      const isUnlocked = def.unlockedByDefault || this.sim.stats.techsResearched.some(t => TECH_TREE[t]?.unlockedBuildings.includes(def.id));
      if (!isUnlocked) continue;

      const btn = document.createElement('button');
      btn.className = `build-btn ${this.selectedBuildingDefId === def.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${def.name}</span><small style="color: #aaa;">${def.width}x${def.height}</small>`;
      btn.onclick = () => {
        this.selectedBuildingDefId = def.id;
        this.updateBuildingButtons();
      };
      listEl.appendChild(btn);
    }
  }

  openInspectModal() {
    const modal = document.getElementById('inspect-modal');
    if (modal) modal.style.display = 'block';
    this.updateInspectModal();
  }

  closeInspectModal() {
    const modal = document.getElementById('inspect-modal');
    if (modal) modal.style.display = 'none';
    this.inspectedBuilding = null;
  }

  updateInspectModal() {
    if (!this.inspectedBuilding) return;
    const body = document.getElementById('inspect-body');
    const title = document.getElementById('inspect-title');
    if (!body || !title) return;

    const bldg = this.inspectedBuilding;
    const def = BUILDINGS[bldg.defId];
    if (!def) return;

    title.innerText = def.name;

    let recipeOptionsHtml = '';
    if (def.allowedRecipes && def.allowedRecipes.length > 0) {
      recipeOptionsHtml = `
        <div style="margin-bottom: 10px;">
          <label style="font-weight: bold;">Active Recipe:</label>
          <select id="select-recipe" style="width: 100%; padding: 6px; margin-top: 4px; background: #222; color: #fff; border: 1px solid #555;">
            ${def.allowedRecipes.map(rId => {
              const rec = RECIPES[rId];
              return `<option value="${rId}" ${bldg.activeRecipeId === rId ? 'selected' : ''}>${rec ? rec.name : rId}</option>`;
            }).join('')}
          </select>
        </div>
      `;
    }

    const invHtml = Object.entries(bldg.inventory).map(([k, v]) => `<div>${ITEMS[k]?.name || k}: ${v.toFixed(1)}</div>`).join('') || 'Empty';
    const outInvHtml = Object.entries(bldg.outputInventory).map(([k, v]) => `<div>${ITEMS[k]?.name || k}: ${v.toFixed(1)}</div>`).join('') || 'Empty';

    body.innerHTML = `
      <p style="font-size: 13px; color: #aaa; margin-bottom: 10px;">${def.description}</p>
      ${recipeOptionsHtml}
      ${def.requiresSteam ? `<div style="margin-bottom: 6px;">Steam Pressure: ${(bldg.steamPressure * 100).toFixed(0)}%</div>` : ''}
      <div style="display: flex; gap: 20px; margin-top: 10px;">
        <div style="flex: 1;">
          <strong>Input Inventory:</strong>
          <div style="font-size: 12px; margin-top: 4px;">${invHtml}</div>
        </div>
        <div style="flex: 1;">
          <strong>Output Inventory:</strong>
          <div style="font-size: 12px; margin-top: 4px;">${outInvHtml}</div>
        </div>
      </div>
      <button id="btn-demolish" class="btn" style="background: #e74c3c; color: #fff; margin-top: 15px; width: 100%;">Demolish Building</button>
    `;

    document.getElementById('select-recipe')?.addEventListener('change', (e) => {
      bldg.activeRecipeId = (e.target as HTMLSelectElement).value;
      bldg.progress = 0;
    });

    document.getElementById('btn-demolish')?.addEventListener('click', () => {
      this.sim.removeBuilding(bldg.id);
      this.closeInspectModal();
    });
  }

  renderTechTree() {
    const container = document.getElementById('tech-list');
    if (!container) return;
    container.innerHTML = '';

    for (const tech of Object.values(TECH_TREE)) {
      const isResearched = this.sim.stats.techsResearched.includes(tech.id);
      const isCurrent = this.sim.stats.currentTechId === tech.id;

      const card = document.createElement('div');
      card.style.cssText = `background: #2a2d32; border: 1px solid ${isResearched ? '#2ecc71' : isCurrent ? '#f39c12' : '#555'}; border-radius: 6px; padding: 10px; margin-bottom: 8px;`;

      card.innerHTML = `
        <div style="font-weight: bold; font-size: 16px; color: ${isResearched ? '#2ecc71' : '#fff'};">${tech.icon} ${tech.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-top: 4px;">${tech.description}</div>
        <div style="margin-top: 8px;">
          ${isResearched ? '<span style="color: #2ecc71; font-weight: bold;">Unlocked ✓</span>' :
            isCurrent ? `<span style="color: #f39c12;">Researching... (${this.sim.stats.techProgress}/${tech.cost[0].count})</span>` :
            `<button class="btn" id="btn-research-${tech.id}">Start Research</button>`}
        </div>
      `;

      container.appendChild(card);

      if (!isResearched && !isCurrent) {
        document.getElementById(`btn-research-${tech.id}`)?.addEventListener('click', () => {
          this.sim.stats.currentTechId = tech.id;
          this.sim.stats.techProgress = 0;
          this.renderTechTree();
          this.updateBuildingButtons();
        });
      }
    }
  }

  async refreshSaveList() {
    const listEl = document.getElementById('server-saves-list');
    if (!listEl) return;
    listEl.innerHTML = 'Loading...';

    try {
      const res = await fetch('/api/saves');
      const json = await res.json();
      listEl.innerHTML = '';

      for (const save of json.saves) {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; padding: 6px; background: #222; margin-bottom: 4px; border-radius: 4px;';
        div.innerHTML = `<span>${save}</span><button class="btn" style="padding: 2px 6px;">Load</button>`;
        div.querySelector('button')?.addEventListener('click', async () => {
          const loadRes = await fetch(`/api/load/${save}`);
          const loadData = await loadRes.json();
          this.sim.deserialize(JSON.stringify(loadData.data));
          this.renderGrid();
          this.updateBuildingButtons();
          document.getElementById('save-modal')!.style.display = 'none';
        });
        listEl.appendChild(div);
      }
    } catch (e) {
      listEl.innerHTML = 'Failed to load saves.';
    }
  }

  updateHUD() {
    const wEl = document.getElementById('stat-workers');
    if (wEl) wEl.innerText = `${this.sim.populationStats.employedWorkers}/${this.sim.populationStats.totalWorkers}`;

    const fEl = document.getElementById('stat-food');
    if (fEl) fEl.innerText = this.sim.populationStats.foodSupplied ? 'Yes ✓' : 'No ✗';

    const wtEl = document.getElementById('stat-water');
    if (wtEl) wtEl.innerText = this.sim.populationStats.waterSupplied ? 'Yes ✓' : 'No ✗';
  }
}
