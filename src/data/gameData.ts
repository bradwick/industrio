import { ItemDef, Recipe, BuildingDef, TechNode } from './game';

export const ITEMS: Record<string, ItemDef> = {
  // Raw Materials
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', category: 'raw', description: 'Mined iron ore.', color: 0x8b5a2b },
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', category: 'raw', description: 'Mined copper ore.', color: 0xb87333 },
  coal: { id: 'coal', name: 'Coal', category: 'raw', description: 'Combustible black rock used for fuel.', color: 0x222222 },
  stone: { id: 'stone', name: 'Stone', category: 'raw', description: 'Raw quarried stone.', color: 0x888888 },
  wood: { id: 'wood', name: 'Wood', category: 'raw', description: 'Logs harvested from forests.', color: 0x5c4033 },
  water_bucket: { id: 'water_bucket', name: 'Fresh Water', category: 'raw', description: 'Fresh water for drinking or boilers.', color: 0x3388ff },
  grain: { id: 'grain', name: 'Grain', category: 'raw', description: 'Harvested wheat for food.', color: 0xdaa520 },

  // Intermediate Products
  iron_ingot: { id: 'iron_ingot', name: 'Iron Ingot', category: 'intermediate', description: 'Smelted iron bar.', color: 0xd3d3d3 },
  copper_ingot: { id: 'copper_ingot', name: 'Copper Ingot', category: 'intermediate', description: 'Smelted copper bar.', color: 0xe67e22 },
  steel: { id: 'steel', name: 'Steel Plate', category: 'intermediate', description: 'Refined strong steel alloy.', color: 0x708090 },
  gear: { id: 'gear', name: 'Iron Gear', category: 'intermediate', description: 'Mechanical component.', color: 0x95a5a6 },
  copper_wire: { id: 'copper_wire', name: 'Copper Wire', category: 'intermediate', description: 'Drawn copper wiring.', color: 0xd35400 },
  pipe: { id: 'pipe', name: 'Steam Pipe', category: 'intermediate', description: 'Heavy iron piping for steam/water.', color: 0x34495e },
  reinforced_plate: { id: 'reinforced_plate', name: 'Reinforced Plate', category: 'intermediate', description: 'Heavy steel plating for engines and structures.', color: 0x2c3e50 },
  bread: { id: 'bread', name: 'Bread', category: 'intermediate', description: 'Nourishing baked bread for citizens.', color: 0xcd853f },

  // Advanced / Science
  steam_engine_part: { id: 'steam_engine_part', name: 'Engine Component', category: 'product', description: 'Pistons, valves, and precision parts.', color: 0xe74c3c },
  patent_paper_1: { id: 'patent_paper_1', name: 'Scientific Paper I', category: 'science', description: 'Basic industrial research report.', color: 0x3498db },
  patent_paper_2: { id: 'patent_paper_2', name: 'Scientific Paper II', category: 'science', description: 'Advanced metallurgy & steam technology research.', color: 0x9b59b6 },
  rail_track: { id: 'rail_track', name: 'Rail Track', category: 'intermediate', description: 'Steel rails mounted on wooden ties.', color: 0x7f8c8d },
  locomotive: { id: 'locomotive', name: 'Steam Locomotive', category: 'product', description: 'Heavy steam engine for rail logistics.', color: 0xc0392b }
};

