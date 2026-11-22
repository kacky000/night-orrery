// The heads-up display: phase bar on top, crew and tools on the right, alarm meter and loot counter below.
import { COLORS, SCREEN_W, PANEL_X, BOTTOM_Y, MAP_Y, ALARM, BUDGET } from './config.js';
import { CREW, TOOLS } from './crew.js';
import { ROUTE_PRESETS } from './level.js';
import { alarmStage } from './alarm.js';
import { takeValue, siteValue } from './heist.js';

// Clickable regions, shared with main.js for hit-testing.
export const TOOL_ROWS = TOOLS.map((tool, i) => ({ tool, x: PANEL_X + 10, y: 300 + i * 42, w: 236, h: 38 }));
export const PRESET_BUTTONS = ROUTE_PRESETS.map((preset, i) => ({ preset, x: PANEL_X + 10 + i * 80, y: 492, w: 74, h: 46 }));
export const GO_BUTTON = { x: PANEL_X + 10, y: 548, w: 236, h: 34 };

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const clockText = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, SCREEN_W, MAP_Y);
  ctx.fillStyle = COLORS.panelLine;
  ctx.fillRect(0, MAP_Y - 2, SCREEN_W, 2);
  text(ctx, 'NIGHT ORRERY', 16, 32, 26, COLORS.loot);
  text(ctx, 'THE HALVARD MUSEUM JOB', 18, 52, 12, COLORS.dim);
  const phases = [['PLAN', ['brief', 'plan']], ['EXECUTE', ['execute', 'caught']], ['GETAWAY', ['getaway']]];
  phases.forEach(([name, keys], i) => {
    const x = 300 + i * 150;
    const on = keys.includes(world.phase);
    ctx.fillStyle = on ? (name === 'EXECUTE' ? '#0f4a3f' : '#3a2f0c') : '#121a2d';
    ctx.fillRect(x, 14, 132, 36);
    ctx.strokeStyle = on ? (name === 'EXECUTE' ? COLORS.thief : COLORS.loot) : COLORS.panelLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 14, 132, 36);
    text(ctx, `${i + 1} ${name}`, x + 66, 38, 16, on ? '#ffffff' : COLORS.dim, 'center');
    if (i < 2) text(ctx, '▸', x + 141, 38, 16, COLORS.dim, 'center');
  });
  text(ctx, 'Steal the Tidewater Astrolabe · get back to the van', 760, 30, 13, COLORS.text);
  text(ctx, `KIT ${money(world.kit.spent)} of ${money(BUDGET)}   ·   TIME ${clockText(world.clock)}   ·   TRY ${world.attempts}`, 760, 50, 12, COLORS.dim);
}

