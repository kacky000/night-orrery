// Draws the museum floor plan: rooms, shadows, cones, smoke, loot, the planned route, guards, cameras and Wren.
import { TILE, COLS, ROWS, COLORS, MAP_X, MAP_Y } from './config.js';
import { tileAt, tileCenter } from './grid.js';
import { conePolygon } from './sight.js';
import { cameraActive } from './cameras.js';
import { patrolPoints } from './guards.js';
import { ROOM_LABELS, ROUTE_PRESETS, VAN_TILE } from './level.js';
import { routeTiles } from './plan.js';

let floorLayer = null;

function drawFloorTile(g, ch, x, y) {
  g.fillStyle = COLORS.floor;
  g.fillRect(x, y, TILE, TILE);
  g.strokeStyle = COLORS.floorLine;
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  if (ch === ',') {
    g.fillStyle = COLORS.shadow;
    g.fillRect(x, y, TILE, TILE);
    g.strokeStyle = COLORS.shadowHatch;
    g.beginPath();
    for (let k = -TILE; k < TILE; k += 8) { g.moveTo(x + k, y + TILE); g.lineTo(x + k + TILE, y); }
    g.save();
    g.beginPath();
    g.rect(x, y, TILE, TILE);
    g.clip();
    g.beginPath();
    for (let k = -TILE; k < TILE; k += 8) { g.moveTo(x + k, y + TILE); g.lineTo(x + k + TILE, y); }
    g.stroke();
    g.restore();
  }
}

function drawWallTile(g, grid, tx, ty, x, y) {
  g.fillStyle = COLORS.wall;
  g.fillRect(x, y, TILE, TILE);
  g.fillStyle = COLORS.wallTop;
  g.fillRect(x + 2, y + 2, TILE - 4, TILE - 8);
  g.strokeStyle = COLORS.wallEdge;
  g.lineWidth = 2;
  const open = (dx, dy) => !['#'].includes(tileAt(grid, tx + dx, ty + dy));
  g.beginPath();
  if (open(0, -1)) { g.moveTo(x, y + 1); g.lineTo(x + TILE, y + 1); }
  if (open(0, 1)) { g.moveTo(x, y + TILE - 1); g.lineTo(x + TILE, y + TILE - 1); }
  if (open(-1, 0)) { g.moveTo(x + 1, y); g.lineTo(x + 1, y + TILE); }
  if (open(1, 0)) { g.moveTo(x + TILE - 1, y); g.lineTo(x + TILE - 1, y + TILE); }
  g.stroke();
}

function drawFixture(g, ch, x, y) {
  if (ch === 'D') {
    g.fillStyle = COLORS.door;
    g.fillRect(x + 4, y + 4, 4, TILE - 8);
    g.fillRect(x + TILE - 8, y + 4, 4, TILE - 8);
  } else if (ch === 'L') {
    g.fillStyle = '#3a2410';
    g.fillRect(x, y, TILE, TILE);
    g.strokeStyle = COLORS.locked;
    g.lineWidth = 3;
    for (let k = 6; k < TILE; k += 8) { g.beginPath(); g.moveTo(x + k, y + 2); g.lineTo(x + k, y + TILE - 2); g.stroke(); }
    g.fillStyle = COLORS.locked;
    g.fillRect(x + 10, y + 14, 12, 10);
    g.strokeRect(x + 12, y + 8, 8, 8);
  } else if (ch === 'V') {
    g.fillStyle = '#1b2338';
    g.fillRect(x, y, TILE, TILE);
    g.strokeStyle = COLORS.vent;
    g.lineWidth = 2;
    g.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
    for (let k = 9; k < TILE - 6; k += 5) { g.beginPath(); g.moveTo(x + 6, y + k); g.lineTo(x + TILE - 6, y + k); g.stroke(); }
  } else if (ch === 'P') {
    g.fillStyle = '#1d3346';
    g.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    g.strokeStyle = '#9fe8ff';
    g.lineWidth = 1.5;
    g.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
    g.fillStyle = '#6fb8c9';
    g.beginPath();
    g.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2);
    g.fill();
  } else if (ch === 'C') {
    g.fillStyle = '#3b4a70';
    g.beginPath();
    g.arc(x + TILE / 2, y + TILE / 2, 12, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = COLORS.wallEdge;
    g.lineWidth = 2;
    g.stroke();
  }
}

function buildFloorLayer(grid) {
  const layer = document.createElement('canvas');
  layer.width = COLS * TILE;
  layer.height = ROWS * TILE;
  const g = layer.getContext('2d');
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = tileAt(grid, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === '#') drawWallTile(g, grid, tx, ty, x, y);
      else { drawFloorTile(g, ch, x, y); drawFixture(g, ch, x, y); }
    }
  }
  g.font = 'bold 11px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(160,190,235,0.45)';
  for (const r of ROOM_LABELS) g.fillText(r.text, r.tx * TILE + TILE / 2, r.ty * TILE + 14);
  return layer;
}

