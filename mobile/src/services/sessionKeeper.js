import { registerPlugin, Capacitor } from '@capacitor/core';
import { getStoredCookie } from './api';

const SessionKeeper = registerPlugin('SessionKeeper');

/**
 * Start native Android Foreground Service to ping KeepSessionAlive.aspx
 * every 10 minutes even when the app is minimized or closed.
 */
export async function startBackgroundSessionKeeper(explicitCookie = null) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const cookie = explicitCookie || getStoredCookie();
    if (!cookie) return;

    await SessionKeeper.startService({ cookie });
    console.log('[SessionKeeper] Background service started successfully');
  } catch (err) {
    console.warn('[SessionKeeper] Could not start background service:', err);
  }
}

/**
 * Stop the background service (e.g., when the student logs out).
 */
export async function stopBackgroundSessionKeeper() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await SessionKeeper.stopService();
    console.log('[SessionKeeper] Background service stopped');
  } catch (err) {
    console.warn('[SessionKeeper] Could not stop background service:', err);
  }
}

/**
 * Trigger an immediate one-off ping to KeepSessionAlive.aspx
 */
export async function pingSessionNow() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await SessionKeeper.pingNow();
  } catch (err) {
    console.warn('[SessionKeeper] Could not trigger immediate ping:', err);
  }
}

/**
 * Check if the background keeper is running and when the last ping occurred
 */
export async function getSessionKeeperStatus() {
  if (!Capacitor.isNativePlatform()) {
    return { isRunning: false, lastPingTimestamp: 0 };
  }

  try {
    return await SessionKeeper.getStatus();
  } catch (err) {
    return { isRunning: false, lastPingTimestamp: 0 };
  }
}
