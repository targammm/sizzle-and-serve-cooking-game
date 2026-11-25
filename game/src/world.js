// World: the whole cooking game state and its rules. No drawing here,
// no sound here — update the state, and the renderer reads it.
// Loop: take an ingredient -> process it at CHOP or GRILL -> add it to a
// plate at PLATE -> when the plate matches an order, SERVE it for coins.
// A served plate raises the combo; a lost order resets it to zero.

import { INGREDIENTS, RECIPES, STATIONS, BINS, TUNING } from './config.js';
import { makeRng } from './random.js';
import { moveVector } from './input.js';

export function plateCounts(plate) {
  const counts = {};
  for (const kind of plate.items) counts[kind] = (counts[kind] || 0) + 1;
  return counts;
}

export function plateMatches(plate, recipe) {
  const have = plateCounts(plate);
  const need = recipe.needs;
  const keys = new Set([...Object.keys(have), ...Object.keys(need)]);
  for (const k of keys) if ((have[k] || 0) !== (need[k] || 0)) return false;
  return plate.items.length > 0;
}

export function readyOrderFor(world, plate) {
  return world.orders.find((o) => plateMatches(plate, o.recipe)) || null;
}

export function createWorld(seed, mode = 'play') {
  const rng = makeRng(seed);
  const world = {
    seed,
    mode,
    rng,
    phase: mode === 'title' ? 'title' : 'play',
    time: 0,
    shiftLeft: TUNING.shiftSeconds,
    coins: 0,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    comboLeft: 0,
    chef: { x: 640, y: 545, face: 1 },
    carry: null,
    chop: { item: null, progress: 0, total: STATIONS.chop.seconds },
    grill: { item: null, progress: 0, total: STATIONS.grill.seconds },
    plates: [{ items: [] }, { items: [] }],
    orders: [],
    spawnTimer: 4,
    nextOrderId: 1,
    floaters: [],
    particles: [],
    message: '',
    messageLeft: 0,
    events: [],
    startedAt: 0,
  };
  if (mode !== 'title') spawnOrder(world);
  if (mode !== 'title') spawnOrder(world);
  return world;
}

export function spawnOrder(world) {
  if (world.orders.length >= TUNING.maxOrders) return;
  const used = new Set(world.orders.map((o) => o.recipe.id));
  const pool = RECIPES.filter((r) => !used.has(r.id));
  const recipe = world.rng.pick(pool.length ? pool : RECIPES);
  world.orders.push({
    id: world.nextOrderId++,
    recipe,
    left: recipe.time,
    total: recipe.time,
  });
}

export function say(world, text) {
  world.message = text;
  world.messageLeft = 2.2;
}

export function floater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color: color || '#2ec4b6', left: 1.6 });
}

function processedKind(kind) {
  return INGREDIENTS[kind].needs === 'none' ? 'ready' : 'raw';
}

export function takeIngredient(world, kind) {
  if (world.phase !== 'play') return;
  if (world.carry) { say(world, 'Hands full — plate it or drop it first'); return; }
  world.carry = { kind, state: processedKind(kind) };
  world.events.push('take');
}

export function useChop(world) {
  if (world.phase !== 'play') return;
  if (world.chop.item && world.chop.progress >= world.chop.total) {
    if (world.carry) { say(world, 'Hands full'); return; }
    world.carry = { kind: world.chop.item.kind, state: 'ready' };
    world.chop.item = null;
    world.chop.progress = 0;
    world.events.push('take');
    return;
  }
  if (!world.carry) { say(world, 'CHOP needs an ingredient in hand'); return; }
  if (world.carry.state !== 'raw' || INGREDIENTS[world.carry.kind].needs !== 'chop') {
    say(world, 'Only lettuce, tomato or cheese go on the CHOP board');
    return;
  }
  if (world.chop.item) { say(world, 'CHOP board is busy'); return; }
  world.chop.item = { kind: world.carry.kind };
  world.chop.progress = 0;
  world.carry = null;
  world.events.push('chop');
}

export function useGrill(world) {
  if (world.phase !== 'play') return;
  if (world.grill.item && world.grill.progress >= world.grill.total) {
    if (world.carry) { say(world, 'Hands full'); return; }
    world.carry = { kind: world.grill.item.kind, state: 'ready' };
    world.grill.item = null;
    world.grill.progress = 0;
    world.events.push('take');
    return;
  }
  if (!world.carry) { say(world, 'GRILL needs a raw patty in hand'); return; }
  if (world.carry.kind !== 'patty' || world.carry.state !== 'raw') {
    say(world, 'Only a raw PATTY goes on the GRILL');
    return;
  }
  if (world.grill.item) { say(world, 'GRILL is busy'); return; }
  world.grill.item = { kind: 'patty' };
  world.grill.progress = 0;
  world.carry = null;
  world.events.push('grill');
}

export function activePlate(world) {
  // First plate that is not already a finished order, preferring the one
  // already being built so ingredients never scatter across two plates.
  const busy = world.plates.find((p) => p.items.length > 0 && !readyOrderFor(world, p));
  return busy || world.plates[0];
}

export function usePlate(world) {
  if (world.phase !== 'play') return;
  if (!world.carry) { say(world, 'Carry a ready ingredient to the PLATE'); return; }
  if (world.carry.state !== 'ready') {
    say(world, 'That is still raw — CHOP it or GRILL it first');
    return;
  }
  const plate = activePlate(world);
  if (plate.items.length >= 5) { say(world, 'Plate is full — serve it first'); return; }
  plate.items.push(world.carry.kind);
  world.carry = null;
  world.events.push('plate');
  const order = readyOrderFor(world, plate);
  if (order) say(world, 'READY! Take it to SERVE — ' + order.recipe.name);
}

