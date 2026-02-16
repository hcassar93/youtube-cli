import { google } from 'googleapis';
import express from 'express';
import { createServer, Server } from 'http';
import open from 'open';
import chalk from 'chalk';
import ora from 'ora';
import { getCredentials, saveTokens, getRefreshToken, updateAccessToken, isTokenExpired } from './credentials.js';
import { config } from '../utils/config.js';
import { ensureProfilesMigrated, getActiveProfileName, setActiveProfileName, setActiveProfileTokens } from '../utils/profiles.js';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload'
];

export async function authenticate(port?: number, noBrowser: boolean = false, profile?: string): Promise<boolean> {
  const credentials = getCredentials();
  if (!credentials) {
    console.error(chalk.red('✗ OAuth credentials not found. Please run setup first.'));
    return false;
  }

  ensureProfilesMigrated();
  if (profile) setActiveProfileName(profile);

  const oauth = config.get('oauth');
  const authPort = port || oauth?.port || 3000;
  const redirectUri = `http://localhost:${authPort}/oauth2callback`;

  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  const spinner = ora('Starting OAuth flow...').start();

  return new Promise((resolve) => {
    const app = express();
    let server: Server;

    app.get('/oauth2callback', async (req, res) => {
      const code = req.query.code as string;

      if (!code) {
        res.send('Authentication failed. No code received.');
        spinner.fail('Authentication failed');
        server.close();
        resolve(false);
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token) {
          throw new Error('Missing tokens');
        }

        saveTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
        );

        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #4CAF50;">✓ Authentication Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);

        spinner.succeed('Authentication successful!');
        
        // Display channel info + store on profile
        const info = await displayChannelInfo(tokens.access_token);
        if (info?.channelId) {
          setActiveProfileTokens({ channel_id: info.channelId, channel_title: info.channelTitle });
        }
        
        server.close();
        resolve(true);
      } catch (error: any) {
        spinner.fail('Authentication failed');
        console.error(chalk.red(`Error: ${error.message}`));
        
        if (error.message?.includes('access_denied') || error.message?.includes('blocked')) {
          console.log(chalk.yellow('\n⚠️  If you see "Access blocked" error:'));
          console.log(chalk.yellow('   Make sure you added your Google email as a test user'));
          console.log(chalk.yellow('   Go to: https://console.cloud.google.com/apis/credentials/consent'));
        }
        
        res.send('Authentication failed. Please try again.');
        server.close();
        resolve(false);
      }
    });

    server = createServer(app);
    
    server.listen(authPort, async () => {
      spinner.text = 'Waiting for authentication...';
      
      console.log('\n' + chalk.cyan('Please visit this URL to authenticate:'));
      console.log(chalk.underline(authUrl) + '\n');

      if (!noBrowser) {
        try {
          await open(authUrl);
          spinner.text = 'Browser opened. Waiting for authentication...';
        } catch {
          spinner.warn('Could not open browser automatically. Please open the URL manually.');
        }
      }
    });

    server.on('error', (error: any) => {
      spinner.fail('Failed to start authentication server');
      
      if (error.code === 'EADDRINUSE') {
        console.error(chalk.red(`\nPort ${authPort} is already in use.`));
        console.log(chalk.yellow('Try a different port:'));
        console.log(chalk.cyan(`  youtube-cli auth --port ${authPort + 1}\n`));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      
      resolve(false);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (server.listening) {
        spinner.fail('Authentication timeout');
        server.close();
        resolve(false);
      }
    }, 5 * 60 * 1000);
  });
}

export async function refreshAccessToken(): Promise<boolean> {
  const credentials = getCredentials();
  const refreshToken = getRefreshToken();

  if (!credentials || !refreshToken) {
    return false;
  }

  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
    
    if (!newTokens.access_token) {
      return false;
    }

    updateAccessToken(
      newTokens.access_token,
      newTokens.expiry_date ? Math.floor((newTokens.expiry_date - Date.now()) / 1000) : 3600
    );

    return true;
  } catch (error) {
    return false;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  ensureProfilesMigrated();

  if (isTokenExpired()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.error(chalk.yellow('\n⚠  Token expired. Please re-authenticate:'));
      console.log(chalk.cyan('  youtube-cli auth\n'));
      return null;
    }
  }

  // tokens are stored under the active profile
  return config.getAll().authProfiles?.[getActiveProfileName()]?.access_token || null;
}

async function displayChannelInfo(accessToken: string): Promise<{ channelId?: string; channelTitle?: string } | null> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: accessToken
    });

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true
    });

    const channels = response.data.items || [];
    if (!channels.length) {
      console.log(chalk.yellow('⚠ No channels found for this account'));
      return null;
    }

    console.log(chalk.cyan('\nChannel Information:'));
    channels.forEach((channel) => {
      console.log(chalk.bold(`\n  • ${channel.snippet?.title}`));
      console.log(`    ID: ${channel.id}`);
      console.log(`    Subscribers: ${channel.statistics?.subscriberCount || 'N/A'}`);
      console.log(`    Videos: ${channel.statistics?.videoCount || 'N/A'}`);
    });
    console.log('');

    return { channelId: channels[0].id ?? undefined, channelTitle: channels[0].snippet?.title ?? undefined };
  } catch (error) {
    // Silent fail - not critical
    return null;
  }
}