export const RECIPES: Record<string, Recipe> = {
  smelt_iron: {
    id: 'smelt_iron',
    name: 'Smelt Iron Ingot',
    time: 2,
    inputs: [{ itemId: 'iron_ore', count: 1 }],
    outputs: [{ itemId: 'iron_ingot', count: 1 }]
  },
  smelt_copper: {
    id: 'smelt_copper',
    name: 'Smelt Copper Ingot',
    time: 2,
    inputs: [{ itemId: 'copper_ore', count: 1 }],
    outputs: [{ itemId: 'copper_ingot', count: 1 }]
  },
  smelt_steel: {
    id: 'smelt_steel',
    name: 'Refine Steel',
    time: 4,
    inputs: [{ itemId: 'iron_ingot', count: 2 }, { itemId: 'coal', count: 1 }],
    outputs: [{ itemId: 'steel', count: 1 }]
  },
  make_gear: {
    id: 'make_gear',
    name: 'Craft Iron Gear',
    time: 1,
    inputs: [{ itemId: 'iron_ingot', count: 1 }],
    outputs: [{ itemId: 'gear', count: 2 }]
  },
  make_wire: {
    id: 'make_wire',
    name: 'Craft Copper Wire',
    time: 1,
    inputs: [{ itemId: 'copper_ingot', count: 1 }],
    outputs: [{ itemId: 'copper_wire', count: 2 }]
  },
  make_pipe: {
    id: 'make_pipe',
    name: 'Forge Steam Pipe',
    time: 1.5,
    inputs: [{ itemId: 'iron_ingot', count: 1 }],
    outputs: [{ itemId: 'pipe', count: 2 }]
  },
  make_reinforced_plate: {
    id: 'make_reinforced_plate',
    name: 'Manufacture Reinforced Plate',
    time: 3,
    inputs: [{ itemId: 'steel', count: 2 }, { itemId: 'gear', count: 2 }],
    outputs: [{ itemId: 'reinforced_plate', count: 1 }],
    steamRequired: 5
  },
  make_engine_part: {
    id: 'make_engine_part',
    name: 'Assemble Engine Component',
    time: 4,
    inputs: [{ itemId: 'steel', count: 1 }, { itemId: 'gear', count: 3 }, { itemId: 'copper_wire', count: 2 }],
    outputs: [{ itemId: 'steam_engine_part', count: 1 }],
    steamRequired: 10
  },
  bake_bread: {
    id: 'bake_bread',
    name: 'Bake Bread',
    time: 2,
    inputs: [{ itemId: 'grain', count: 2 }],
    outputs: [{ itemId: 'bread', count: 2 }]
  },
  make_science_1: {
    id: 'make_science_1',
    name: 'Research Paper I',
    time: 5,
    inputs: [{ itemId: 'wood', count: 2 }, { itemId: 'iron_ingot', count: 1 }],
    outputs: [{ itemId: 'patent_paper_1', count: 1 }]
  },
  make_science_2: {
    id: 'make_science_2',
    name: 'Research Paper II',
    time: 8,
    inputs: [{ itemId: 'patent_paper_1', count: 1 }, { itemId: 'copper_wire', count: 2 }, { itemId: 'gear', count: 2 }],
    outputs: [{ itemId: 'patent_paper_2', count: 1 }],
    steamRequired: 10
  },
  make_rail_track: {
    id: 'make_rail_track',
    name: 'Forge Rail Track',
    time: 2,
    inputs: [{ itemId: 'steel', count: 1 }, { itemId: 'wood', count: 2 }],
    outputs: [{ itemId: 'rail_track', count: 4 }]
  },
  make_locomotive: {
    id: 'make_locomotive',
    name: 'Build Locomotive',
    time: 10,
    inputs: [{ itemId: 'steam_engine_part', count: 4 }, { itemId: 'reinforced_plate', count: 4 }],
    outputs: [{ itemId: 'locomotive', count: 1 }],
    steamRequired: 20
  }
};