function drawCrew(ctx, world) {
  text(ctx, 'CREW', PANEL_X + 12, MAP_Y + 20, 13, COLORS.dim);
  CREW.forEach((c, i) => {
    const y = MAP_Y + 30 + i * 62;
    ctx.fillStyle = '#111b30';
    ctx.fillRect(PANEL_X + 10, y, 236, 56);
    ctx.fillStyle = c.color;
    ctx.fillRect(PANEL_X + 10, y, 4, 56);
    const cx = PANEL_X + 40;
    const cy = y + 28;
    ctx.fillStyle = '#0a1426';
    ctx.beginPath();
    ctx.arc(cx, cy, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f4fbff';
    ctx.fillRect(cx - 9, cy - 6, 18, 6);
    ctx.fillStyle = '#0a1426';
    ctx.fillRect(cx - 6, cy - 5, 4, 4);
    ctx.fillRect(cx + 2, cy - 5, 4, 4);
    text(ctx, c.name, PANEL_X + 68, y + 22, 15, '#ffffff');
    text(ctx, c.role.toUpperCase(), PANEL_X + 238, y + 22, 11, c.color, 'right');
    text(ctx, c.line, PANEL_X + 68, y + 42, 10.5, COLORS.dim, 'left', 'normal');
  });
}

function drawTools(ctx, world) {
  const planning = world.phase === 'plan' || world.phase === 'brief';
  text(ctx, planning ? 'TOOLS · click to buy, right-click to sell' : 'TOOLS · press 1-4, click map', PANEL_X + 12, 292, 11.5, COLORS.dim);
  for (const row of TOOL_ROWS) {
    const { tool } = row;
    const armed = world.armed === tool.id;
    const have = world.kit[tool.id];
    ctx.fillStyle = armed ? '#20402f' : '#111b30';
    ctx.fillRect(row.x, row.y, row.w, row.h);
    ctx.strokeStyle = armed ? COLORS.thief : COLORS.panelLine;
    ctx.lineWidth = armed ? 2 : 1;
    ctx.strokeRect(row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1);
    ctx.fillStyle = '#e8f1ff';
    ctx.fillRect(row.x + 6, row.y + 8, 22, 22);
    text(ctx, tool.key, row.x + 17, row.y + 25, 15, '#081020', 'center');
    text(ctx, tool.name, row.x + 36, row.y + 17, 13, '#ffffff');
    text(ctx, `${tool.owner} · ${tool.note}`, row.x + 36, row.y + 32, 10, COLORS.dim, 'left', 'normal');
    text(ctx, money(tool.cost), row.x + row.w - 8, row.y + 17, 12, COLORS.amber, 'right');
    text(ctx, `x${have}`, row.x + row.w - 8, row.y + 32, 13, have ? COLORS.thief : '#56627e', 'right');
  }
}

function drawRoutes(ctx, world) {
  const planning = world.phase === 'plan' || world.phase === 'brief';
  text(ctx, planning ? 'ROUTES · or click the map to plot your own' : 'ROUTE', PANEL_X + 12, 484, 11.5, COLORS.dim);
  for (const b of PRESET_BUTTONS) {
    const on = world.plan.preset === b.preset.key;
    ctx.fillStyle = on ? '#1d2a48' : '#111b30';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = on ? b.preset.color : COLORS.panelLine;
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    text(ctx, `${b.preset.key} ${b.preset.name}`, b.x + b.w / 2, b.y + 19, 10.5, b.preset.color, 'center');
    text(ctx, b.preset.note, b.x + b.w / 2, b.y + 35, 9.5, COLORS.dim, 'center', 'normal');
  }
  const ready = world.plan.waypoints.length > 0;
  ctx.fillStyle = planning ? (ready ? '#0f4a3f' : '#1a2236') : '#121a2d';
  ctx.fillRect(GO_BUTTON.x, GO_BUTTON.y, GO_BUTTON.w, GO_BUTTON.h);
  ctx.strokeStyle = planning && ready ? COLORS.thief : COLORS.panelLine;
  ctx.strokeRect(GO_BUTTON.x + 0.5, GO_BUTTON.y + 0.5, GO_BUTTON.w - 1, GO_BUTTON.h - 1);
  const label = planning ? (ready ? 'SPACE · RUN THE PLAN' : 'PLOT A ROUTE FIRST') : 'WASD take over · F rejoin route';
  text(ctx, label, GO_BUTTON.x + GO_BUTTON.w / 2, GO_BUTTON.y + 22, 12.5, planning && ready ? '#ffffff' : COLORS.dim, 'center');
}

function drawLegend(ctx) {
  const items = [['SAFE SHADOW', COLORS.shadowHatch], ['DANGER CONE', '#ff5656'], ['CAMERA', COLORS.amber], ['LOOT', COLORS.loot]];
  items.forEach(([label, color], i) => {
    const x = PANEL_X + 12 + (i % 2) * 120;
    const y = 596 + Math.floor(i / 2) * 20;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 10, 14, 12);
    text(ctx, label, x + 20, y, 11, COLORS.text);
  });
}

