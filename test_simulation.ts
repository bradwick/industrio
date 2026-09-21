import { GameSimulation } from './src/game/GameSimulation';
import { BUILDINGS, RECIPES } from './src/data/gameData';

console.log('--- Running Industrio Logic Tests ---');

// Test 1: MapGrid initialization and building placement
const sim = new GameSimulation(30, 30);
console.assert(sim.map.width === 30, 'Map width should be 30');
console.assert(sim.map.height === 30, 'Map height should be 30');

// Test 2: Add building
const bldg = sim.addBuilding('boiler', 5, 5);
console.assert(bldg !== null, 'Boiler building should be placed at 5,5');
console.assert(sim.buildings.size === 1, 'Buildings count should be 1');

// Test 3: Fluid networks recalculation
sim.recalculateFluidNetworks();
console.assert(sim.fluidNetworks.length > 0, 'Fluid networks should be populated for boiler');

// Test 4: Simulation step execution
sim.update(1.0);
console.assert(sim.stats.gameTime === 1.0, 'Game time should be 1.0 after 1s tick');

// Test 5: Serialization & Deserialization
const jsonStr = sim.serialize();
const sim2 = new GameSimulation(10, 10);
sim2.deserialize(jsonStr);
console.assert(sim2.map.width === 30, 'Deserialized map width should be 30');
console.assert(sim2.buildings.size === 1, 'Deserialized building count should be 1');

console.log('✓ All logic tests passed successfully!');