export const BUILDINGS: Record<string, BuildingDef> = {
  // Logistics & Infrastructure
  dirt_road: {
    id: 'dirt_road',
    name: 'Dirt Road / Path',
    category: 'logistics',
    width: 1,
    height: 1,
    cost: [{ itemId: 'stone', count: 1 }],
    description: 'Allows workers and caravans to travel twice as fast.',
    color: 0xa0522d,
    unlockedByDefault: true,
    isRoad: true
  },
  paved_road: {
    id: 'paved_road',
    name: 'Cobblestone Road',
    category: 'logistics',
    width: 1,
    height: 1,
    cost: [{ itemId: 'stone', count: 2 }],
    description: 'High quality paved road giving maximum worker speed boost.',
    color: 0x708090,
    unlockedByDefault: false,
    isRoad: true
  },
  rail_line: {
    id: 'rail_line',
    name: 'Railway Line',
    category: 'logistics',
    width: 1,
    height: 1,
    cost: [{ itemId: 'rail_track', count: 1 }],
    description: 'Tracks for heavy steam locomotive transport.',
    color: 0x333333,
    unlockedByDefault: false,
    isRail: true
  },
  steam_grabber: {
    id: 'steam_grabber',
    name: 'Mechanical Grabber',
    category: 'logistics',
    width: 1,
    height: 1,
    cost: [{ itemId: 'iron_ingot', count: 2 }, { itemId: 'gear', count: 1 }],
    description: 'Transfers items between adjacent buildings or roads.',
    color: 0xe67e22,
    unlockedByDefault: true,
    canRotate: true,
    isLoader: true
  },
  caravan_depot: {
    id: 'caravan_depot',
    name: 'Caravan Station',
    category: 'logistics',
    width: 2,
    height: 2,
    cost: [{ itemId: 'wood', count: 10 }, { itemId: 'stone', count: 10 }],
    description: 'Dispatches horse-drawn caravans along roads to transfer cargo to other depots.',
    color: 0xd2691e,
    unlockedByDefault: true,
    isCaravanDepot: true
  },
  train_station: {
    id: 'train_station',
    name: 'Train Terminal',
    category: 'logistics',
    width: 3,
    height: 2,
    cost: [{ itemId: 'steel', count: 15 }, { itemId: 'reinforced_plate', count: 5 }],
    description: 'High capacity steam train cargo station.',
    color: 0x2c3e50,
    unlockedByDefault: false,
    isTrainStation: true
  },

  // Extraction & Power
  water_pump: {
    id: 'water_pump',
    name: 'Steam Water Pump',
    category: 'power',
    width: 1,
    height: 1,
    cost: [{ itemId: 'iron_ingot', count: 5 }, { itemId: 'gear', count: 2 }],
    description: 'Must be built next to water. Pumps water into pipes.',
    color: 0x2980b9,
    unlockedByDefault: true,
    producesWater: 10,
    pipeConnectsWater: true
  },
  water_well: {
    id: 'water_well',
    name: 'Village Well',
    category: 'residential',
    width: 1,
    height: 1,
    cost: [{ itemId: 'stone', count: 5 }, { itemId: 'wood', count: 5 }],
    description: 'Provides clean drinking water to nearby worker housing.',
    color: 0x3498db,
    unlockedByDefault: true
  },
  boiler: {
    id: 'boiler',
    name: 'Steam Boiler',
    category: 'power',
    width: 2,
    height: 2,
    cost: [{ itemId: 'iron_ingot', count: 10 }, { itemId: 'stone', count: 10 }],
    description: 'Burns coal & consumes water from pipes to generate high pressure steam.',
    color: 0xc0392b,
    unlockedByDefault: true,
    requiresFuel: true,
    requiresWater: 5,
    producesSteam: 20,
    pipeConnectsWater: true,
    pipeConnectsSteam: true
  },
  steam_pipe: {
    id: 'steam_pipe',
    name: 'Steam / Water Pipe',
    category: 'power',
    width: 1,
    height: 1,
    cost: [{ itemId: 'pipe', count: 1 }],
    description: 'Distributes water or high-pressure steam across the factory.',
    color: 0xe74c3c,
    unlockedByDefault: true,
    pipeConnectsSteam: true,
    pipeConnectsWater: true
  },
  steam_drill: {
    id: 'steam_drill',
    name: 'Steam Mining Drill',
    category: 'extraction',
    width: 2,
    height: 2,
    cost: [{ itemId: 'iron_ingot', count: 10 }, { itemId: 'gear', count: 5 }],
    description: 'Must be placed on ore or coal deposits. Requires steam to extract resources.',
    color: 0x7f8c8d,
    unlockedByDefault: true,
    requiresSteam: 2,
    extractionRate: 0.5,
    pipeConnectsSteam: true
  },
  lumber_mill: {
    id: 'lumber_mill',
    name: 'Lumber Mill',
    category: 'extraction',
    width: 2,
    height: 2,
    cost: [{ itemId: 'wood', count: 10 }, { itemId: 'iron_ingot', count: 2 }],
    description: 'Harvests timber from nearby trees.',
    color: 0x8b5a2b,
    unlockedByDefault: true,
    extractsResource: 'wood',
    extractionRate: 0.5
  },
  grain_farm: {
    id: 'grain_farm',
    name: 'Grain Farm',
    category: 'extraction',
    width: 3,
    height: 3,
    cost: [{ itemId: 'wood', count: 15 }, { itemId: 'stone', count: 5 }],
    description: 'Grows wheat grain on fertile land to feed the workforce.',
    color: 0xf1c40f,
    unlockedByDefault: true,
    extractsResource: 'fertile',
    extractionRate: 0.33
  },

  // Processing & Production
  furnace: {
    id: 'furnace',
    name: 'Stone Furnace',
    category: 'processing',
    width: 2,
    height: 2,
    cost: [{ itemId: 'stone', count: 15 }],
    description: 'Smelts ores into metal ingots using coal.',
    color: 0xe67e22,
    unlockedByDefault: true,
    requiresFuel: true,
    allowedRecipes: ['smelt_iron', 'smelt_copper', 'smelt_steel']
  },
  bakery: {
    id: 'bakery',
    name: 'Town Bakery',
    category: 'processing',
    width: 2,
    height: 2,
    cost: [{ itemId: 'stone', count: 10 }, { itemId: 'wood', count: 10 }],
    description: 'Bakes grain into fresh bread for citizens.',
    color: 0xd35400,
    unlockedByDefault: true,
    allowedRecipes: ['bake_bread']
  },
  assembly_workshop: {
    id: 'assembly_workshop',
    name: 'Steam Workshop',
    category: 'processing',
    width: 2,
    height: 2,
    cost: [{ itemId: 'iron_ingot', count: 15 }, { itemId: 'gear', count: 5 }],
    description: 'Assembles gears, pipes, wire, and scientific research papers.',
    color: 0x16a085,
    unlockedByDefault: true,
    allowedRecipes: ['make_gear', 'make_wire', 'make_pipe', 'make_science_1']
  },
  heavy_foundry: {
    id: 'heavy_foundry',
    name: 'Heavy Industrial Foundry',
    category: 'processing',
    width: 3,
    height: 3,
    cost: [{ itemId: 'steel', count: 20 }, { itemId: 'gear', count: 10 }],
    description: 'Consumes high pressure steam to produce steel plates, engine parts, and locomotives.',
    color: 0x2c3e50,
    unlockedByDefault: false,
    requiresSteam: 5,
    pipeConnectsSteam: true,
    allowedRecipes: ['make_reinforced_plate', 'make_engine_part', 'make_science_2', 'make_rail_track', 'make_locomotive']
  },

  // Residential & Research
  worker_cottage: {
    id: 'worker_cottage',
    name: 'Worker Cottage',
    category: 'residential',
    width: 2,
    height: 2,
    cost: [{ itemId: 'wood', count: 10 }, { itemId: 'stone', count: 5 }],
    description: 'Houses up to 4 worker men. Needs access to water and food within 8 tile radius.',
    color: 0x27ae60,
    unlockedByDefault: true,
    housingCapacity: 4,
    foodWaterRadius: 8
  },
  research_lab: {
    id: 'research_lab',
    name: 'Patent & Science Academy',
    category: 'science',
    width: 3,
    height: 3,
    cost: [{ itemId: 'iron_ingot', count: 20 }, { itemId: 'gear', count: 10 }, { itemId: 'stone', count: 20 }],
    description: 'Consumes Scientific Papers to unlock advanced steam technologies and industrial upgrades.',
    color: 0x8e44ad,
    unlockedByDefault: true
  },

  // Victory Monument
  transcontinental_terminal: {
    id: 'transcontinental_terminal',
    name: 'Transcontinental Railroad Terminal',
    category: 'monument',
    width: 4,
    height: 4,
    cost: [{ itemId: 'steel', count: 100 }, { itemId: 'reinforced_plate', count: 50 }, { itemId: 'locomotive', count: 5 }, { itemId: 'coal', count: 200 }],
    description: 'The crowning achievement of the Industrial Age! Build this grand terminal to complete the game victory condition.',
    color: 0xf39c12,
    unlockedByDefault: false
  }
};

