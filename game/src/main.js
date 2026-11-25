// Main loop: wire canvas, input, world, renderer and sound together.
// ?shot=cover|title|chaos|serve stages a deterministic scene for
// screenshots; without it the game starts on the title screen.
// window.__shotReady flips true after the first frame is painted, so a
// screenshot harness never catches a half-drawn frame.

import { VIEW } from './config.js';
import { createWorld, update, interactAt } from './world.js';
import { render } from './render.js';
import { stageFor } from './shots.js';
import { makeInput } from './input.js';
import { ensureAudio, playEvent } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot') || '';
const seed = Number(params.get('seed') || '20261125');

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const input = makeInput(canvas);
const world = shot ? stageFor(shot, seed) : createWorld(seed, 'title');
window.__world = world;
window.__shotReady = false;

let last = performance.now();
let painted = false;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  // Title screen starts on Enter or a click; the world handles the click.
  if (world.phase === 'title' && input.click) {
    interactAt(world, input.click.x, input.click.y);
    input.click = null;
  }
  if (world.phase === 'title' && input.keys.has('Enter')) {
    input.keys.delete('Enter');
    world.phase = 'play';
  }
  update(world, dt, input);
  // Drain sound events the world queued this frame.
  while (world.events.length) {
    const ev = world.events.shift();
    if (['grill', 'chop', 'serve', 'done', 'lost', 'plate', 'take'].includes(ev)) playEvent(ev);
  }
  render(ctx, world);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = 'Sizzle and Serve. Coins ' + world.coins + ', score ' + world.score
      + ', served ' + world.served + ', shift ' + Math.ceil(world.shiftLeft) + ' seconds left.';
  }
  if (!painted) {
    painted = true;
    // Give the canvas one full painted frame before the harness shoots.
    setTimeout(() => { window.__shotReady = true; }, 350);
  }
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', ensureAudio, { once: true });
window.addEventListener('keydown', ensureAudio, { once: true });
requestAnimationFrame(frame);
