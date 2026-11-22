// The Halvard Museum after hours: the floor plan, its guards, cameras, loot and the three planned ways in.
// Legend: # wall, . floor, , shadow (safe cover), D open doorway, L locked door, V vent (thief only),
// P display case, C pillar, $ small loot, A the Tidewater Astrolabe, S the getaway van at the dock.
export const MAP_ROWS = [
  '################################',
  '#....#.....,,,.....#.....#.....#',
  '#.S..D.....,,,.....#..$..#.,,,.#',
  '#....#..P......P...D.....D.,,,.#',
  '##D###.............#.....#.....#',
  '#,,..#....P....P...##L####..$..#',
  '#,,..#.............#,,,,.#.....#',
  '#....#......$......D,,,,.D.....#',
  '#....V.............#.....#..P..#',
  '#....#...P....P....#..$..#.....#',
  '#....###D######D####V#####L#####',
  '#....#.......#..........#......#',
  '#,,..D..$....#...C...C..#..,,..#',
  '#,,..#.......L....A.....D..,,.$#',
  '#....#..,,,..#...C...C..#......#',
  '#.$..#..,,,..#..........#...P..#',
  '#....#.......#..........V......#',
  '################################',
];

export const ROOM_LABELS = [
  { text: 'LOADING DOCK', tx: 2.5, ty: 1 },
  { text: 'GRAND GALLERY', tx: 12.5, ty: 4.4 },
  { text: 'MAP ROOM', tx: 22, ty: 1 },
  { text: 'READING ROOM', tx: 22, ty: 6 },
  { text: 'CLOCK HALL', tx: 28.5, ty: 4 },
  { text: 'STAFF HALL', tx: 3, ty: 9.6 },
  { text: 'ARCHIVE', tx: 9.5, ty: 11 },
  { text: 'ORRERY VAULT', tx: 19, ty: 15.8 },
  { text: 'EAST STORE', tx: 28, ty: 11 },
];

export const THIEF_START = [3, 2];
export const VAN_TILE = [2, 2];

export const GUARD_SPECS = [
  { name: 'OTTO', patrol: [[7, 2], [17, 2], [17, 8], [7, 8]] },
  { name: 'BEA', patrol: [[22, 3], [28, 3], [29, 8], [22, 7]] },
  { name: 'INES', patrol: [[15, 11], [22, 11], [22, 15], [15, 15]] },
  { name: 'ROOK', patrol: [[2, 6], [2, 15], [10, 15], [10, 11]] },
];

// A camera hangs on the wall beside floor tile (tx, ty); base is the middle of its sweep, in radians.
export const CAMERA_SPECS = [
  { name: 'CAM 1', tx: 12, ty: 1, ox: 0, oy: -12, base: Math.PI / 2, sweep: 0.95, phase: 0 },
  { name: 'CAM 2', tx: 23, ty: 11, ox: 10, oy: -10, base: (3 * Math.PI) / 4, sweep: 0.55, phase: 1.7 },
  { name: 'CAM 3', tx: 1, ty: 16, ox: -10, oy: 10, base: -1.25, sweep: 0.4, phase: 0.6 },
  { name: 'CAM 4', tx: 30, ty: 1, ox: 10, oy: -10, base: (3 * Math.PI) / 4, sweep: 0.5, phase: 2.4 },
];

export const ASTROLABE_VALUE = 12000;

// Three ways to the astrolabe and back to the van, each a list of waypoints in tiles.
export const ROUTE_PRESETS = [
  { key: 'A', name: 'Front hall', note: 'fast · cams', color: '#ff8a5c', points: [[6, 2], [16, 9], [18, 13], [16, 9], [6, 2], [2, 2]] },
  { key: 'B', name: 'Archive lock', note: 'pick · Rook', color: '#7fd3ff', points: [[2, 6], [5, 12], [12, 13], [18, 13], [12, 13], [5, 12], [2, 6], [2, 2]] },
  { key: 'C', name: 'Reading vent', note: 'shadows', color: '#c59bff', points: [[12, 2], [19, 7], [20, 9], [20, 11], [18, 13], [20, 11], [20, 9], [19, 7], [12, 2], [6, 2], [2, 2]] },
];
