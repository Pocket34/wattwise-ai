// OAuth Service for WattWise AI
// Secure server-side handling with CSRF state protection for Google Home integration

import crypto from 'node:crypto';
import { getDb } from '../db/database.js';

export class OAuthService {
  /**
   * Generates a single-use cryptographically secure CSRF state token
   */
  generateCsrfState() {
    const db = getDb();
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) 
      VALUES (?, ?)
    `).run(`oauth_csrf_state_${state}`, expiresAt);

    return state;
  }

  /**
   * Verifies and immediately consumes a CSRF state token
   */
  verifyAndConsumeState(state) {
    if (!state) return false;
    const db = getDb();
    const key = `oauth_csrf_state_${state}`;
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);

    if (!row) {
      return false; // State not found or already consumed
    }

    // Delete immediately so it can never be reused
    db.prepare('DELETE FROM settings WHERE key = ?').run(key);

    const expiresAt = new Date(row.value).getTime();
    if (Date.now() > expiresAt) {
      return false; // Expired
    }

    return true;
  }

  /**
   * Cleans up expired OAuth states
   */
  pruneExpiredStates() {
    const db = getDb();
    const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'oauth_csrf_state_%'").all();
    const now = Date.now();
    for (const r of rows) {
      if (new Date(r.value).getTime() < now) {
        db.prepare('DELETE FROM settings WHERE key = ?').run(r.key);
      }
    }
  }
}

export const oauthService = new OAuthService();
