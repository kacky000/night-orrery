// Wren, the thief: follows the planned route or takes manual control, sneaks, crawls vents and picks locks.
import { THIEF } from './config.js';
import { tileAt, setTile, tileCenter, toTile, walkable } from './grid.js';

export function createThief(tx, ty) {
  return {
    x: tileCenter(tx), y: tileCenter(ty), facing: 0, route: [], step: 0, following: true,
    sneaking: false, running: false, inVent: false, picking: 0, carrying: false, cracking: 0,
  };
}

function free(grid, x, y) {
  const r = THIEF.radius;
  for (const [cx, cy] of [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]) {
    if (!walkable(tileAt(grid, toTile(cx), toTile(cy)), 'thief')) return false;
  }
  return true;
}

function speedFor(thief, grid) {
  if (tileAt(grid, toTile(thief.x), toTile(thief.y)) === 'V') return THIEF.ventSpeed;
  return thief.sneaking ? THIEF.sneakSpeed : THIEF.speed;
}

function lockedAhead(grid, thief) {
  const next = thief.route[thief.step];
  if (!next) return null;
  const [tx, ty] = next;
  return tileAt(grid, tx, ty) === 'L' ? next : null;
}

function pickLock(grid, thief, tile, dt, world) {
  thief.picking += dt;
  if (thief.picking >= THIEF.pickTime) {
    setTile(grid, tile[0], tile[1], 'D');
    thief.picking = 0;
    world.say('Wren: lock picked.');
    world.mapDirty = true;
  }
}

export function moveThief(thief, world, input, dt) {
  const { grid } = world;
  const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.sneaking = input.sneak;
  if (mx || my) thief.following = false;
  if (input.follow) thief.following = true;
  let vx = 0;
  let vy = 0;
  if (thief.following && thief.step < thief.route.length) {
    const locked = lockedAhead(grid, thief);
    if (locked) {
      pickLock(grid, thief, locked, dt, world);
    } else {
      const [tx, ty] = thief.route[thief.step];
      const dx = tileCenter(tx) - thief.x;
      const dy = tileCenter(ty) - thief.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) thief.step++;
      else { vx = dx / d; vy = dy / d; }
    }
  } else if (mx || my) {
    const d = Math.hypot(mx, my);
    vx = mx / d;
    vy = my / d;
  }
  if (input.pick) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = toTile(thief.x) + dx;
      const ty = toTile(thief.y) + dy;
      if (tileAt(grid, tx, ty) === 'L') { pickLock(grid, thief, [tx, ty], dt, world); break; }
    }
  }
  const speed = speedFor(thief, grid);
  thief.running = (vx || vy) && !thief.sneaking;
  if (vx || vy) thief.facing = Math.atan2(vy, vx);
  const nx = thief.x + vx * speed * dt;
  const ny = thief.y + vy * speed * dt;
  if (thief.following) { thief.x = nx; thief.y = ny; } else {
    if (free(grid, nx, thief.y)) thief.x = nx;
    if (free(grid, thief.x, ny)) thief.y = ny;
  }
  thief.inVent = tileAt(grid, toTile(thief.x), toTile(thief.y)) === 'V';
}

// Snap the route-following index to the route tile closest to where the thief now stands.
export function rejoinRoute(thief) {
  let best = thief.step;
  let bestD = Infinity;
  for (let i = thief.step; i < thief.route.length; i++) {
    const [tx, ty] = thief.route[i];
    const d = Math.hypot(tileCenter(tx) - thief.x, tileCenter(ty) - thief.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  thief.step = best;
}