function fillCone(ctx, pts, rgb, strong) {
  const [ox, oy] = pts[0];
  let far = 1;
  for (const [x, y] of pts) far = Math.max(far, Math.hypot(x - ox, y - oy));
  const grad = ctx.createRadialGradient(ox, oy, 4, ox, oy, far);
  grad.addColorStop(0, `rgba(${rgb},${strong ? 0.62 : 0.5})`);
  grad.addColorStop(1, `rgba(${rgb},${strong ? 0.22 : 0.12})`);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},0.85)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCones(ctx, world) {
  const spotted = new Set(world.sightings.map((s) => s.who));
  for (const cam of world.cameras) {
    const active = cameraActive(cam);
    const pts = conePolygon(world.grid, cam.x, cam.y, cam.facing, cam.halfAngle, cam.range, world.smokes);
    fillCone(ctx, pts, active ? (spotted.has(cam.name) ? COLORS.alertCone : COLORS.cameraCone) : COLORS.loopedCone, spotted.has(cam.name));
  }
  for (const g of world.guards) {
    const pts = conePolygon(world.grid, g.x, g.y, g.facing, g.halfAngle, g.range, world.smokes);
    const hot = g.mode === 'chase' || spotted.has(g.name);
    fillCone(ctx, pts, hot ? COLORS.alertCone : COLORS.guardCone, hot);
  }
}

function drawSmoke(ctx, world) {
  for (const s of world.smokes) {
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + world.time * 0.3;
      const r = s.r * (0.55 + 0.1 * (i % 3));
      ctx.fillStyle = `rgba(200,208,222,${0.22 * Math.min(1, s.t)})`;
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(a) * s.r * 0.4, s.y + Math.sin(a) * s.r * 0.4, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const n of world.noises) {
    ctx.strokeStyle = `rgba(255,178,40,${n.t / 1.4})`;
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, (1.4 - n.t) * 90 + k * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function tag(ctx, text, x, y, color, bg = 'rgba(6,10,19,0.82)') {
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = bg;
  ctx.fillRect(x - w / 2, y - 9, w, 16);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 3);
}

function drawLoot(ctx, world) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(world.time * 3 + item.x);
    const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, item.big ? 34 : 20);
    glow.addColorStop(0, `rgba(255,211,77,${0.55 * pulse})`);
    glow.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(item.x - 36, item.y - 36, 72, 72);
    if (item.big) {
      ctx.strokeStyle = COLORS.loot;
      ctx.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(item.x, item.y, 13 - k * 3, 6 + k, world.time * 0.6 + k, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      tag(ctx, 'ASTROLABE $12,000', item.x, item.y - 26, COLORS.loot);
    } else {
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 8);
      ctx.lineTo(item.x + 7, item.y);
      ctx.lineTo(item.x, item.y + 8);
      ctx.lineTo(item.x - 7, item.y);
      ctx.closePath();
      ctx.fill();
      tag(ctx, `$${item.value}`, item.x, item.y - 17, COLORS.loot);
    }
  }
  const [vx, vy] = VAN_TILE;
  const x = tileCenter(vx);
  const y = tileCenter(vy);
  ctx.fillStyle = '#2b3d5e';
  ctx.fillRect(x - 22, y - 13, 44, 26);
  ctx.fillStyle = COLORS.amber;
  ctx.fillRect(x + 12, y - 11, 8, 22);
  ctx.fillStyle = '#0b1222';
  ctx.fillRect(x - 18, y - 9, 26, 18);
  tag(ctx, 'VAN', x - 4, y + 1, COLORS.amber, 'rgba(0,0,0,0)');
}

