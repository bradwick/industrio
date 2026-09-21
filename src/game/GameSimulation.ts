import { MapGrid } from './MapGrid';
import { BuildingInstance, FluidNetwork, PopulationStats, Worker, TransportVehicle, GameStats } from '../types/game';
import { BUILDINGS, RECIPES, TECH_TREE } from '../data/gameData';

export class GameSimulation {
  map: MapGrid;
  buildings: Map<string, BuildingInstance>;
  fluidNetworks: FluidNetwork[];
  workers: Worker[];
  vehicles: TransportVehicle[];
  stats: GameStats;
  populationStats: PopulationStats;

  constructor(mapWidth: number = 60, mapHeight: number = 60) {
    this.map = new MapGrid(mapWidth, mapHeight);
    this.buildings = new Map();
    this.fluidNetworks = [];
    this.workers = [];
    this.vehicles = [];

    this.stats = {
      itemsProduced: {},
      techsResearched: [],
      currentTechId: null,
      techProgress: 0,
      gameTime: 0,
      won: false
    };

    this.populationStats = {
      totalHousing: 0,
      totalWorkers: 0,
      employedWorkers: 0,
      foodSupplied: false,
      waterSupplied: false
    };

    this.setupStarterState();
  }

  setupStarterState() {
    // Add starter building instances or resources if needed
  }

