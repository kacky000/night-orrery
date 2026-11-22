// Screenshot scenes (?shot=name): play the real rules forward from a scripted plan, then freeze one frame.
import { TILE } from './config.js';
import { ROUTE_PRESETS } from './level.js';
import { TOOLS, buyTool, useTool } from './crew.js';
import { usePreset } from './plan.js';
import { startExecution, stepHeist, finishGetaway } from './heist.js';
import { tileCenter } from './grid.js';

const IDLE = { up: false, down: false, left: false, right: false, sneak: false, pick: false, follow: false, keys: [], clicks: [] };
const tool = (id) => TOOLS.find((t) => t.id === id);

function run(world, seconds, input = IDLE) {
  for (let t = 0; t < seconds; t += 1 / 60) stepHeist(world, input, 1 / 60);
}

function placeGuard(world, name, tx, ty, facing, mode = 'patrol', suspicion = 0) {
  const g = world.guards.find((x) => x.name === name);
  g.x = tileCenter(tx);
  g.y = tileCenter(ty);
  g.facing = facing;
  g.mode = mode;
  g.suspicion = suspicion;
  g.path = [];
  g.wait = 99;
}

function walkTo(world, tx, ty) {
  let i = 0;
  world.thief.route.forEach(([x, y], k) => {
    const [bx, by] = world.thief.route[i];
    if (Math.hypot(x - tx, y - ty) < Math.hypot(bx - tx, by - ty)) i = k;
  });
  const [x, y] = world.thief.route[i];
  world.thief.x = tileCenter(x);
  world.thief.y = tileCenter(y);
  world.thief.step = i + 1;
}

function planShot(world) {
  world.phase = 'plan';
  usePreset(world.plan, ROUTE_PRESETS[2]);
  for (const id of ['smoke', 'smoke', 'loop', 'decoy']) buyTool(world.kit, tool(id), 1500);
  run(world, 3.2);
  world.say('Tock: CAM 2 watches the vault door.');
  world.say('Plan C keeps Wren in the Reading Room shadows.');
}

function executeShot(world) {
  planShot(world);
  startExecution(world);
  walkTo(world, 13, 5);
  world.loot.find((l) => l.value && !l.big && Math.abs(l.x - tileCenter(12)) < 2 && Math.abs(l.y - tileCenter(7)) < 2).taken = true;
  world.loot.find((l) => !l.big && Math.abs(l.x - tileCenter(22)) < 2 && Math.abs(l.y - tileCenter(2)) < 2).taken = true;
  placeGuard(world, 'OTTO', 16, 8, -2.2, 'investigate', 0.55);
  placeGuard(world, 'BEA', 22, 3, 0.2);
  placeGuard(world, 'INES', 15, 12, 0.3);
  placeGuard(world, 'ROOK', 2, 9, Math.PI / 2);
  useTool(world, 'smoke', tileCenter(15) - 6, tileCenter(6));
  useTool(world, 'loop', tileCenter(23), tileCenter(11));
  world.time = 1.2;
  world.clock = 47;
  world.alarm.level = 41;
  world.alarm.peak = 48;
  world.thief.sneaking = true;
  world.thief.facing = 0.3;
  for (const cam of world.cameras) cam.facing = cam.base + Math.sin(world.time * 0.55 + cam.phase) * cam.sweep;
  world.say('Wren: Star chart +$' + world.loot.filter((l) => l.taken)[0].value);
}

function caughtShot(world) {
  usePreset(world.plan, ROUTE_PRESETS[0]);
  buyTool(world.kit, tool('smoke'), 1500);
  startExecution(world);
  walkTo(world, 17, 12);
  world.time = 3;
  world.clock = 71;
  placeGuard(world, 'INES', 21, 15, -2.4, 'chase', 1);
  placeGuard(world, 'OTTO', 12, 7, 0);
  world.alarm.level = 100;
  world.alarm.peak = 100;
  world.cameras.forEach((c) => { c.facing = c.base + Math.sin(world.time * 0.55 + c.phase) * c.sweep; });
  const ines = world.guards.find((g) => g.name === 'INES');
  ines.facing = Math.atan2(world.thief.y - ines.y, world.thief.x - ines.x);
  world.sightings = [{ who: 'INES', kind: 'guard', viewer: ines, dist: Math.hypot(ines.x - world.thief.x, ines.y - world.thief.y) }];
  world.caught = { who: 'INES', kind: 'guard', viewer: ines, dist: world.sightings[0].dist, shadowed: false, grabbed: false, x: world.thief.x, y: world.thief.y, alarm: 100, time: 71 };
  world.phase = 'caught';
}

function getawayShot(world) {
  usePreset(world.plan, ROUTE_PRESETS[2]);
  for (const id of ['smoke', 'loop']) buyTool(world.kit, tool(id), 1500);
  startExecution(world);
  world.loot.filter((l) => l.big || l.y < 10 * TILE).forEach((l) => { l.taken = true; });
  world.thief.carrying = true;
  world.clock = 128;
  world.alarm.peak = 29;
  world.alarm.level = 10;
  finishGetaway(world);
  world.time = 0.9;
}

export const SHOTS = { plan: planShot, execute: executeShot, caught: caughtShot, getaway: getawayShot };

export function applyShot(world, name) {
  const shot = SHOTS[name];
  if (!shot) return false;
  shot(world);
  return true;
}
