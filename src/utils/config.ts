import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import { chmodSync, existsSync } from 'fs';

export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  redirect_uri: string;
  port: number;
}

export interface DefaultsConfig {
  privacy: 'public' | 'private' | 'unlisted';
  category: string;
  outputFormat: 'table' | 'json' | 'csv';
}

export interface AuthProfileTokens {
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  /** Cached for display/debugging; not required for auth. */
  channel_id?: string;
  channel_title?: string;
}

export interface AppConfig {
  /** OAuth client credentials + local redirect settings */
  oauth: OAuthConfig;
  defaults: DefaultsConfig;
  version: string;

  /** Multiple auth token sets (e.g. different YouTube channels/brand accounts). */
  authProfiles?: Record<string, AuthProfileTokens>;
  /** Active auth profile name. */
  activeProfile?: string;
}

const DEFAULT_CONFIG: Partial<AppConfig> = {
  defaults: {
    privacy: 'private',
    category: '22',
    outputFormat: 'table'
  },
  version: '1.0.0'
};

class ConfigManager {
  private conf: Conf<AppConfig>;
  private configPath: string;

  constructor() {
    const configDir = process.env.YOUTUBE_CLI_CONFIG_DIR || join(homedir(), '.youtube-cli');
    this.configPath = join(configDir, 'config.json');
    
    this.conf = new Conf<AppConfig>({
      projectName: 'youtube-cli',
      cwd: configDir,
      configName: 'config',
      defaults: DEFAULT_CONFIG as any
    });

    // Ensure secure permissions
    this.ensureSecurePermissions();
  }

  private ensureSecurePermissions(): void {
    try {
      const configFile = this.conf.path;
      if (existsSync(configFile)) {
        chmodSync(configFile, 0o600);
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }

  public exists(): boolean {
    return this.conf.has('oauth.client_id');
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] | undefined {
    return this.conf.get(key);
  }

  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.conf.set(key, value);
    this.ensureSecurePermissions();
  }

  public setNested(key: string, value: any): void {
    this.conf.set(key as any, value);
    this.ensureSecurePermissions();
  }

  public getNested(key: string): any {
    return this.conf.get(key as any);
  }

  public getAll(): AppConfig {
    return this.conf.store;
  }

  public reset(): void {
    this.conf.clear();
  }

  public getPath(): string {
    return this.conf.path;
  }

  public isAuthenticated(): boolean {
    const store = this.getAll();
    const active = store.activeProfile || 'default';
    const p = store.authProfiles?.[active];

    // Back-compat: older configs stored tokens under oauth.*
    const oauth = store.oauth;

    return !!(p?.access_token || p?.refresh_token || oauth?.access_token || oauth?.refresh_token);
  }
}

export const config = new ConfigManager();