export const TECH_TREE: Record<string, TechNode> = {
  tech_steam_power: {
    id: 'tech_steam_power',
    name: 'Steam Power & Pressure',
    description: 'Unlocks Steam Boilers, Steam Mining Drills, and piping.',
    icon: '⚙️',
    prerequisites: [],
    cost: [{ itemId: 'patent_paper_1', count: 5 }],
    unlockedBuildings: ['boiler', 'steam_pipe', 'steam_drill'],
    unlockedRecipes: []
  },
  tech_paved_roads: {
    id: 'tech_paved_roads',
    name: 'Paved Infrastructure',
    description: 'Unlocks Cobblestone Roads for maximum worker speed.',
    icon: '🛣️',
    prerequisites: [],
    cost: [{ itemId: 'patent_paper_1', count: 5 }],
    unlockedBuildings: ['paved_road'],
    unlockedRecipes: []
  },
  tech_metallurgy: {
    id: 'tech_metallurgy',
    name: 'Advanced Metallurgy',
    description: 'Unlocks Steel refining in stone furnaces.',
    icon: '🔨',
    prerequisites: ['tech_steam_power'],
    cost: [{ itemId: 'patent_paper_1', count: 10 }],
    unlockedBuildings: [],
    unlockedRecipes: ['smelt_steel']
  },
  tech_heavy_industry: {
    id: 'tech_heavy_industry',
    name: 'Heavy Industrial Foundry',
    description: 'Unlocks Heavy Foundry building, Reinforced Plates, Engine Components, and Level II Research.',
    icon: '🏭',
    prerequisites: ['tech_metallurgy'],
    cost: [{ itemId: 'patent_paper_1', count: 15 }],
    unlockedBuildings: ['heavy_foundry'],
    unlockedRecipes: ['make_reinforced_plate', 'make_engine_part', 'make_science_2']
  },
  tech_railways: {
    id: 'tech_railways',
    name: 'Steam Railroads',
    description: 'Unlocks Rail Lines, Train Terminals, and Steam Locomotive crafting.',
    icon: '🚂',
    prerequisites: ['tech_heavy_industry'],
    cost: [{ itemId: 'patent_paper_2', count: 10 }],
    unlockedBuildings: ['rail_line', 'train_station'],
    unlockedRecipes: ['make_rail_track', 'make_locomotive']
  },
  tech_transcontinental: {
    id: 'tech_transcontinental',
    name: 'Transcontinental Empire',
    description: 'Unlocks the Transcontinental Railroad Terminal monument to complete the grand industrial victory.',
    icon: '🏆',
    prerequisites: ['tech_railways'],
    cost: [{ itemId: 'patent_paper_2', count: 25 }],
    unlockedBuildings: ['transcontinental_terminal'],
    unlockedRecipes: []
  }
};
