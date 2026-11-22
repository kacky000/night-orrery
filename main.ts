// Hands in Night Orrery (Node 22, standard library only): copies game/ and screenshots/ to the output folder
// and writes dossier.json with the kit's buildDossier. MAKEFUN_OUTPUT_DIR stands in for /output when run locally.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  cpSync(join(repo, folder), join(outDir, folder), { recursive: true });
}

// The gate's caps, so a local run refuses what the scorer would refuse.
const limits = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};
const dossier = buildDossier(outDir, limits);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Night Orrery handed in: dossier.json ${Buffer.byteLength(dossier)} bytes`);
