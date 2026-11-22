// Small synthesized sounds: clicks, loot chimes, the alarm's rising beep, the caught sting and the getaway run.
let ctx = null;

export function unlockAudio() {
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type = 'sine', gain = 0.08, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export function playClick() { tone(660, 0.06, 'square', 0.03); }
export function playLoot() { tone(880, 0.12, 'triangle'); tone(1320, 0.18, 'triangle', 0.06, 0.08); }
export function playAlarmBeep(level) { tone(300 + level * 6, 0.07, 'sawtooth', 0.025); }
export function playCaught() { tone(220, 0.4, 'sawtooth', 0.09); tone(165, 0.6, 'sawtooth', 0.09, 0.2); }
export function playGetaway() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.11)); }