function drawPath(ctx, tiles, color, width, dash, alpha) {
  if (tiles.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  tiles.forEach(([tx, ty], i) => (i ? ctx.lineTo(tileCenter(tx), tileCenter(ty)) : ctx.moveTo(tileCenter(tx), tileCenter(ty))));
  ctx.stroke();
  ctx.restore();
}

function drawRoute(ctx, world) {
  const { plan, thief, phase } = world;
  if (phase === 'plan' || phase === 'brief') {
    for (const p of ROUTE_PRESETS) if (plan.preset !== p.key) drawPath(ctx, routeTiles(world.grid, p.points), p.color, 2, [3, 6], 0.45);
    for (const g of world.guards) {
      const pts = patrolPoints(g);
      ctx.strokeStyle = 'rgba(255,110,110,0.55)';
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  const preset = ROUTE_PRESETS.find((p) => p.key === plan.preset);
  const color = preset ? preset.color : COLORS.route;
  const tiles = phase === 'plan' || phase === 'brief' ? routeTiles(world.grid, plan.waypoints) : thief.route;
  const done = phase === 'execute' || phase === 'caught' ? thief.step : 0;
  drawPath(ctx, tiles.slice(0, done + 1), color, 2, [4, 5], 0.35);
  drawPath(ctx, tiles.slice(Math.max(0, done - 1)), color, 3, [8, 6], 0.95);
  plan.waypoints.forEach(([tx, ty], i) => {
    const x = tileCenter(tx);
    const y = tileCenter(ty);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#081020';
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x, y + 3.5);
  });
}

function drawGuard(ctx, g) {
  ctx.fillStyle = '#0d1a33';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20345e';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 8, g.facing + 0.9, g.facing + Math.PI * 2 - 0.9);
  ctx.lineTo(g.x, g.y);
  ctx.fill();
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 11, g.y + Math.sin(g.facing) * 11, 3, 0, Math.PI * 2);
  ctx.fill();
  const chase = g.mode === 'chase';
  const sus = chase ? '!' : g.suspicion > 0.2 || g.mode === 'investigate' ? '?' : '';
  tag(ctx, sus ? `${g.name} ${sus}` : g.name, g.x, g.y - 22, chase ? COLORS.danger : sus ? COLORS.amber : '#ffb3b3');
  if (g.suspicion > 0.02 && !chase) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(g.x - 14, g.y + 14, 28, 4);
    ctx.fillStyle = COLORS.amber;
    ctx.fillRect(g.x - 14, g.y + 14, 28 * g.suspicion, 4);
  }
}

function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(cam.facing);
  ctx.fillStyle = '#1a2236';
  ctx.fillRect(-8, -6, 16, 12);
  ctx.fillStyle = cameraActive(cam) ? '#ff3b4f' : '#7d8799';
  ctx.beginPath();
  ctx.arc(7, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const looped = !cameraActive(cam);
  tag(ctx, looped ? `${cam.name} LOOPED ${Math.ceil(cam.looped)}s` : cam.name, cam.x, cam.y + (cam.y < 60 ? 22 : -18), looped ? '#c9d2e3' : COLORS.amber);
}

function drawThief(ctx, world) {
  const t = world.thief;
  if (t.inVent) {
    ctx.strokeStyle = COLORS.thief;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    tag(ctx, 'WREN · IN VENT', t.x, t.y - 22, COLORS.thief);
    return;
  }
  const ring = ctx.createRadialGradient(t.x, t.y, 6, t.x, t.y, 24);
  ring.addColorStop(0, 'rgba(62,230,193,0.45)');
  ring.addColorStop(1, 'rgba(62,230,193,0)');
  ctx.fillStyle = ring;
  ctx.fillRect(t.x - 24, t.y - 24, 48, 48);
  ctx.fillStyle = '#0a2a2a';
  ctx.beginPath();
  ctx.arc(t.x, t.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 11, t.facing - 2.3, t.facing + 2.3);
  ctx.lineTo(t.x, t.y);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.fillRect(t.x + Math.cos(t.facing) * 4 - 3, t.y + Math.sin(t.facing) * 4 - 2, 6, 4);
  if (t.carrying) {
    ctx.strokeStyle = COLORS.loot;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x - Math.cos(t.facing) * 9, t.y - Math.sin(t.facing) * 9, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (t.picking > 0) {
    ctx.strokeStyle = COLORS.locked;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 16, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * t.picking) / 1.6);
    ctx.stroke();
  }
  tag(ctx, t.sneaking ? 'WREN · SNEAK' : 'WREN', t.x, t.y - 23, COLORS.thief);
}

function drawSightLines(ctx, world) {
  for (const s of world.sightings) {
    if (!s.viewer) continue;
    ctx.strokeStyle = 'rgba(255,60,80,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(s.viewer.x, s.viewer.y);
    ctx.lineTo(world.thief.x, world.thief.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function invalidateFloor() {
  floorLayer = null;
}

export function drawWorld(ctx, world) {
  if (!floorLayer || world.mapDirty) { floorLayer = buildFloorLayer(world.grid); world.mapDirty = false; }
  ctx.save();
  ctx.translate(MAP_X, MAP_Y);
  ctx.drawImage(floorLayer, 0, 0);
  drawCones(ctx, world);
  drawSmoke(ctx, world);
  drawLoot(ctx, world);
  drawRoute(ctx, world);
  drawSightLines(ctx, world);
  for (const cam of world.cameras) drawCamera(ctx, cam);
  for (const g of world.guards) drawGuard(ctx, g);
  drawThief(ctx, world);
  ctx.restore();
}
