// Keyboard + mouse input, translated into plain intents the world reads.
// Nothing here knows about recipes or scoring — it only reports keys,
// clicks, and where the pointer is in game coordinates (1280x720 space).

export function makeInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    click: null, // {x, y, at} consumed by the world each frame
    pointer: { x: 640, y: 500 },
    anyKey: false,
  };

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    state.anyKey = true;
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  canvas.addEventListener('pointermove', (e) => {
    state.pointer = toGame(e);
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toGame(e);
    state.pointer = p;
    state.click = { ...p, at: performance.now() };
    state.anyKey = true;
  });
  return state;
}

export function moveVector(input) {
  const k = input.keys;
  let x = 0;
  let y = 0;
  if (k.has('a') || k.has('ArrowLeft')) x -= 1;
  if (k.has('d') || k.has('ArrowRight')) x += 1;
  if (k.has('w') || k.has('ArrowUp')) y -= 1;
  if (k.has('s') || k.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

export function pressed(input, ...names) {
  return names.some((n) => input.keys.has(n));
}
