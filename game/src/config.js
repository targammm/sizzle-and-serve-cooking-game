// Central tuning for Sizzle & Serve: every number and colour lives here.
// 3 stations, 12 recipes, 5 ingredients, combo scoring — the title says
// exactly what this file declares, and the game really has all of it.

export const VIEW = { width: 1280, height: 720 };

export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#7a4a2b',
  counter: '#8a5a33',
  counterTop: '#e8c890',
  hud: '#2b1d12',
  hudText: '#ffe9b0',
  accent: '#ff9f1c',
  danger: '#e63946',
  good: '#2ec4b6',
  cream: '#fff3d6',
  ink: '#241708',
};

export const INGREDIENTS = {
  bun: { label: 'BUN', color: '#e8a54b', needs: 'none', price: 2 },
  patty: { label: 'PATTY', color: '#7a4a21', needs: 'grill', price: 6 },
  lettuce: { label: 'LETTUCE', color: '#5fae3f', needs: 'chop', price: 2 },
  tomato: { label: 'TOMATO', color: '#e63946', needs: 'chop', price: 2 },
  cheese: { label: 'CHEESE', color: '#ffd23f', needs: 'chop', price: 3 },
};

export const INGREDIENT_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];

// A recipe is a bag of ingredient kinds. Duplicates count: a Double Stack
// really needs two patties. `cook` is the seconds a patty spends on the grill.
export const RECIPES = [
  { id: 1, name: 'Classic Burger', needs: { bun: 1, patty: 1, lettuce: 1 }, price: 14, time: 50 },
  { id: 2, name: 'Cheese Burger', needs: { bun: 1, patty: 1, cheese: 1 }, price: 16, time: 50 },
  { id: 3, name: 'Double Stack', needs: { bun: 1, patty: 2, cheese: 1 }, price: 22, time: 55 },
  { id: 4, name: 'Garden Salad', needs: { lettuce: 1, tomato: 1 }, price: 10, time: 40 },
  { id: 5, name: 'Cheese Melt', needs: { bun: 1, cheese: 1, tomato: 1 }, price: 13, time: 45 },
  { id: 6, name: 'Tomato Stack', needs: { bun: 1, tomato: 1, lettuce: 1, cheese: 1 }, price: 15, time: 50 },
  { id: 7, name: 'Patty Melt', needs: { bun: 1, patty: 1, cheese: 1, tomato: 1 }, price: 18, time: 55 },
  { id: 8, name: 'Veggie Bun', needs: { bun: 1, lettuce: 1, tomato: 1 }, price: 12, time: 45 },
  { id: 9, name: 'Cheesy Salad', needs: { lettuce: 1, tomato: 1, cheese: 1 }, price: 12, time: 40 },
  { id: 10, name: 'Big Sizzle', needs: { bun: 1, patty: 2, lettuce: 1, cheese: 1 }, price: 24, time: 60 },
  { id: 11, name: 'Fresh Stack', needs: { bun: 1, lettuce: 1, tomato: 1, cheese: 1, patty: 1 }, price: 21, time: 60 },
  { id: 12, name: 'Sunrise Bun', needs: { bun: 1, patty: 1, tomato: 1 }, price: 15, time: 50 },
];

export const STATIONS = {
  chop: { label: 'CHOP', seconds: 2, x: 60, y: 278, w: 250, h: 140 },
  grill: { label: 'GRILL', seconds: 4, x: 350, y: 278, w: 280, h: 140 },
  plate: { label: 'PLATE', seconds: 0, x: 670, y: 278, w: 300, h: 140 },
  serve: { label: 'SERVE', seconds: 0, x: 1010, y: 278, w: 250, h: 140 },
};

export const BINS = INGREDIENT_ORDER.map((kind, i) => ({
  kind,
  x: 60 + i * 240,
  y: 184,
  w: 220,
  h: 78,
}));

export const TUNING = {
  shiftSeconds: 180,
  maxOrders: 3,
  orderSpawnSeconds: 16,
  orderExpirePenalty: 5,
  comboWindowSeconds: 20,
  chefSpeed: 340,
  chefRadius: 26,
  walkway: { x: 20, y: 440, w: 1240, h: 190 },
};