function drawBottomBar(ctx, world) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, BOTTOM_Y, SCREEN_W, 720 - BOTTOM_Y);
  ctx.fillStyle = COLORS.panelLine;
  ctx.fillRect(0, BOTTOM_Y, SCREEN_W, 2);
  const lvl = world.alarm.level;
  const stage = alarmStage(lvl);
  const stageColor = lvl >= ALARM.alert ? COLORS.danger : lvl >= ALARM.suspicious ? COLORS.amber : COLORS.thief;
  text(ctx, 'ALARM', 16, BOTTOM_Y + 30, 18, '#ffffff');
  text(ctx, `${Math.round(lvl)}%  ${stage}`, 470, BOTTOM_Y + 30, 18, stageColor, 'right');
  const bx = 16;
  const by = BOTTOM_Y + 42;
  const bw = 454;
  for (let i = 0; i < 25; i++) {
    const segLevel = (i + 1) * 4;
    const x = bx + i * (bw / 25);
    const filled = lvl >= segLevel - 2;
    const c = segLevel > ALARM.alert ? COLORS.danger : segLevel > ALARM.suspicious ? COLORS.amber : COLORS.thief;
    ctx.fillStyle = filled ? c : '#1a2338';
    ctx.fillRect(x, by, bw / 25 - 3, 22);
  }
  const peakX = bx + (world.alarm.peak / 100) * bw;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(peakX - 1, by - 4, 2, 30);
  text(ctx, 'LOOT', 500, BOTTOM_Y + 30, 18, '#ffffff');
  text(ctx, money(takeValue(world)), 500, BOTTOM_Y + 62, 28, COLORS.loot);
  text(ctx, `of ${money(siteValue(world))} on site`, 640, BOTTOM_Y + 62, 12, COLORS.dim);
  const big = world.loot.find((l) => l.big);
  const goals = [
    [`Astrolabe ${big.taken ? 'in the bag' : 'in the Orrery Vault'}`, big.taken],
    ['Back to the van at the dock', world.phase === 'getaway'],
    [`Under 2:30 for the speed star (${clockText(world.clock)})`, world.clock < 150 && world.phase === 'getaway'],
  ];
  goals.forEach(([label, done], i) => {
    const y = BOTTOM_Y + 22 + i * 20;
    ctx.strokeStyle = done ? COLORS.thief : COLORS.dim;
    ctx.lineWidth = 2;
    ctx.strokeRect(800, y - 11, 13, 13);
    if (done) { ctx.fillStyle = COLORS.thief; ctx.fillRect(803, y - 8, 7, 7); }
    text(ctx, label, 822, y, 13, done ? COLORS.thief : COLORS.text, 'left', 'normal');
  });
}

function drawLog(ctx, world) {
  world.log.forEach((l, i) => {
    const y = MAP_Y + 18 + i * 22;
    ctx.globalAlpha = Math.min(1, l.t);
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    const w = ctx.measureText(l.text).width + 16;
    ctx.fillStyle = 'rgba(6,10,19,0.85)';
    ctx.fillRect(PANEL_X - w - 8, y - 14, w, 20);
    text(ctx, l.text, PANEL_X - 16, y, 13, '#ffffff', 'right');
    ctx.globalAlpha = 1;
  });
}

export function drawHud(ctx, world) {
  drawTopBar(ctx, world);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(PANEL_X, MAP_Y, SCREEN_W - PANEL_X, BOTTOM_Y - MAP_Y);
  ctx.fillStyle = COLORS.panelLine;
  ctx.fillRect(PANEL_X, MAP_Y, 2, BOTTOM_Y - MAP_Y);
  drawCrew(ctx, world);
  drawTools(ctx, world);
  drawRoutes(ctx, world);
  drawLegend(ctx);
  drawBottomBar(ctx, world);
  drawLog(ctx, world);
  if (world.alarm.level >= ALARM.alert && world.phase === 'execute') {
    const a = 0.18 + 0.12 * Math.sin(world.time * 8);
    ctx.strokeStyle = `rgba(255,40,60,${a})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(9, MAP_Y + 9, PANEL_X - 18, BOTTOM_Y - MAP_Y - 18);
  }
}
