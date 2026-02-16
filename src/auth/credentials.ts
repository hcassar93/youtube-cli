import { config } from '../utils/config.js';
import { getActiveProfileTokens, setActiveProfileTokens, clearActiveProfileTokens, ensureProfilesMigrated } from '../utils/profiles.js';

export function getCredentials(): { clientId: string; clientSecret: string } | null {
  const oauth = config.get('oauth');
  
  if (!oauth?.client_id || !oauth?.client_secret) {
    return null;
  }
  
  return {
    clientId: oauth.client_id,
    clientSecret: oauth.client_secret
  };
}

export function getAccessToken(): string | null {
  const p = getActiveProfileTokens();
  return p.access_token || null;
}

export function getRefreshToken(): string | null {
  const p = getActiveProfileTokens();
  return p.refresh_token || null;
}

export function saveTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  ensureProfilesMigrated();
  setActiveProfileTokens({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + (expiresIn * 1000)
  });
}

export function updateAccessToken(accessToken: string, expiresIn: number): void {
  ensureProfilesMigrated();
  setActiveProfileTokens({
    access_token: accessToken,
    expires_at: Date.now() + (expiresIn * 1000)
  });
}

export function clearTokens(): void {
  clearActiveProfileTokens();
}

export function isTokenExpired(): boolean {
  const p: any = getActiveProfileTokens();
  if (!p?.expires_at) return true;

  // Consider expired if less than 5 minutes remaining
  return Date.now() >= (p.expires_at - 5 * 60 * 1000);
}
