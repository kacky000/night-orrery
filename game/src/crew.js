// The crew and their tools: what each costs out of the take, how many you bought, and what using one does.
import { TILE } from './config.js';
import { tileAt, setTile, toTile } from './grid.js';
import { alertGuard } from './guards.js';

export const CREW = [
  { name: 'WREN', role: 'Thief', line: 'In and out. Stick to the dark.', color: '#3ee6c1' },
  { name: 'TOCK', role: 'Hacker', line: 'Give me a camera, I give you a loop.', color: '#7fb4ff' },
  { name: 'MABEL', role: 'Driver', line: "Van's idling at the dock.", color: '#ffb228' },
];

export const TOOLS = [
  { id: 'smoke', key: '1', name: 'Smoke bomb', owner: 'WREN', cost: 300, max: 3, note: 'blocks sight 7s' },
  { id: 'loop', key: '2', name: 'Camera loop', owner: 'TOCK', cost: 450, max: 2, note: 'blinds a cam 12s' },
  { id: 'decoy', key: '3', name: 'Radio decoy', owner: 'MABEL', cost: 200, max: 3, note: 'guards check the noise' },
  { id: 'override', key: '4', name: 'Door override', owner: 'TOCK', cost: 350, max: 2, note: 'opens a lock now' },
];

export function createKit() {
  return { smoke: 0, loop: 0, decoy: 0, override: 0, spent: 0, used: 0 };
}

export function buyTool(kit, tool, budget) {
  if (kit[tool.id] >= tool.max || kit.spent + tool.cost > budget) return false;
  kit[tool.id]++;
  kit.spent += tool.cost;
  return true;
}

export function sellTool(kit, tool) {
  if (kit[tool.id] <= 0) return false;
  kit[tool.id]--;
  kit.spent -= tool.cost;
  return true;
}

// Use an armed tool at a point on the map; returns true when a charge was spent.
export function useTool(world, id, x, y) {
  const { kit, grid } = world;
  if (kit[id] <= 0) return false;
  if (id === 'smoke') {
    if (Math.hypot(x - world.thief.x, y - world.thief.y) > 6 * TILE) { world.say('Wren: too far to throw.'); return false; }
    world.smokes.push({ x, y, r: 1.7 * TILE, t: 7 });
    world.say('Wren: smoke out.');
  } else if (id === 'loop') {
    const cam = world.cameras.find((c) => Math.hypot(c.x - x, c.y - y) < 2.5 * TILE);
    if (!cam) { world.say('Tock: click a camera to loop it.'); return false; }
    cam.looped = 12;
    world.say(`Tock: ${cam.name} looped for 12s.`);
  } else if (id === 'decoy') {
    world.noises.push({ x, y, t: 1.4, r: 8 * TILE });
    for (const g of world.guards) if (Math.hypot(g.x - x, g.y - y) < 8 * TILE) alertGuard(g, grid, x, y, false);
    world.say('Mabel: radio chatter planted.');
  } else if (id === 'override') {
    const tx = toTile(x);
    const ty = toTile(y);
    if (tileAt(grid, tx, ty) !== 'L') { world.say('Tock: that is not a locked door.'); return false; }
    setTile(grid, tx, ty, 'D');
    world.mapDirty = true;
    world.say('Tock: door override sent.');
  }
  kit[id]--;
  kit.used++;
  return true;
}
