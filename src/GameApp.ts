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
        let color = 0x2c3e50; // base ground

        if (tile.isWaterTile) {
          color = 0x2980b9;
        } else if (tile.resource === 'iron_ore') {
          color = 0x8b5a2b;
        } else if (tile.resource === 'copper_ore') {
          color = 0xb87333;
        } else if (tile.resource === 'coal') {
          color = 0x111111;
        } else if (tile.resource === 'stone') {
          color = 0x7f8c8d;
        } else if (tile.resource === 'wood') {
          color = 0x27ae60;
        } else if (tile.resource === 'fertile') {
          color = 0xd4ac0d;
        }

        g.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        g.fill(color);
        g.stroke({ width: 1, color: 0x1a252f, alpha: 0.3 });
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

      g.rect(px + 1, py + 1, w - 2, h - 2);
      g.fill(def.color);
      g.stroke({ width: isInspected ? 3 : 2, color: isInspected ? 0xf1c40f : 0xffffff });

      // Grabber / Loader rotation marker
      if (def.isLoader) {
        let arrowX = px + w / 2;
        let arrowY = py + h / 2;
        g.circle(arrowX, arrowY, 4);
        g.fill(0xffd700);
      }
    }
    this.buildingsContainer.addChild(g);
  }

  renderWorkersAndVehicles() {
    this.workersContainer.removeChildren();
    this.vehiclesContainer.removeChildren();

    const gW = new PIXI.Graphics();
    for (const w of this.sim.workers) {
      gW.circle(w.x * TILE_SIZE + 16, w.y * TILE_SIZE + 16, 5);
      gW.fill(0xf39c12);
      gW.stroke({ width: 1, color: 0x000000 });
    }
    this.workersContainer.addChild(gW);

    const gV = new PIXI.Graphics();
    for (const v of this.sim.vehicles) {
      const color = v.type === 'train' ? 0xc0392b : 0x8e44ad;
      gV.rect(v.x * TILE_SIZE + 8, v.y * TILE_SIZE + 8, 16, 16);
      gV.fill(color);
      gV.stroke({ width: 1, color: 0xffffff });
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
