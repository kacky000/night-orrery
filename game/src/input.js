// Keyboard and mouse: held keys for movement, one-shot presses for tools, and the mouse in screen pixels.
import { SCREEN_W, SCREEN_H } from './config.js';

const held = new Set();
const pressed = [];
const clicks = [];
export const mouse = { x: 0, y: 0 };

export function attachInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (!held.has(e.code)) pressed.push(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  const locate = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * SCREEN_W;
    mouse.y = ((e.clientY - r.top) / r.height) * SCREEN_H;
  };
  canvas.addEventListener('mousemove', locate);
  canvas.addEventListener('mousedown', (e) => { locate(e); clicks.push({ x: mouse.x, y: mouse.y, button: e.button }); });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function readInput() {
  const has = (...codes) => codes.some((c) => held.has(c));
  const keys = pressed.splice(0);
  return {
    up: has('KeyW', 'ArrowUp'), down: has('KeyS', 'ArrowDown'), left: has('KeyA', 'ArrowLeft'), right: has('KeyD', 'ArrowRight'),
    sneak: has('ShiftLeft', 'ShiftRight'), pick: has('KeyE'), follow: keys.includes('KeyF'),
    keys, clicks: clicks.splice(0),
  };
}
