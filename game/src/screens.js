// Full-screen moments: the briefing card, the caught freeze-frame that shows who saw you, and the getaway payout.
import { COLORS, MAP_X, MAP_Y, PANEL_X, BOTTOM_Y } from './config.js';
import { conePolygon } from './sight.js';

const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const clockText = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function card(ctx, x, y, w, h, edge) {
  ctx.fillStyle = 'rgba(8,13,26,0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

export function drawBrief(ctx) {
  ctx.fillStyle = 'rgba(4,7,14,0.55)';
  ctx.fillRect(MAP_X, MAP_Y, PANEL_X, BOTTOM_Y - MAP_Y);
  const x = 212;
  const y = 170;
  card(ctx, x, y, 600, 300, COLORS.loot);
  text(ctx, 'THE HALVARD MUSEUM · 02:10 AM', x + 300, y + 40, 14, COLORS.dim, 'center');
  text(ctx, 'Lift the Tidewater Astrolabe', x + 300, y + 80, 28, COLORS.loot, 'center');
  const lines = [
    '1  PLAN: pick a route (A, B, C) or click the floor plan to plot your own.',
    '    Buy tools from the take: smoke, camera loops, decoys, door overrides.',
    '2  EXECUTE: Wren walks your plan. WASD takes over, Shift sneaks, F rejoins.',
    '    Read the red cones and amber cameras. Shadows halve how far they see.',
    '3  GETAWAY: bring the astrolabe back to Mabel at the van.',
  ];
  lines.forEach((l, i) => text(ctx, l, x + 40, y + 126 + i * 26, 14, COLORS.text, 'left', 'normal'));
  text(ctx, 'Click or press Enter to plan the job', x + 300, y + 278, 15, COLORS.thief, 'center');
}

export function drawCaught(ctx, world) {
  const c = world.caught;
  ctx.fillStyle = 'rgba(40,0,10,0.35)';
  ctx.fillRect(MAP_X, MAP_Y, PANEL_X, BOTTOM_Y - MAP_Y);
  ctx.save();
  ctx.translate(MAP_X, MAP_Y);
  if (c.viewer) {
    const v = c.viewer;
    const pts = conePolygon(world.grid, v.x, v.y, v.facing, v.halfAngle, v.range, world.smokes);
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.strokeStyle = '#ff2a4a';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#ff2a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Keep the card clear of the spot where Wren was caught, so the freeze-frame stays readable.
  const x = 262;
  const y = c.y > 288 ? 84 : 420;
  card(ctx, x, y, 500, 190, '#ff2a4a');
  text(ctx, c.grabbed ? 'GRABBED' : 'SPOTTED · LOCKDOWN', x + 250, y + 42, 30, '#ff4d5e', 'center');
  const metres = (c.dist / 32) * 1.5;
  const how = c.grabbed ? `${c.who} caught up with Wren.` : `${c.who} saw Wren from ${metres.toFixed(1)} m${c.shadowed ? ' in shadow' : ' in full light'}.`;
  text(ctx, how, x + 250, y + 78, 16, COLORS.text, 'center', 'normal');
  text(ctx, `Alarm ${Math.round(c.alarm)}% at ${clockText(c.time)} · the outline shows the cone that did it`, x + 250, y + 104, 13, COLORS.dim, 'center', 'normal');
  text(ctx, 'Tip: wait for the sweep, smoke the cone, or crawl the vent.', x + 250, y + 132, 13, COLORS.amber, 'center', 'normal');
  text(ctx, 'R  back to the plan (route and tools kept)', x + 250, y + 168, 15, COLORS.thief, 'center');
}

export function drawGetaway(ctx, world) {
  const r = world.result;
  ctx.fillStyle = 'rgba(4,7,14,0.7)';
  ctx.fillRect(MAP_X, MAP_Y, PANEL_X, BOTTOM_Y - MAP_Y);
  const x = 182;
  const y = 104;
  card(ctx, x, y, 660, 500, COLORS.loot);
  // The van pulling away from the dock.
  const vx = x + 80 + ((world.time * 60) % 120);
  ctx.fillStyle = '#2b3d5e';
  ctx.fillRect(vx, y + 30, 110, 46);
  ctx.fillStyle = COLORS.amber;
  ctx.fillRect(vx + 88, y + 34, 18, 24);
  ctx.fillStyle = '#0b1222';
  ctx.beginPath();
  ctx.arc(vx + 22, y + 78, 10, 0, Math.PI * 2);
  ctx.arc(vx + 86, y + 78, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,178,40,0.5)';
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(vx - 10 - k * 18, y + 44 + k * 7); ctx.lineTo(vx - 40 - k * 18, y + 44 + k * 7); ctx.stroke(); }
  text(ctx, 'CLEAN GETAWAY', x + 450, y + 62, 34, COLORS.loot, 'center');
  text(ctx, '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars), x + 450, y + 98, 28, COLORS.loot, 'center');
  const rows = [
    ['Take', money(r.take), COLORS.loot],
    ['Tools bought', money(-r.tools), COLORS.danger],
    ['Crew cut (Tock + Mabel, 20%)', money(-r.cut), COLORS.danger],
    ['Wren keeps', money(r.net), COLORS.thief],
  ];
  rows.forEach(([label, value, color], i) => {
    const ry = y + 160 + i * 44;
    ctx.fillStyle = i === 3 ? '#0f3a33' : '#111b30';
    ctx.fillRect(x + 40, ry - 28, 580, 38);
    text(ctx, label, x + 60, ry, 18, COLORS.text, 'left', i === 3 ? 'bold' : 'normal');
    text(ctx, value, x + 600, ry, 20, color, 'right');
  });
  const stars = [
    ['Got out with the astrolabe', true],
    [`Ghost: peak alarm under 35% (${Math.round(r.peak)}%)`, r.ghost],
    [`Fast: under 2:30 (${clockText(r.time)})`, r.fast],
  ];
  stars.forEach(([label, ok], i) => text(ctx, `${ok ? '★' : '☆'}  ${label}`, x + 60, y + 360 + i * 30, 16, ok ? COLORS.loot : COLORS.dim, 'left', 'normal'));
  text(ctx, 'R  plan the job again for a cleaner run', x + 330, y + 470, 15, COLORS.thief, 'center');
}
