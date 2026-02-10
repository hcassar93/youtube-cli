import { google } from 'googleapis';
import express from 'express';
import { createServer, Server } from 'http';
import open from 'open';
import chalk from 'chalk';
import ora from 'ora';
import { getCredentials, saveTokens, getRefreshToken, updateAccessToken, isTokenExpired } from './credentials.js';
import { config } from '../utils/config.js';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload'
];

export async function authenticate(port?: number, noBrowser: boolean = false): Promise<boolean> {
  const credentials = getCredentials();
  if (!credentials) {
    console.error(chalk.red('✗ OAuth credentials not found. Please run setup first.'));
    return false;
  }

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
        
        // Display channel info
        await displayChannelInfo(tokens.access_token);
        
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
  if (isTokenExpired()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.error(chalk.yellow('\n⚠  Token expired. Please re-authenticate:'));
      console.log(chalk.cyan('  youtube-cli auth\n'));
      return null;
    }
  }

  const oauth = config.get('oauth');
  return oauth?.access_token || null;
}

async function displayChannelInfo(accessToken: string): Promise<void> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: accessToken
    });

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true
    });

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      console.log(chalk.green('\n✓ You are now authenticated as:'));
      console.log(`  Channel: ${chalk.bold(channel.snippet?.title)}`);
      if (channel.statistics?.subscriberCount) {
        console.log(`  Subscribers: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}`);
      }
      console.log('');
    }
  } catch (error) {
    // Silent fail - not critical
  }
}
