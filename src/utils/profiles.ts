import { config } from './config.js';

export function getActiveProfileName(): string {
  const cfg = config.getAll();
  return cfg.activeProfile || 'default';
}

export function setActiveProfileName(name: string): void {
  const cfg = config.getAll();
  cfg.activeProfile = name;
  cfg.authProfiles = cfg.authProfiles || {};
  cfg.authProfiles[name] = cfg.authProfiles[name] || {};
  config.set('activeProfile', cfg.activeProfile as any);
  config.set('authProfiles', cfg.authProfiles as any);
}

export function ensureProfilesMigrated(): void {
  const cfg = config.getAll();

  // If already using profiles, we're good.
  if (cfg.authProfiles && Object.keys(cfg.authProfiles).length > 0) {
    if (!cfg.activeProfile) {
      cfg.activeProfile = Object.keys(cfg.authProfiles)[0];
      config.set('activeProfile', cfg.activeProfile as any);
    }
    return;
  }

  const oauth: any = cfg.oauth || {};
  const hasLegacyTokens = !!(oauth.refresh_token || oauth.access_token);
  if (!hasLegacyTokens) return;

  const name = cfg.activeProfile || 'default';
  const authProfiles: any = {};
  authProfiles[name] = {
    refresh_token: oauth.refresh_token,
    access_token: oauth.access_token,
    expires_at: oauth.expires_at
  };

  // Remove legacy token fields from oauth; keep client credentials.
  delete oauth.refresh_token;
  delete oauth.access_token;
  delete oauth.expires_at;

  config.set('oauth', oauth);
  config.set('authProfiles', authProfiles);
  config.set('activeProfile', name as any);
}

export function getActiveProfileTokens() {
  ensureProfilesMigrated();
  const cfg = config.getAll();
  const name = getActiveProfileName();
  return cfg.authProfiles?.[name] || {};
}

export function setActiveProfileTokens(patch: Record<string, any>) {
  ensureProfilesMigrated();
  const cfg = config.getAll();
  const name = getActiveProfileName();
  const next = { ...(cfg.authProfiles?.[name] || {}), ...patch };
  const authProfiles = { ...(cfg.authProfiles || {}), [name]: next };
  config.set('authProfiles', authProfiles as any);
}

export function clearActiveProfileTokens() {
  ensureProfilesMigrated();
  const cfg = config.getAll();
  const name = getActiveProfileName();
  const next = { ...(cfg.authProfiles?.[name] || {}) };
  delete next.refresh_token;
  delete next.access_token;
  delete next.expires_at;
  delete next.channel_id;
  delete next.channel_title;
  const authProfiles = { ...(cfg.authProfiles || {}), [name]: next };
  config.set('authProfiles', authProfiles as any);
}
