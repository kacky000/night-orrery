// Guards: walk their patrol loops, turn their torches, grow suspicious, investigate noises and chase.
import { GUARD, ALARM, TILE } from './config.js';
import { findPath, tileCenter, toTile } from './grid.js';
import { angleDiff } from './sight.js';

export function createGuard(spec) {
  const [tx, ty] = spec.patrol[0];
  return {
    name: spec.name, patrol: spec.patrol, leg: 0, x: tileCenter(tx), y: tileCenter(ty), facing: 0,
    range: GUARD.range, halfAngle: GUARD.halfAngle, mode: 'patrol', suspicion: 0,
    path: [], pathAge: 0, target: null, wait: 0.5, lookTimer: 0,
  };
}

function headTo(guard, grid, x, y) {
  const path = findPath(grid, [toTile(guard.x), toTile(guard.y)], [toTile(x), toTile(y)], 'guard');
  guard.path = path ? path.slice(1).map(([tx, ty]) => [tileCenter(tx), tileCenter(ty)]) : [];
  guard.pathAge = 0;
}

function turnToward(guard, ang, dt) {
  const d = angleDiff(ang, guard.facing);
  const step = GUARD.turnRate * dt;
  guard.facing += Math.abs(d) < step ? d : Math.sign(d) * step;
}

function walkPath(guard, speed, dt) {
  if (!guard.path.length) return true;
  const [px, py] = guard.path[0];
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  turnToward(guard, Math.atan2(dy, dx), dt);
  if (dist <= speed * dt) {
    guard.x = px;
    guard.y = py;
    guard.path.shift();
  } else {
    guard.x += (dx / dist) * speed * dt;
    guard.y += (dy / dist) * speed * dt;
  }
  return guard.path.length === 0;
}

export function alertGuard(guard, grid, x, y, chase) {
  if (guard.mode === 'chase' && !chase) return;
  guard.mode = chase ? 'chase' : 'investigate';
  guard.target = { x, y };
  headTo(guard, grid, x, y);
}

export function updateGuard(guard, world, sighting, dt) {
  const { grid, alarm } = world;
  const speed = alarm.level >= ALARM.alert || guard.mode === 'chase' ? GUARD.alertSpeed : GUARD.speed;
  if (sighting) {
    guard.suspicion = Math.min(1, guard.suspicion + dt * (0.5 + sighting.closeness * 1.6));
    if (guard.suspicion >= 1 || alarm.level >= ALARM.alert) alertGuard(guard, grid, world.thief.x, world.thief.y, true);
    else if (guard.suspicion > 0.3) alertGuard(guard, grid, world.thief.x, world.thief.y, false);
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.12);
  }
  guard.pathAge += dt;
  if (guard.mode === 'chase') {
    if (sighting && guard.pathAge > 0.35) headTo(guard, grid, world.thief.x, world.thief.y);
    if (walkPath(guard, speed, dt)) { guard.mode = 'look'; guard.lookTimer = GUARD.lookTime; }
  } else if (guard.mode === 'investigate') {
    if (walkPath(guard, speed, dt)) { guard.mode = 'look'; guard.lookTimer = GUARD.lookTime; }
  } else if (guard.mode === 'look') {
    guard.lookTimer -= dt;
    guard.facing += dt * 1.6 * Math.sin(guard.lookTimer * 2.2);
    if (guard.lookTimer <= 0) { guard.mode = 'patrol'; guard.path = []; guard.wait = 0; }
  } else {
    if (guard.wait > 0) {
      guard.wait -= dt;
      guard.facing += dt * 0.9;
    } else if (!guard.path.length) {
      guard.leg = (guard.leg + 1) % guard.patrol.length;
      const [tx, ty] = guard.patrol[guard.leg];
      headTo(guard, grid, tileCenter(tx), tileCenter(ty));
    } else if (walkPath(guard, speed, dt)) {
      guard.wait = 0.9;
    }
  }
}

// A running thief can be heard by a guard close by, even through a doorway.
export function hearsFootsteps(guard, thief) {
  return thief.running && Math.hypot(guard.x - thief.x, guard.y - thief.y) < GUARD.hearRun && !thief.inVent;
}

export function patrolPoints(guard) {
  return guard.patrol.map(([tx, ty]) => [tileCenter(tx), tileCenter(ty)]);
}

export const GUARD_TILE = TILE;
