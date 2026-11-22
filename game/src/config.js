// Every tuning number and colour of Night Orrery in one place.
export const TILE = 32;
export const COLS = 32;
export const ROWS = 18;
export const SCREEN_W = 1280;
export const SCREEN_H = 720;
export const MAP_X = 0;
export const MAP_Y = 64;
export const PANEL_X = 1024;
export const BOTTOM_Y = 640;

export const THIEF = { speed: 118, sneakSpeed: 68, ventSpeed: 52, radius: 9, pickTime: 1.6, crackTime: 1.4 };
export const GUARD = {
  speed: 58, alertSpeed: 108, radius: 10, range: 5.6 * TILE, halfAngle: 0.6,
  catchDist: 20, lookTime: 2.4, turnRate: 3.2, hearRun: 2.4 * TILE,
};
export const CAMERA = { range: 6.6 * TILE, halfAngle: 0.38, sweepSpeed: 0.55 };
export const ALARM = { baseRise: 12, nearRise: 38, shadowFactor: 0.4, decay: 9, floorShare: 0.35, suspicious: 35, alert: 70, max: 100 };
export const BUDGET = 1500;
export const CREW_CUT = 0.2;
export const PAR_TIME = 150;

export const COLORS = {
  bg: '#060a13', floor: '#0f1a2d', floorLine: '#16243c', wall: '#25304a', wallTop: '#36446a', wallEdge: '#7fd3ff',
  shadow: '#170e2e', shadowHatch: '#3a2a6e', door: '#5d6e94', locked: '#ff9f43', vent: '#55658a',
  guardCone: '255,86,86', cameraCone: '255,178,40', alertCone: '255,30,70', loopedCone: '140,150,170',
  loot: '#ffd34d', thief: '#3ee6c1', guard: '#eef2fb', text: '#e8f1ff', dim: '#8796b5',
  panel: '#0a1120', panelLine: '#22314f', route: '#ffffff', danger: '#ff4d5e', safe: '#a58bff', amber: '#ffb228',
};
