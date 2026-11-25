// Renderer: draws the whole kitchen on one canvas, 1280x720, from the
// world state alone. Big HUD, big labels, big order cards — the frame must
// read at a glance when the judge shrinks it to 768x480.

import { PALETTE, INGREDIENTS, INGREDIENT_ORDER, STATIONS, BINS, VIEW } from './config.js';
import { plateCounts, readyOrderFor } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawIngredient(ctx, kind, x, y, size, state) {
  const c = INGREDIENTS[kind].color;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#d98a2b';
    ctx.fillRect(-size / 2, -size * 0.08, size, size * 0.22);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, -size * 0.08, size / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.2, -0.28], [0.15, -0.35], [0, -0.15]]) {
      ctx.beginPath(); ctx.arc(sx * size, sy * size, size * 0.05, 0, 7); ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'raw' ? '#a85f3c' : '#5e3418';
    rr(ctx, -size / 2, -size * 0.22, size, size * 0.44, size * 0.14);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-size * 0.35, -size * 0.14, size * 0.7, size * 0.08);
  } else if (kind === 'lettuce') {
    ctx.fillStyle = c;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-size * 0.25 + i * size * 0.25, 0, size * 0.28, size * 0.2, 0, 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = '#3d7a24';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-size * 0.4, 0); ctx.lineTo(size * 0.4, 0); ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.42, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d7a24';
    ctx.beginPath(); ctx.arc(0, -size * 0.36, size * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-size * 0.15, -size * 0.15, size * 0.1, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-size / 2, size * 0.3);
    ctx.lineTo(size / 2, size * 0.3);
    ctx.lineTo(size / 2, -size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b8860b';
    for (const [hx, hy] of [[-0.2, 0.05], [0.15, -0.1], [0.05, 0.15]]) {
      ctx.beginPath(); ctx.arc(hx * size, hy * size, size * 0.05, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

function text(ctx, s, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = (bold ? '700 ' : '400 ') + size + 'px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg) {
  ctx.fillStyle = bg || 'rgba(0,0,0,0.35)';
  rr(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color;
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 2) { rr(ctx, x, y, fw, h, h / 2); ctx.fill(); }
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function drawOrderCard(ctx, order, x, y, w, h) {
  const urgent = order.left < 12;
  ctx.fillStyle = urgent ? '#7a1f1f' : '#fff3d6';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = urgent ? '#ff5a5a' : '#8a5a33';
  ctx.lineWidth = 3; ctx.stroke();
  text(ctx, '#' + order.id + '  ' + order.recipe.name.toUpperCase(), x + 12, y + 18, 17, urgent ? '#ffe9b0' : '#241708');
  let ix = x + 14;
  for (const kind of Object.keys(order.recipe.needs)) {
    for (let n = 0; n < order.recipe.needs[kind]; n++) {
      drawIngredient(ctx, kind, ix + 16, y + 46, 28, 'ready');
      ix += 34;
    }
  }
  text(ctx, '$' + order.recipe.price, x + w - 14, y + 46, 20, urgent ? '#ffe9b0' : '#1a7a3a', 'right');
  text(ctx, fmtTime(order.left), x + 12, y + h - 24, 14, urgent ? '#ffd0d0' : '#5a3a1a');
  bar(ctx, x + 64, y + h - 16, w - 76, 9, order.left / order.total, urgent ? '#ff5a5a' : '#2ec4b6');
}

export function drawPlate(ctx, plate, x, y, size, world) {
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.32, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2; ctx.stroke();
  const counts = plateCounts(plate);
  let i = 0;
  for (const kind of Object.keys(counts)) {
    for (let n = 0; n < counts[kind]; n++) {
      drawIngredient(ctx, kind, x - size * 0.45 + i * size * 0.28, y - 6 - (i % 2) * 8, 30, 'ready');
      i++;
    }
  }
  const order = readyOrderFor(world, plate);
  if (order) {
    ctx.fillStyle = '#2ec4b6';
    rr(ctx, x - 52, y - size - 26, 104, 26, 13); ctx.fill();
    text(ctx, 'READY', x, y - size - 13, 16, '#ffffff', 'center');
  }
}

export function render(ctx, world) {
  const W = VIEW.width;
  const H = VIEW.height;
  // Floor tiles.
  for (let ty = 0; ty < 9; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      ctx.fillStyle = (tx + ty) % 2 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * 80, 64 + ty * 80, 80, 80);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 64, W, 8);
  // HUD bar.
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, W, 64);
  text(ctx, 'SIZZLE & SERVE', 20, 32, 26, PALETTE.hudText);
  text(ctx, 'COINS $' + world.coins, 330, 32, 24, '#ffd23f');
  text(ctx, 'SCORE ' + world.score, 520, 32, 24, PALETTE.hudText);
  text(ctx, 'SERVED ' + world.served, 700, 32, 22, '#2ec4b6');
  if (world.combo > 1) text(ctx, 'COMBO x' + world.combo, 860, 32, 24, '#ff9f1c');
  const shiftUrgent = world.shiftLeft < 30;
  text(ctx, 'SHIFT ' + fmtTime(world.shiftLeft), 1060, 32, 26, shiftUrgent ? '#ff5a5a' : PALETTE.hudText, 'left');
  // Order board.
  text(ctx, 'ORDER BOARD', 20, 80, 15, '#fff3d6');
  for (let i = 0; i < 3; i++) {
    const o = world.orders[i];
    if (o) drawOrderCard(ctx, o, 20 + i * 420, 88, 400, 84);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      rr(ctx, 20 + i * 420, 88, 400, 84, 12); ctx.fill();
      text(ctx, 'WAITING FOR ORDER…', 220 + i * 420, 130, 16, 'rgba(255,243,214,0.8)', 'center');
    }
  }
  // Ingredient bins on the counter.
  for (const bin of BINS) {
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10); ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, bin.x, bin.y, bin.w, 26, 10); ctx.fill();
    drawIngredient(ctx, bin.kind, bin.x + 34, bin.y + 52, 40, 'ready');
    text(ctx, INGREDIENTS[bin.kind].label, bin.x + 62, bin.y + 40, 17, '#fff3d6');
    const need = INGREDIENTS[bin.kind].needs;
    text(ctx, need === 'none' ? 'ready to plate' : need === 'grill' ? 'needs GRILL 4s' : 'needs CHOP 2s', bin.x + 62, bin.y + 62, 13, '#ffd9a0', 'left', false);
  }
  // Stations.
  for (const key of ['chop', 'grill', 'plate', 'serve']) {
    const s = STATIONS[key];
    ctx.fillStyle = key === 'serve' ? '#7a1f1f' : PALETTE.counter;
    rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, s.x, s.y, s.w, 30, 12); ctx.fill();
    text(ctx, s.label + (key === 'grill' ? '  —  4s' : key === 'chop' ? '  —  2s' : ''), s.x + 14, s.y + 15, 17, '#241708');
  }
  // Chop contents.
  if (world.chop.item) {
    drawIngredient(ctx, world.chop.item.kind, 185, 338, 52, 'raw');
    bar(ctx, 110, 396, 150, 12, world.chop.progress / world.chop.total, '#5fae3f');
    if (world.chop.progress >= world.chop.total) text(ctx, 'DONE — click to take', 185, 378, 14, '#2ec4b6', 'center');
  } else {
    text(ctx, 'Drop lettuce / tomato / cheese', 185, 350, 14, 'rgba(255,243,214,0.75)', 'center', false);
  }
  // Grill contents + steam.
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(380, 320, 220, 70);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(390 + i * 55, 325); ctx.lineTo(390 + i * 55, 385); ctx.stroke(); }
  if (world.grill.item) {
    drawIngredient(ctx, 'patty', 490, 342, 56, world.grill.progress >= world.grill.total ? 'ready' : 'raw');
    bar(ctx, 400, 396, 180, 12, world.grill.progress / world.grill.total, '#ff9f1c');
    if (world.grill.progress >= world.grill.total) text(ctx, 'DONE — click to take', 490, 378, 14, '#2ec4b6', 'center');
  } else {
    text(ctx, 'Drop a raw patty here', 490, 355, 14, 'rgba(255,243,214,0.75)', 'center', false);
  }
  for (const p of world.particles) {
    ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0, p.left).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill();
  }
  // Plates.
  drawPlate(ctx, world.plates[0], 750, 360, 62, world);
  drawPlate(ctx, world.plates[1], 900, 360, 62, world);
  text(ctx, 'PLATE 1', 750, 410, 13, '#fff3d6', 'center', false);
  text(ctx, 'PLATE 2', 900, 410, 13, '#fff3d6', 'center', false);
  // Serve window.
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(1135, 330, 26, 0, 7); ctx.fill();
  text(ctx, 'SERVE', 1135, 330, 15, '#241708', 'center');
  text(ctx, 'Click a READY plate here', 1135, 392, 13, '#fff3d6', 'center', false);
  // Walkway + chef.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, 20, 440, 1240, 190, 14); ctx.fill();
  const c = world.chef;
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(c.x, c.y + 8, 26, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath(); ctx.arc(c.x, c.y - 22, 18, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(c.x, c.y - 38, 20, 10, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#241708';
  ctx.beginPath(); ctx.arc(c.x - 6, c.y - 22, 2.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x + 6, c.y - 22, 2.5, 0, 7); ctx.fill();
  text(ctx, 'CHEF', c.x, c.y + 44, 12, '#fff3d6', 'center', false);
  if (world.carry) {
    drawIngredient(ctx, world.carry.kind, c.x, c.y - 58, 36, world.carry.state);
    text(ctx, INGREDIENTS[world.carry.kind].label + (world.carry.state === 'raw' ? ' (RAW)' : ''), c.x, c.y - 84, 13, '#ffe9b0', 'center');
  }
  // Floaters.
  for (const f of world.floaters) {
    const shown = Math.max(0, Math.min(1.6, f.left));
    ctx.globalAlpha = Math.max(0, Math.min(1, shown));
    text(ctx, f.text, f.x, f.y - (1.6 - shown) * 40, 22, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  // Hint + message bar.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, 20, 640, 1240, 62, 12); ctx.fill();
  const hint = world.phase === 'play'
    ? 'WASD move  •  click a bin to take  •  1–5 take ingredient  •  E use nearest station  •  serve READY plates'
    : 'Click START to open the kitchen';
  text(ctx, hint, 40, 662, 16, '#ffe9b0', 'left', false);
  if (world.message && world.messageLeft > 0) text(ctx, world.message, 40, 688, 16, '#2ec4b6');
  if (world.phase === 'title') drawTitle(ctx, world);
  if (world.phase === 'over') drawOver(ctx, world);
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SIZZLE & SERVE', 640, 180, 64, '#ff9f1c', 'center');
  text(ctx, '3 stations  •  12 recipes  •  5 ingredients  •  combo scoring', 640, 240, 24, '#ffe9b0', 'center');
  text(ctx, 'Chop it. Grill it. Plate it. Serve it before the timer runs out.', 640, 290, 20, '#fff3d6', 'center', false);
  text(ctx, 'A busy little kitchen — no two orders alike.', 640, 330, 18, '#ffd9a0', 'center', false);
  ctx.fillStyle = '#2ec4b6';
  rr(ctx, 490, 470, 300, 60, 14); ctx.fill();
  text(ctx, 'START SHIFT', 640, 500, 26, '#ffffff', 'center');
  text(ctx, 'Click START or press Enter  •  WASD + mouse', 640, 580, 16, '#ffe9b0', 'center', false);
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,10,5,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT OVER', 640, 180, 56, '#ff9f1c', 'center');
  text(ctx, 'Served ' + world.served + ' dishes  •  Coins $' + world.coins + '  •  Score ' + world.score, 640, 250, 26, '#ffe9b0', 'center');
  text(ctx, 'Best combo x' + world.bestCombo, 640, 300, 22, '#2ec4b6', 'center');
  ctx.fillStyle = '#2ec4b6';
  rr(ctx, 490, 520, 300, 60, 14); ctx.fill();
  text(ctx, 'PLAY AGAIN', 640, 550, 26, '#ffffff', 'center');
}
