import { config } from '../utils/config.js';

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
  const oauth = config.get('oauth');
  return oauth?.access_token || null;
}

export function getRefreshToken(): string | null {
  const oauth = config.get('oauth');
  return oauth?.refresh_token || null;
}

export function saveTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  const oauth = config.get('oauth') || {} as any;
  
  oauth.access_token = accessToken;
  oauth.refresh_token = refreshToken;
  oauth.expires_at = Date.now() + (expiresIn * 1000);
  
  config.set('oauth', oauth);
}

export function updateAccessToken(accessToken: string, expiresIn: number): void {
  const oauth = config.get('oauth');
  if (!oauth) return;
  
  oauth.access_token = accessToken;
  oauth.expires_at = Date.now() + (expiresIn * 1000);
  
  config.set('oauth', oauth);
}

export function clearTokens(): void {
  const oauth = config.get('oauth');
  if (!oauth) return;
  
  delete oauth.access_token;
  delete oauth.refresh_token;
  delete oauth.expires_at;
  
  config.set('oauth', oauth);
}

export function isTokenExpired(): boolean {
  const oauth = config.get('oauth');
  if (!oauth?.expires_at) return true;
  
  // Consider expired if less than 5 minutes remaining
  return Date.now() >= (oauth.expires_at - 5 * 60 * 1000);
}
