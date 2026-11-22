// Night Orrery: boots the canvas, routes clicks and keys to the current phase, and runs the frame loop.
import { SCREEN_W, SCREEN_H, MAP_X, MAP_Y, PANEL_X, BOTTOM_Y, BUDGET, ALARM } from './config.js';
import { createHeist, startExecution, stepHeist } from './heist.js';
import { attachInput, readInput } from './input.js';
import { drawWorld } from './render-world.js';
import { drawHud, TOOL_ROWS, PRESET_BUTTONS, GO_BUTTON } from './render-hud.js';
import { drawBrief, drawCaught, drawGetaway } from './screens.js';
import { addWaypoint, removeWaypoint, usePreset } from './plan.js';
import { TOOLS, buyTool, sellTool, useTool } from './crew.js';
import { toTile } from './grid.js';
import { applyShot } from './shots.js';
import { unlockAudio, playClick, playLoot, playAlarmBeep, playCaught, playGetaway } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const status = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 1;
let world = createHeist(seed);
const shot = params.get('shot');
const frozen = shot ? applyShot(world, shot) : false;

const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const onMap = (p) => p.x >= MAP_X && p.x < PANEL_X && p.y >= MAP_Y && p.y < BOTTOM_Y;

function replan() {
  world = createHeist(seed, { kit: world.kit, plan: world.plan, attempts: world.attempts });
  world.phase = 'plan';
  world.say('Back at the van. Adjust the plan.');
}

function handlePlanClick(c) {
  for (const row of TOOL_ROWS) {
    if (!inside(c, row)) continue;
    if (c.button === 2) sellTool(world.kit, row.tool);
    else if (!buyTool(world.kit, row.tool, BUDGET)) world.say('Not enough budget, or that tool is maxed.');
    playClick();
    return;
  }
  for (const b of PRESET_BUTTONS) if (inside(c, b)) { usePreset(world.plan, b.preset); playClick(); return; }
  if (inside(c, GO_BUTTON) && world.plan.waypoints.length) { startExecution(world); playClick(); return; }
  if (!onMap(c)) return;
  if (c.button === 2) removeWaypoint(world.plan);
  else if (!addWaypoint(world.plan, world.grid, toTile(c.x - MAP_X), toTile(c.y - MAP_Y))) world.say('Wren cannot get there.');
  playClick();
}

function handleExecuteInput(input) {
  for (const code of input.keys) {
    const t = TOOLS.find((x) => `Digit${x.key}` === code);
    if (t) world.armed = world.armed === t.id ? null : t.id;
    if (code === 'Escape') world.armed = null;
  }
  for (const c of input.clicks) {
    const row = TOOL_ROWS.find((r) => inside(c, r));
    if (row) { world.armed = world.armed === row.tool.id ? null : row.tool.id; continue; }
    if (world.armed && onMap(c)) {
      if (useTool(world, world.armed, c.x - MAP_X, c.y - MAP_Y)) world.armed = null;
      playClick();
    }
  }
}

function handleInput(input) {
  if (input.keys.length || input.clicks.length) unlockAudio();
  if (world.phase === 'brief') {
    if (input.clicks.length || input.keys.includes('Enter') || input.keys.includes('Space')) world.phase = 'plan';
    return;
  }
  if (world.phase === 'plan') {
    input.clicks.forEach(handlePlanClick);
    for (const code of input.keys) {
      if ((code === 'Space' || code === 'Enter') && world.plan.waypoints.length) startExecution(world);
      if (code === 'Backspace') world.plan.waypoints = [];
      if (code === 'KeyA' || code === 'KeyB' || code === 'KeyC') usePreset(world.plan, PRESET_BUTTONS['ABC'.indexOf(code[3])].preset);
    }
    return;
  }
  if (world.phase === 'execute') { handleExecuteInput(input); return; }
  if (input.keys.includes('KeyR') || input.keys.includes('Enter')) replan();
}

let beepTimer = 0;
function react(dt) {
  for (const e of world.events || []) {
    if (e === 'loot') playLoot();
    if (e === 'caught') playCaught();
    if (e === 'getaway') playGetaway();
  }
  beepTimer -= dt;
  if (world.phase === 'execute' && world.alarm.seenNowShown && beepTimer <= 0) { playAlarmBeep(world.alarm.level); beepTimer = world.alarm.level >= ALARM.alert ? 0.18 : 0.4; }
  world.alarm.seenNowShown = world.sightings.length > 0;
  status.textContent = `${world.phase}: alarm ${Math.round(world.alarm.level)} percent`;
}

function render() {
  ctx.fillStyle = '#060a13';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  drawWorld(ctx, world);
  drawHud(ctx, world);
  if (world.phase === 'brief') drawBrief(ctx);
  if (world.phase === 'caught') drawCaught(ctx, world);
  if (world.phase === 'getaway') drawGetaway(ctx, world);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) {
    const input = readInput();
    handleInput(input);
    if (world.phase === 'execute') input.follow = input.follow || false;
    stepHeist(world, world.phase === 'execute' ? input : { ...input, keys: [], clicks: [] }, dt);
    react(dt);
  }
  render();
  requestAnimationFrame(frame);
}

attachInput(canvas);
if (frozen) render();
requestAnimationFrame(frame);
