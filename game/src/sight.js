// Line of sight: rays stopped by walls, cases, locked doors and smoke; vision cones as polygons; who sees the thief.
import { blocksSightAt } from './grid.js';

export function castRay(grid, x, y, ang, max, smokes) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  for (let d = 6; d < max; d += 4) {
    const px = x + dx * d;
    const py = y + dy * d;
    if (blocksSightAt(grid, px, py)) return d;
    for (const s of smokes) if ((px - s.x) ** 2 + (py - s.y) ** 2 < s.r * s.r) return d;
  }
  return max;
}

export function conePolygon(grid, x, y, facing, halfAngle, range, smokes, rays = 36) {
  const pts = [[x, y]];
  for (let i = 0; i <= rays; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(grid, x, y, a, range, smokes);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Shadow halves how far a viewer can make the thief out.
export function canSee(grid, viewer, target, smokes, shadowed) {
  const dx = target.x - viewer.x;
  const dy = target.y - viewer.y;
  const dist = Math.hypot(dx, dy);
  const reach = shadowed ? viewer.range * 0.5 : viewer.range;
  if (dist > reach) return null;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), viewer.facing)) > viewer.halfAngle) return null;
  if (castRay(grid, viewer.x, viewer.y, Math.atan2(dy, dx), dist, smokes) < dist - 4) return null;
  return { dist, closeness: 1 - dist / reach };
}