  addBuilding(defId: string, x: number, y: number, rotation: 0 | 90 | 180 | 270 = 0): BuildingInstance | null {
    const def = BUILDINGS[defId];
    if (!def) return null;

    let width = def.width;
    let height = def.height;
    if (rotation === 90 || rotation === 270) {
      width = def.height;
      height = def.width;
    }

    if (!this.map.canPlaceBuilding(x, y, width, height)) {
      return null;
    }

    const id = `bldg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const instance: BuildingInstance = {
      id,
      defId,
      x,
      y,
      rotation,
      inventory: {},
      outputInventory: {},
      activeRecipeId: def.allowedRecipes && def.allowedRecipes.length > 0 ? def.allowedRecipes[0] : null,
      progress: 0,
      isWorking: false,
      steamPressure: 0
    };

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = this.map.getTile(x + dx, y + dy);
        if (tile) {
          tile.buildingId = id;
        }
      }
    }

    this.buildings.set(id, instance);
    this.recalculateFluidNetworks();
    this.recalculatePopulation();
    this.updateVehicleRoutes();
    return instance;
  }

  removeBuilding(id: string) {
    const instance = this.buildings.get(id);
    if (!instance) return;

    const def = BUILDINGS[instance.defId];
    let width = def.width;
    let height = def.height;
    if (instance.rotation === 90 || instance.rotation === 270) {
      width = def.height;
      height = def.width;
    }

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = this.map.getTile(instance.x + dx, instance.y + dy);
        if (tile && tile.buildingId === id) {
          tile.buildingId = null;
        }
      }
    }

    this.buildings.delete(id);
    this.recalculateFluidNetworks();
    this.recalculatePopulation();
    this.updateVehicleRoutes();
  }

  update(dt: number) {
    this.stats.gameTime += dt;

    this.updateFluidNetworks(dt);
    this.updateProduction(dt);
    this.updateLoaders(dt);
    this.updatePopulationAndWorkers(dt);
    this.updateVehicles(dt);
    this.checkWinCondition();
  }

  recalculateFluidNetworks() {
    this.fluidNetworks = [];
    const visitedSteam = new Set<string>();
    const visitedWater = new Set<string>();

    const getTileKey = (x: number, y: number) => `${x},${y}`;

    const buildNetwork = (startX: number, startY: number, type: 'steam' | 'water', visitedSet: Set<string>) => {
      const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
      visitedSet.add(getTileKey(startX, startY));
      const tiles: { x: number; y: number }[] = [];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        tiles.push(curr);

        const neighbors = [
          { x: curr.x + 1, y: curr.y },
          { x: curr.x - 1, y: curr.y },
          { x: curr.x, y: curr.y + 1 },
          { x: curr.x, y: curr.y - 1 }
        ];

        for (const n of neighbors) {
          const key = getTileKey(n.x, n.y);
          if (visitedSet.has(key)) continue;

          const tile = this.map.getTile(n.x, n.y);
          if (!tile || !tile.buildingId) continue;

          const bldg = this.buildings.get(tile.buildingId);
          if (!bldg) continue;

          const def = BUILDINGS[bldg.defId];
          const connects = type === 'steam' ? def.pipeConnectsSteam : def.pipeConnectsWater;
          if (connects) {
            visitedSet.add(key);
            queue.push(n);
          }
        }
      }

      this.fluidNetworks.push({
        id: `net_${type}_${Date.now()}_${Math.random()}`,
        type,
        tiles,
        totalSupply: 0,
        totalDemand: 0,
        satisfaction: 1
      });
    };

    for (const bldg of this.buildings.values()) {
      const def = BUILDINGS[bldg.defId];
      const key = getTileKey(bldg.x, bldg.y);

      if (def.pipeConnectsSteam && !visitedSteam.has(key)) {
        buildNetwork(bldg.x, bldg.y, 'steam', visitedSteam);
      }
      if (def.pipeConnectsWater && !visitedWater.has(key)) {
        buildNetwork(bldg.x, bldg.y, 'water', visitedWater);
      }
    }
  }

  updateFluidNetworks(dt: number) {
    for (const net of this.fluidNetworks) {
      let totalSupply = 0;
      let totalDemand = 0;

      const connectedBldgIds = new Set<string>();
      for (const t of net.tiles) {
        const tile = this.map.getTile(t.x, t.y);
        if (tile && tile.buildingId) {
          connectedBldgIds.add(tile.buildingId);
        }
      }

      for (const bldgId of connectedBldgIds) {
        const bldg = this.buildings.get(bldgId);
        if (!bldg) continue;
        const def = BUILDINGS[bldg.defId];

        if (net.type === 'steam') {
          if (def.producesSteam && (bldg.inventory['coal'] ?? 0) > 0 && (bldg.inventory['water'] ?? 0) > 0) {
            totalSupply += def.producesSteam;
          }
          if (def.requiresSteam) {
            totalDemand += def.requiresSteam;
          }
        } else if (net.type === 'water') {
          if (def.producesWater) {
            totalSupply += def.producesWater;
          }
          if (def.requiresWater) {
            totalDemand += def.requiresWater;
          }
        }
      }

      net.totalSupply = totalSupply;
      net.totalDemand = totalDemand;
      net.satisfaction = totalDemand === 0 ? 1 : Math.min(1, totalSupply / totalDemand);

      for (const bldgId of connectedBldgIds) {
        const bldg = this.buildings.get(bldgId);
        if (!bldg) continue;
        const def = BUILDINGS[bldg.defId];

        if (net.type === 'steam' && def.requiresSteam) {
          bldg.steamPressure = net.satisfaction;
        }

        if (bldg.defId === 'boiler' && net.type === 'steam') {
          if (net.satisfaction > 0 || net.totalDemand === 0) {
            const coalCount = bldg.inventory['coal'] ?? 0;
            const waterCount = bldg.inventory['water'] ?? 0;
            if (coalCount > 0 && waterCount > 0) {
              bldg.inventory['coal'] = Math.max(0, coalCount - 0.2 * dt);
              bldg.inventory['water'] = Math.max(0, waterCount - 0.5 * dt);
            }
          }
        }
      }
    }
  }

  updateProduction(dt: number) {
    for (const bldg of this.buildings.values()) {
      const def = BUILDINGS[bldg.defId];

      if (def.extractionRate) {
        const tile = this.map.getTile(bldg.x, bldg.y);
        let resType = def.extractsResource || (tile ? tile.resource : 'none');
        const steamFactor = def.requiresSteam ? bldg.steamPressure : 1.0;

        if (steamFactor > 0 && resType !== 'none') {
          bldg.progress += dt * def.extractionRate * steamFactor;
          if (bldg.progress >= 1.0) {
            bldg.progress = 0;
            const outputItem = this.resourceToItem(resType);
            if (outputItem) {
              bldg.outputInventory[outputItem] = (bldg.outputInventory[outputItem] ?? 0) + 1;
              this.stats.itemsProduced[outputItem] = (this.stats.itemsProduced[outputItem] ?? 0) + 1;
            }
          }
        }
      }

      if (bldg.activeRecipeId) {
        const recipe = RECIPES[bldg.activeRecipeId];
        if (recipe) {
          let hasInputs = true;
          for (const inp of recipe.inputs) {
            if ((bldg.inventory[inp.itemId] ?? 0) < inp.count) {
              hasInputs = false;
              break;
            }
          }

          const steamFactor = recipe.steamRequired || def.requiresSteam ? bldg.steamPressure : 1.0;

          if (hasInputs && steamFactor > 0) {
            bldg.isWorking = true;
            bldg.progress += (dt / recipe.time) * steamFactor;

            if (bldg.progress >= 1.0) {
              bldg.progress = 0;
              for (const inp of recipe.inputs) {
                bldg.inventory[inp.itemId] -= inp.count;
              }
              for (const out of recipe.outputs) {
                bldg.outputInventory[out.itemId] = (bldg.outputInventory[out.itemId] ?? 0) + out.count;
                this.stats.itemsProduced[out.itemId] = (this.stats.itemsProduced[out.itemId] ?? 0) + out.count;
              }
            }
          } else {
            bldg.isWorking = false;
          }
        }
      }

      if (bldg.defId === 'research_lab') {
        const currentTech = this.stats.currentTechId ? TECH_TREE[this.stats.currentTechId] : null;
        if (currentTech) {
          const reqItem = currentTech.cost[0].itemId;
          const reqCount = currentTech.cost[0].count;

          if ((bldg.inventory[reqItem] ?? 0) > 0) {
            bldg.inventory[reqItem] -= 1;
            this.stats.techProgress += 1;

            if (this.stats.techProgress >= reqCount) {
              this.stats.techsResearched.push(currentTech.id);
              this.stats.currentTechId = null;
              this.stats.techProgress = 0;
            }
          }
        }
      }
    }
  }

  resourceToItem(res: string): string | null {
    switch (res) {
      case 'iron_ore': return 'iron_ore';
      case 'copper_ore': return 'copper_ore';
      case 'coal': return 'coal';
      case 'stone': return 'stone';
      case 'wood': return 'wood';
      case 'fertile': return 'grain';
      default: return null;
    }
  }

  updateLoaders(dt: number) {
    for (const bldg of this.buildings.values()) {
      const def = BUILDINGS[bldg.defId];
      if (!def.isLoader) continue;

      let inDx = 0, inDy = 0, outDx = 0, outDy = 0;
      switch (bldg.rotation) {
        case 0:   inDy = 1;  outDy = -1; break;
        case 90:  inDx = -1; outDx = 1;  break;
        case 180: inDy = -1; outDy = 1;  break;
        case 270: inDx = 1;  outDx = -1; break;
      }

      const inTile = this.map.getTile(bldg.x + inDx, bldg.y + inDy);
      const outTile = this.map.getTile(bldg.x + outDx, bldg.y + outDy);

      if (inTile && inTile.buildingId && outTile && outTile.buildingId) {
        const sourceBldg = this.buildings.get(inTile.buildingId);
        const targetBldg = this.buildings.get(outTile.buildingId);

        if (sourceBldg && targetBldg) {
          const itemKey = Object.keys(sourceBldg.outputInventory).find(k => (sourceBldg.outputInventory[k] ?? 0) > 0);
          if (itemKey) {
            sourceBldg.outputInventory[itemKey] -= 1;
            targetBldg.inventory[itemKey] = (targetBldg.inventory[itemKey] ?? 0) + 1;
          }
        }
      }
    }
  }

  recalculatePopulation() {
    let housing = 0;
    const cottages: BuildingInstance[] = [];
    const workplaces: BuildingInstance[] = [];

    for (const bldg of this.buildings.values()) {
      const def = BUILDINGS[bldg.defId];
      if (def.housingCapacity) {
        housing += def.housingCapacity;
        cottages.push(bldg);
      } else if (def.allowedRecipes || def.extractionRate) {
        workplaces.push(bldg);
      }
    }

    this.populationStats.totalHousing = housing;
    this.populationStats.totalWorkers = housing;

    // Spawn / update worker sprites walking between cottages and workplaces
    while (this.workers.length < housing) {
      const home = cottages[this.workers.length % Math.max(1, cottages.length)];
      const work = workplaces[this.workers.length % Math.max(1, workplaces.length)] || null;

      this.workers.push({
        id: `wrk_${Date.now()}_${Math.random()}`,
        x: home ? home.x : 10,
        y: home ? home.y : 10,
        homeBuildingId: home ? home.id : null,
        workBuildingId: work ? work.id : null,
        state: 'idle',
        progress: Math.random()
      } as any);
    }

    this.populationStats.employedWorkers = Math.min(this.workers.length, workplaces.length * 2);
  }

  updatePopulationAndWorkers(dt: number) {
    let foodAvailable = false;
    let waterAvailable = false;

    for (const bldg of this.buildings.values()) {
      if (bldg.defId === 'bakery' && (bldg.outputInventory['bread'] ?? 0) > 0) {
        foodAvailable = true;
      }
      if (bldg.defId === 'water_well' || bldg.defId === 'water_pump') {
        waterAvailable = true;
      }
    }

    this.populationStats.foodSupplied = foodAvailable;
    this.populationStats.waterSupplied = waterAvailable;

    // Move worker sprites back and forth
    for (const w of this.workers) {
      if (w.homeBuildingId && w.workBuildingId) {
        const home = this.buildings.get(w.homeBuildingId);
        const work = this.buildings.get(w.workBuildingId);
        if (home && work) {
          const speed = 0.5; // tile movement speed
          (w as any).progress = ((w as any).progress || 0) + dt * speed;
          if ((w as any).progress > 1.0) (w as any).progress = 0;

          const pingPong = (w as any).progress < 0.5 ? (w as any).progress * 2 : (1 - (w as any).progress) * 2;
          w.x = home.x + (work.x - home.x) * pingPong;
          w.y = home.y + (work.y - home.y) * pingPong;
        }
      }
    }
  }

  updateVehicleRoutes() {
    const caravanDepots = Array.from(this.buildings.values()).filter(b => BUILDINGS[b.defId].isCaravanDepot);
    const trainStations = Array.from(this.buildings.values()).filter(b => BUILDINGS[b.defId].isTrainStation);

    // Spawn Caravan if at least 2 depots exist
    if (caravanDepots.length >= 2 && !this.vehicles.some(v => v.type === 'caravan')) {
      this.vehicles.push({
        id: `veh_caravan_${Date.now()}`,
        type: 'caravan',
        sourceStationId: caravanDepots[0].id,
        targetStationId: caravanDepots[1].id,
        x: caravanDepots[0].x,
        y: caravanDepots[0].y,
        progress: 0,
        cargo: null,
        capacity: 10,
        path: [],
        state: 'traveling',
        timer: 0
      });
    }

    // Spawn Train if at least 2 train stations exist
    if (trainStations.length >= 2 && !this.vehicles.some(v => v.type === 'train')) {
      this.vehicles.push({
        id: `veh_train_${Date.now()}`,
        type: 'train',
        sourceStationId: trainStations[0].id,
        targetStationId: trainStations[1].id,
        x: trainStations[0].x,
        y: trainStations[0].y,
        progress: 0,
        cargo: null,
        capacity: 50,
        path: [],
        state: 'traveling',
        timer: 0
      });
    }
  }

  updateVehicles(dt: number) {
    for (const v of this.vehicles) {
      const src = this.buildings.get(v.sourceStationId);
      const tgt = this.buildings.get(v.targetStationId);

      if (src && tgt) {
        if (v.state === 'traveling') {
          v.progress += dt * 0.2;
          v.x = src.x + (tgt.x - src.x) * v.progress;
          v.y = src.y + (tgt.y - src.y) * v.progress;

          if (v.progress >= 1.0) {
            v.progress = 1.0;
            v.state = 'unloading';
          }
        } else if (v.state === 'unloading') {
          if (v.cargo) {
            tgt.inventory[v.cargo.itemId] = (tgt.inventory[v.cargo.itemId] ?? 0) + v.cargo.count;
            v.cargo = null;
          }
          v.state = 'loading';
          v.progress = 0;
          const temp = v.sourceStationId;
          v.sourceStationId = v.targetStationId;
          v.targetStationId = temp;
        } else if (v.state === 'loading') {
          const itemKey = Object.keys(src.outputInventory).find(k => (src.outputInventory[k] ?? 0) > 0);
          if (itemKey) {
            const count = Math.min(v.capacity, src.outputInventory[itemKey]);
            src.outputInventory[itemKey] -= count;
            v.cargo = { itemId: itemKey, count };
          }
          v.state = 'traveling';
        }
      }
    }
  }

  checkWinCondition() {
    for (const bldg of this.buildings.values()) {
      if (bldg.defId === 'transcontinental_terminal') {
        this.stats.won = true;
        break;
      }
    }
  }

  serialize(): string {
    return JSON.stringify({
      mapWidth: this.map.width,
      mapHeight: this.map.height,
      tiles: this.map.tiles,
      buildings: Array.from(this.buildings.entries()),
      stats: this.stats,
      populationStats: this.populationStats
    });
  }

  deserialize(jsonStr: string) {
    const data = JSON.parse(jsonStr);
    this.map.width = data.mapWidth;
    this.map.height = data.mapHeight;
    this.map.tiles = data.tiles;
    this.buildings = new Map(data.buildings);
    this.stats = data.stats;
    this.populationStats = data.populationStats;
    this.recalculateFluidNetworks();
    this.recalculatePopulation();
    this.updateVehicleRoutes();
  }
}
