export type ResourceType = 'none' | 'iron_ore' | 'copper_ore' | 'coal' | 'stone' | 'wood' | 'water' | 'fertile';

export interface ItemDef {
  id: string;
  name: string;
  category: 'raw' | 'intermediate' | 'product' | 'science';
  description: string;
  color: number;
}

export interface Recipe {
  id: string;
  name: string;
  time: number; // in seconds
  inputs: { itemId: string; count: number }[];
  outputs: { itemId: string; count: number }[];
  steamRequired?: number; // steam pressure/volume consumed per cycle
}

export interface BuildingDef {
  id: string;
  name: string;
  category: 'logistics' | 'extraction' | 'power' | 'processing' | 'residential' | 'science' | 'monument';
  width: number;
  height: number;
  cost: { itemId: string; count: number }[];
  description: string;
  color: number;
  unlockedByDefault?: boolean;
  canRotate?: boolean;

  // Specific stats
  extractsResource?: ResourceType;
  extractionRate?: number; // items per second
  requiresSteam?: number; // steam units per second
  producesSteam?: number; // steam units per second
  requiresWater?: number; // water units per second
  producesWater?: number; // water units per second
  requiresFuel?: boolean;

  pipeConnectsSteam?: boolean;
  pipeConnectsWater?: boolean;

  housingCapacity?: number; // for residential
  foodWaterRadius?: number; // for housing

  allowedRecipes?: string[];
  isLoader?: boolean;
  isRoad?: boolean;
  isRail?: boolean;
  isCaravanDepot?: boolean;
  isTrainStation?: boolean;
}

export interface TechNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  prerequisites: string[];
  cost: { itemId: string; count: number }[];
  unlockedBuildings: string[];
  unlockedRecipes: string[];
}

export interface Tile {
  x: number;
  y: number;
  resource: ResourceType;
  resourceAmount: number;
  buildingId: string | null; // unique instance id
  isWaterTile?: boolean;
}

export interface BuildingInstance {
  id: string;
  defId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;

  // Inventory
  inventory: Record<string, number>;
  outputInventory: Record<string, number>;

  // Processing state
  activeRecipeId: string | null;
  progress: number; // 0 to 1
  isWorking: boolean;

  // Steam / Power status
  steamPressure: number; // 0 to 1

  // Station/Depot settings
  targetDepotId?: string | null;
  itemFilter?: string | null;
}

export interface Worker {
  id: string;
  x: number;
  y: number;
  homeBuildingId: string | null;
  workBuildingId: string | null;
  state: 'idle' | 'walking_to_work' | 'working' | 'carrying_cargo';
  carryingItem?: string;
  carryingCount?: number;
  targetX?: number;
  targetY?: number;
  path?: { x: number; y: number }[];
}

export interface TransportVehicle {
  id: string;
  type: 'caravan' | 'train';
  sourceStationId: string;
  targetStationId: string;
  x: number;
  y: number;
  progress: number; // 0 to 1 along path
  cargo: { itemId: string; count: number } | null;
  capacity: number;
  path: { x: number; y: number }[];
  state: 'loading' | 'traveling' | 'unloading';
  timer: number;
}

export interface FluidNetwork {
  id: string;
  type: 'steam' | 'water';
  tiles: { x: number; y: number }[];
  totalSupply: number;
  totalDemand: number;
  satisfaction: number; // 0 to 1 ratio
}

export interface PopulationStats {
  totalHousing: number;
  totalWorkers: number;
  employedWorkers: number;
  foodSupplied: boolean;
  waterSupplied: boolean;
}

export interface GameStats {
  itemsProduced: Record<string, number>;
  techsResearched: string[];
  currentTechId: string | null;
  techProgress: number; // science papers delivered
  gameTime: number; // seconds elapsed
  won: boolean;
}
