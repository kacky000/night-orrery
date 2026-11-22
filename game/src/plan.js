// The plan: waypoints on the floor plan, joined into one walkable route from the dock and back.
import { findPath, tileAt, walkable } from './grid.js';
import { THIEF_START } from './level.js';

export function createPlan() {
  return { waypoints: [], preset: null };
}

export function addWaypoint(plan, grid, tx, ty) {
  if (!walkable(tileAt(grid, tx, ty), 'thief', true)) return false;
  const from = plan.waypoints.length ? plan.waypoints[plan.waypoints.length - 1] : THIEF_START;
  if (!findPath(grid, from, [tx, ty], 'thief', true)) return false;
  plan.waypoints.push([tx, ty]);
  plan.preset = null;
  return true;
}

export function removeWaypoint(plan) {
  plan.waypoints.pop();
  plan.preset = null;
}

export function usePreset(plan, preset) {
  plan.waypoints = preset.points.map((p) => [...p]);
  plan.preset = preset.key;
}

export function routeTiles(grid, waypoints, start = THIEF_START) {
  const tiles = [start];
  let cur = start;
  for (const w of waypoints) {
    const leg = findPath(grid, cur, w, 'thief', true);
    if (!leg) break;
    tiles.push(...leg.slice(1));
    cur = w;
  }
  return tiles;
}