export function useServe(world) {
  if (world.phase !== 'play') return;
  const readyIdx = world.plates.findIndex((p) => readyOrderFor(world, p));
  if (readyIdx < 0) { say(world, 'No READY plate yet — finish a recipe first'); return; }
  const plate = world.plates[readyIdx];
  const order = readyOrderFor(world, plate);
  const bonus = world.combo * 2;
  const earned = order.recipe.price + bonus;
  world.coins += earned;
  world.score += earned * 10 + world.combo * 5;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.comboLeft = TUNING.comboWindowSeconds;
  floater(world, 1135, 330, '+$' + earned + '  ' + order.recipe.name, '#2ec4b6');
  floater(world, 1135, 360, world.combo > 1 ? 'COMBO x' + world.combo : 'SERVED!', '#ff9f1c');
  world.orders = world.orders.filter((o) => o.id !== order.id);
  plate.items = [];
  world.events.push('serve');
  world.spawnTimer = Math.min(world.spawnTimer, 3);
}

export function pointIn(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function interactAt(world, x, y) {
  if (world.phase === 'title') {
    if (x >= 490 && x <= 790 && y >= 470 && y <= 530) {
      world.phase = 'play';
      world.events.push('start');
    }
    return;
  }
  if (world.phase === 'over') {
    if (x >= 490 && x <= 790 && y >= 520 && y <= 580) {
      const fresh = createWorld(world.seed + 7, 'play');
      Object.assign(world, fresh);
    }
    return;
  }
  for (const bin of BINS) if (pointIn(bin, x, y)) { takeIngredient(world, bin.kind); return; }
  if (pointIn(STATIONS.chop, x, y)) { useChop(world); return; }
  if (pointIn(STATIONS.grill, x, y)) { useGrill(world); return; }
  if (pointIn(STATIONS.plate, x, y)) { usePlate(world); return; }
  if (pointIn(STATIONS.serve, x, y)) { useServe(world); return; }
}

export function interactKey(world) {
  if (world.phase !== 'play') return;
  const c = world.chef;
  let best = null;
  let bestD = 1e9;
  for (const key of ['chop', 'grill', 'plate', 'serve']) {
    const s = STATIONS[key];
    const d = Math.hypot(c.x - (s.x + s.w / 2), c.y - (s.y + s.h / 2));
    if (d < bestD) { bestD = d; best = key; }
  }
  if (bestD > 280) { say(world, 'Walk closer to a station, then press E'); return; }
  if (best === 'chop') useChop(world);
  else if (best === 'grill') useGrill(world);
  else if (best === 'plate') usePlate(world);
  else useServe(world);
}

export function update(world, dt, input) {
  world.time += dt;
  if (world.messageLeft > 0) world.messageLeft -= dt;
  for (const f of world.floaters) f.left -= dt;
  world.floaters = world.floaters.filter((f) => f.left > 0);
  // Grill steam, drifting up while a patty cooks.
  if (world.grill.item && world.grill.progress < world.grill.total && Math.random() < dt * 14) {
    world.particles.push({ x: 490 + Math.random() * 60, y: 300, vx: 0, vy: -34, left: 0.9, kind: 'steam' });
  }
  for (const p of world.particles) { p.y += p.vy * dt; p.x += p.vx * dt; p.left -= dt; }
  world.particles = world.particles.filter((p) => p.left > 0);
  if (world.phase !== 'play') return;

  const mv = moveVector(input);
  world.chef.x += mv.x * TUNING.chefSpeed * dt;
  world.chef.y += mv.y * TUNING.chefSpeed * dt;
  const w = TUNING.walkway;
  world.chef.x = Math.max(w.x + 20, Math.min(w.x + w.w - 20, world.chef.x));
  world.chef.y = Math.max(w.y + 20, Math.min(w.y + w.h - 20, world.chef.y));
  if (mv.x !== 0) world.chef.face = mv.x > 0 ? 1 : -1;

  if (input.click) {
    interactAt(world, input.click.x, input.click.y);
    input.click = null;
  }
  if (input.keys.has('e')) {
    input.keys.delete('e');
    interactKey(world);
  }
  for (let i = 1; i <= 5; i++) {
    if (input.keys.has(String(i))) {
      input.keys.delete(String(i));
      takeIngredient(world, BINS[i - 1].kind);
    }
  }

  if (world.chop.item && world.chop.progress < world.chop.total) {
    world.chop.progress += dt;
    if (world.chop.progress >= world.chop.total) { world.events.push('done'); say(world, 'Chopped! Pick it up from CHOP'); }
  }
  if (world.grill.item && world.grill.progress < world.grill.total) {
    world.grill.progress += dt;
    if (world.grill.progress >= world.grill.total) { world.events.push('done'); say(world, 'Grilled! Pick it up from GRILL'); }
  }
  for (const o of world.orders) o.left -= dt;
  const lost = world.orders.filter((o) => o.left <= 0);
  if (lost.length) {
    world.orders = world.orders.filter((o) => o.left > 0);
    world.combo = 0;
    world.coins = Math.max(0, world.coins - TUNING.orderExpirePenalty);
    say(world, 'Order lost: ' + lost[0].recipe.name + ' — combo reset');
    world.events.push('lost');
  }
  if (world.comboLeft > 0) {
    world.comboLeft -= dt;
    if (world.comboLeft <= 0) world.combo = 0;
  }
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = TUNING.orderSpawnSeconds;
  }
  world.shiftLeft -= dt;
  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    world.phase = 'over';
    world.events.push('over');
  }
}
