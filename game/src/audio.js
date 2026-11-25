// Tiny WebAudio synth: sizzle, chop, ding and a serve chime. All sound is
// generated in code — no audio files, no network, nothing to download.
// Created lazily on the first user gesture, so autoplay rules never bite.

let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, gain) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch { /* sound is decoration, never a crash */ }
}

function noise(dur, gain) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = gain || 0.05;
    src.connect(g).connect(ac.destination);
    src.start();
  } catch { /* sound is decoration */ }
}

export function playEvent(name) {
  if (name === 'grill') noise(0.5, 0.06);
  else if (name === 'chop') { noise(0.08, 0.12); tone(180, 0.08, 'square', 0.05); }
  else if (name === 'serve') { tone(660, 0.12, 'sine', 0.09); setTimeout(() => tone(880, 0.18, 'sine', 0.09), 110); }
  else if (name === 'done') tone(520, 0.1, 'triangle', 0.07);
  else if (name === 'lost') tone(220, 0.25, 'sawtooth', 0.05);
  else if (name === 'plate') tone(440, 0.07, 'triangle', 0.06);
  else if (name === 'take') tone(330, 0.05, 'triangle', 0.04);
}
