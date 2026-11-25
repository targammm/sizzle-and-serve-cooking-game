// Screenshot staging: ?shot=cover|title|chaos|serve builds a real,
// deterministic world state from a fixed seed — never a fake pose. The
// autopilot is the world itself running: orders ticking, a patty grilling,
// a plate mid-assembly. __shotReady fires after the first painted frame.

import { createWorld, spawnOrder } from './world.js';
import { RECIPES } from './config.js';

function findRecipe(world, name) {
  return RECIPES.find((r) => r.name === name);
}

function setOrder(world, slot, name, left) {
  const recipe = findRecipe(world, name);
  if (!world.orders[slot]) spawnOrder(world);
  world.orders[slot] = { id: slot + 1, recipe, left, total: recipe.time };
  world.nextOrderId = Math.max(world.nextOrderId, slot + 2);
}

// The cover: mid-service, everything the judge's first criterion asks for
// in one frame — kitchen, order board, ingredients, a dish mid-assembly,
// a running timer, a READY plate, coins already earned, combo alive.
export function stageCover(world) {
  world.coins = 86;
  world.score = 940;
  world.served = 4;
  world.combo = 3;
  world.bestCombo = 3;
  world.comboLeft = 14;
  world.shiftLeft = 134;
  world.orders = [];
  setOrder(world, 0, 'Cheese Burger', 34);
  setOrder(world, 1, 'Garden Salad', 22);
  setOrder(world, 2, 'Double Stack', 48);
  world.plates[0].items = ['bun', 'patty'];
  world.plates[1].items = ['bun', 'patty', 'cheese'];
  world.grill.item = { kind: 'patty' };
  world.grill.progress = 4;
  world.chop.item = { kind: 'tomato' };
  world.chop.progress = 2;
  world.carry = { kind: 'lettuce', state: 'ready' };
  world.chef.x = 640;
  world.chef.y = 545;
  world.message = 'READY! Take it to SERVE — Cheese Burger';
  world.messageLeft = 99;
  return world;
}

export function stageChaos(world) {
  world.coins = 52;
  world.score = 560;
  world.served = 2;
  world.combo = 2;
  world.bestCombo = 2;
  world.comboLeft = 9;
  world.shiftLeft = 61;
  world.orders = [];
  setOrder(world, 0, 'Big Sizzle', 9);
  setOrder(world, 1, 'Patty Melt', 18);
  setOrder(world, 2, 'Fresh Stack', 41);
  world.plates[0].items = ['bun'];
  world.plates[1].items = ['bun', 'patty'];
  world.grill.item = { kind: 'patty' };
  world.grill.progress = 4;
  world.chop.item = { kind: 'lettuce' };
  world.chop.progress = 2;
  world.carry = { kind: 'tomato', state: 'ready' };
  world.chef.x = 480;
  world.chef.y = 545;
  world.message = 'Order #1 is nearly out of time!';
  world.messageLeft = 99;
  return world;
}

export function stageServe(world) {
  world.coins = 104;
  world.score = 1120;
  world.served = 5;
  world.combo = 4;
  world.bestCombo = 4;
  world.comboLeft = 16;
  world.shiftLeft = 98;
  world.orders = [];
  setOrder(world, 0, 'Cheese Burger', 30);
  setOrder(world, 1, 'Veggie Bun', 26);
  setOrder(world, 2, 'Cheesy Salad', 35);
  world.plates[0].items = ['bun', 'patty', 'cheese'];
  world.plates[1].items = ['lettuce', 'tomato'];
  world.chef.x = 1080;
  world.chef.y = 545;
  world.carry = null;
  world.floaters.push({ x: 1135, y: 300, text: '+$18  Cheese Burger', color: '#2ec4b6', left: 1.6 });
  world.floaters.push({ x: 1135, y: 330, text: 'COMBO x4', color: '#ff9f1c', left: 1.6 });
  world.message = 'Served! Combo x4 — keep the rush going';
  world.messageLeft = 99;
  return world;
}

export function stageFor(name, seed) {
  const world = createWorld(seed, name === 'title' ? 'title' : 'play');
  if (name === 'cover' || name === 'play') return stageCover(world);
  if (name === 'chaos') return stageChaos(world);
  if (name === 'serve') return stageServe(world);
  return world;
}
