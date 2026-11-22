// One heist from plan to getaway: the world state, a step of the simulation, loot, the caught moment and the payout.
import { TILE, BUDGET, CREW_CUT, ALARM, PAR_TIME } from './config.js';
import { MAP_ROWS, GUARD_SPECS, CAMERA_SPECS, THIEF_START, VAN_TILE, ASTROLABE_VALUE } from './level.js';
import { createGrid, findTiles, tileCenter, isShadow } from './grid.js';
import { canSee } from './sight.js';
import { createGuard, updateGuard, hearsFootsteps, alertGuard } from './guards.js';
import { createCamera, updateCamera, cameraActive } from './cameras.js';
import { createThief, moveThief, rejoinRoute } from './thief.js';
import { createAlarm, raiseAlarm, settleAlarm } from './alarm.js';
import { createKit } from './crew.js';
import { createPlan, routeTiles } from './plan.js';

const LOOT_NAMES = ['Brass sextant', 'Star chart', 'Moon globe', 'Gilt compass', 'Tide clock', 'Comet lens', 'Pocket orrery'];

function seededValues(seed, n) {
  let s = seed >>> 0 || 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(400 + Math.round(((s / 4294967296) * 1100) / 50) * 50);
  }
  return out;
}

export function createHeist(seed = 1, keep = null) {
  const grid = createGrid(MAP_ROWS);
  const values = seededValues(seed, 16);
  const loot = findTiles(grid, '$').map(([tx, ty], i) => ({
    x: tileCenter(tx), y: tileCenter(ty), value: values[i], name: LOOT_NAMES[i % LOOT_NAMES.length], taken: false, big: false,
  }));
  const [ax, ay] = findTiles(grid, 'A')[0];
  loot.push({ x: tileCenter(ax), y: tileCenter(ay), value: ASTROLABE_VALUE, name: 'Tidewater Astrolabe', taken: false, big: true });
  const world = {
    seed, grid, loot, phase: 'brief', time: 0, clock: 0, mapDirty: true,
    thief: createThief(...THIEF_START),
    guards: GUARD_SPECS.map(createGuard),
    cameras: CAMERA_SPECS.map(createCamera),
    alarm: createAlarm(), kit: keep ? keep.kit : createKit(), plan: keep ? keep.plan : createPlan(),
    smokes: [], noises: [], log: [], events: [], armed: null, caught: null, result: null, sightings: [], attempts: keep ? keep.attempts + 1 : 1,
  };
  world.say = (text) => { world.log.unshift({ text, t: 5 }); world.log.length = Math.min(world.log.length, 4); };
  return world;
}

export function startExecution(world) {
  world.thief.route = routeTiles(world.grid, world.plan.waypoints);
  world.thief.step = 1;
  world.thief.following = true;
  world.phase = 'execute';
  world.clock = 0;
  world.say('Mabel: van is idling. Go.');
}

export function takeValue(world) {
  return world.loot.filter((l) => l.taken).reduce((s, l) => s + l.value, 0);
}

export function siteValue(world) {
  return world.loot.reduce((s, l) => s + l.value, 0);
}

function collectLoot(world) {
  const { thief } = world;
  for (const item of world.loot) {
    if (item.taken || Math.hypot(item.x - thief.x, item.y - thief.y) > 16) continue;
    item.taken = true;
    if (item.big) { thief.carrying = true; world.say('Wren: astrolabe in the bag. Back to the van.'); } else world.say(`Wren: ${item.name} +$${item.value}`);
    world.events.push('loot');
  }
}

function watchThief(world, dt) {
  const { thief, grid, alarm, smokes } = world;
  const shadowed = isShadow(grid, thief.x, thief.y);
  world.sightings = [];
  for (const cam of world.cameras) {
    if (!cameraActive(cam) || thief.inVent) continue;
    const seen = canSee(grid, cam, thief, smokes, shadowed);
    if (!seen) continue;
    world.sightings.push({ who: cam.name, kind: 'camera', viewer: cam, ...seen });
    raiseAlarm(alarm, seen.closeness, shadowed, dt);
    const nearest = world.guards.reduce((a, g) => (Math.hypot(g.x - thief.x, g.y - thief.y) < Math.hypot(a.x - thief.x, a.y - thief.y) ? g : a));
    if (nearest.mode === 'patrol') alertGuard(nearest, grid, thief.x, thief.y, false);
  }
  for (const guard of world.guards) {
    const seen = thief.inVent ? null : canSee(grid, guard, thief, smokes, shadowed);
    if (seen) {
      world.sightings.push({ who: guard.name, kind: 'guard', viewer: guard, ...seen });
      raiseAlarm(alarm, seen.closeness, shadowed, dt);
    } else if (hearsFootsteps(guard, thief) && guard.mode === 'patrol') {
      guard.suspicion = Math.min(1, guard.suspicion + dt * 0.6);
      if (guard.suspicion > 0.45) alertGuard(guard, grid, thief.x, thief.y, false);
    }
    updateGuard(guard, world, seen, dt);
    if (!thief.inVent && guard.mode === 'chase' && Math.hypot(guard.x - thief.x, guard.y - thief.y) < 20) {
      return { who: guard.name, kind: 'guard', viewer: guard, dist: Math.hypot(guard.x - thief.x, guard.y - thief.y), shadowed, grabbed: true };
    }
  }
  settleAlarm(alarm, dt);
  if (alarm.level >= ALARM.max) {
    const s = world.sightings[0] || { who: 'the alarm', kind: 'camera', viewer: null, dist: 0 };
    return { ...s, shadowed, grabbed: false };
  }
  return null;
}

export function finishGetaway(world) {
  const take = takeValue(world);
  const tools = world.kit.spent;
  const cut = Math.round(take * CREW_CUT);
  const ghost = world.alarm.peak < ALARM.suspicious;
  const fast = world.clock < PAR_TIME;
  const stars = 1 + (ghost ? 1 : 0) + (fast ? 1 : 0);
  world.result = { take, tools, cut, net: take - tools - cut, time: world.clock, peak: world.alarm.peak, ghost, fast, stars };
  world.phase = 'getaway';
  world.events.push('getaway');
}

export function stepHeist(world, input, dt) {
  world.events = [];
  world.time += dt;
  for (const cam of world.cameras) updateCamera(cam, world.time, dt);
  for (const l of world.log) l.t -= dt;
  world.log = world.log.filter((l) => l.t > 0);
  if (world.phase !== 'execute') {
    for (const g of world.guards) if (world.phase === 'plan' || world.phase === 'brief') updateGuard(g, world, null, dt);
    return;
  }
  world.clock += dt;
  if (input.follow) rejoinRoute(world.thief);
  moveThief(world.thief, world, input, dt);
  collectLoot(world);
  world.smokes = world.smokes.filter((s) => (s.t -= dt) > 0);
  world.noises = world.noises.filter((n) => (n.t -= dt) > 0);
  const caught = watchThief(world, dt);
  if (caught) {
    world.caught = { ...caught, x: world.thief.x, y: world.thief.y, alarm: world.alarm.level, time: world.clock };
    world.phase = 'caught';
    world.events.push('caught');
    return;
  }
  const [vx, vy] = VAN_TILE;
  if (world.thief.carrying && Math.hypot(world.thief.x - tileCenter(vx), world.thief.y - tileCenter(vy)) < TILE) finishGetaway(world);
}

export const STARTING_BUDGET = BUDGET;
