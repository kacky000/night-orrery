// The alarm meter: rises while anyone sees the thief, falls back slowly but never below a share of its peak.
import { ALARM } from './config.js';

export function createAlarm() {
  return { level: 0, peak: 0, seenNow: false };
}

export function raiseAlarm(alarm, closeness, shadowed, dt) {
  const rate = (ALARM.baseRise + ALARM.nearRise * closeness) * (shadowed ? ALARM.shadowFactor : 1);
  alarm.level = Math.min(ALARM.max, alarm.level + rate * dt);
  alarm.peak = Math.max(alarm.peak, alarm.level);
  alarm.seenNow = true;
}

export function settleAlarm(alarm, dt) {
  if (!alarm.seenNow) alarm.level = Math.max(alarm.peak * ALARM.floorShare, alarm.level - ALARM.decay * dt);
  alarm.seenNow = false;
}

export function alarmStage(level) {
  if (level >= ALARM.max) return 'LOCKDOWN';
  if (level >= ALARM.alert) return 'ALERT';
  if (level >= ALARM.suspicious) return 'SUSPICIOUS';
  return 'QUIET';
}
