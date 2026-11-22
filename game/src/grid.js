// The tile grid: what each tile is, who can walk it, what blocks sight, and shortest paths between tiles.
import { TILE } from './config.js';

const SOLID = new Set(['#', 'P', 'C']);
const SIGHT_BLOCKERS = new Set(['#', 'P', 'C', 'V', 'L']);

export function createGrid(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const tiles = rows.map((row) => row.split(''));
  return { w, h, tiles };
}

export function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= grid.w || ty >= grid.h) return '#';
  return grid.tiles[ty][tx];
}

export function setTile(grid, tx, ty, ch) {
  grid.tiles[ty][tx] = ch;
}

export function toTile(px) {
  return Math.floor(px / TILE);
}

export function tileCenter(t) {
  return t * TILE + TILE / 2;
}

export function isShadow(grid, px, py) {
  return tileAt(grid, toTile(px), toTile(py)) === ',';
}

export function blocksSightAt(grid, px, py) {
  return SIGHT_BLOCKERS.has(tileAt(grid, toTile(px), toTile(py)));
}

// The thief may plan through locked doors (they get picked on the way); guards hold keys but never fit in vents.
export function walkable(ch, who, planning = false) {
  if (SOLID.has(ch)) return false;
  if (ch === 'V') return who === 'thief';
  if (ch === 'L') return who === 'guard' || planning;
  return true;
}

export function findPath(grid, from, to, who, planning = false) {
  const key = (x, y) => y * grid.w + x;
  const prev = new Map();
  const start = key(from[0], from[1]);
  const goal = key(to[0], to[1]);
  if (!walkable(tileAt(grid, to[0], to[1]), who, planning)) return null;
  prev.set(start, -1);
  const queue = [from];
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (key(x, y) === goal) break;
    for (const [dx, dy] of steps) {
      const nx = x + dx;
      const ny = y + dy;
      if (prev.has(key(nx, ny))) continue;
      if (!walkable(tileAt(grid, nx, ny), who, planning)) continue;
      if (dx && dy && (!walkable(tileAt(grid, x + dx, y), who, planning) || !walkable(tileAt(grid, x, y + dy), who, planning))) continue;
      prev.set(key(nx, ny), key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!prev.has(goal)) return null;
  const path = [];
  for (let k = goal; k !== -1; k = prev.get(k)) path.push([k % grid.w, Math.floor(k / grid.w)]);
  return path.reverse();
}

export function findTiles(grid, ch) {
  const out = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.tiles[y][x] === ch) out.push([x, y]);
  return out;
}
