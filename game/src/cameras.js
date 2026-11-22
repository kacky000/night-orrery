// Security cameras: sweep back and forth on the wall; Tock's loop blinds one for a while.
import { CAMERA } from './config.js';
import { tileCenter } from './grid.js';

export function createCamera(spec) {
  return {
    name: spec.name, x: tileCenter(spec.tx) + spec.ox, y: tileCenter(spec.ty) + spec.oy,
    base: spec.base, sweep: spec.sweep, phase: spec.phase, facing: spec.base,
    range: CAMERA.range, halfAngle: CAMERA.halfAngle, looped: 0,
  };
}

export function updateCamera(cam, time, dt) {
  cam.facing = cam.base + Math.sin(time * CAMERA.sweepSpeed + cam.phase) * cam.sweep;
  cam.looped = Math.max(0, cam.looped - dt);
}

export function cameraActive(cam) {
  return cam.looped <= 0;
}
