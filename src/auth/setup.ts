import inquirer from 'inquirer';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { validateClientId, validateClientSecret, validatePort } from '../utils/validation.js';
import { authenticate } from './oauth.js';

export async function runSetupWizard(options: any = {}): Promise<boolean> {
  console.log(chalk.cyan.bold('\n🎥 YouTube CLI Setup Wizard\n'));

  if (!options.nonInteractive) {
    console.log(chalk.white('Welcome! This tool helps you manage YouTube content from the command line.\n'));
    console.log(chalk.yellow('⚠  You need to provide your own Google OAuth credentials.\n'));
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Have you created a Google Cloud Project and OAuth credentials?',
        default: false
      }
    ]);

    if (!proceed) {
      console.log(chalk.cyan('\nTo get started:\n'));
      console.log('1. Go to: https://console.cloud.google.com/');
      console.log('2. Create a new project (or select existing)');
      console.log('3. Enable the YouTube Data API v3:');
      console.log('   https://console.cloud.google.com/apis/library/youtube.googleapis.com');
      console.log('4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID');
      console.log('5. Application Type: "Desktop app" or "Web application"');
      console.log('6. Add authorized redirect URI: http://localhost:3000/oauth2callback');
      console.log('7. Download the JSON or copy the Client ID and Client Secret\n');
      console.log(chalk.cyan('Run this command again when you have your credentials ready.\n'));
      return false;
    }
  }

  let clientId = options.clientId;
  let clientSecret = options.clientSecret;
  let defaultPrivacy = options.defaultPrivacy || 'private';
  let port = options.port || 3000;

  if (!options.nonInteractive) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'Enter your Client ID:',
        validate: (input) => {
          if (!input) return 'Client ID is required';
          if (!validateClientId(input)) {
            return 'Invalid Client ID format (should end with .apps.googleusercontent.com)';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: 'Enter your Client Secret:',
        mask: '*',
        validate: (input) => {
          if (!input) return 'Client Secret is required';
          if (!validateClientSecret(input)) {
            return 'Invalid Client Secret format (should be at least 24 characters)';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'defaultPrivacy',
        message: 'Default video privacy setting:',
        choices: ['private', 'unlisted', 'public'],
        default: 'private'
      },
      {
        type: 'number',
        name: 'port',
        message: 'OAuth callback port:',
        default: 3000,
        validate: (input) => {
          if (!validatePort(input)) {
            return 'Port must be between 1024 and 65535';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'outputFormat',
        message: 'Preferred output format:',
        choices: ['table', 'json', 'csv'],
        default: 'table'
      }
    ]);

    clientId = answers.clientId;
    clientSecret = answers.clientSecret;
    defaultPrivacy = answers.defaultPrivacy;
    port = answers.port;
  }

  // Save configuration
  const oauthConfig = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `http://localhost:${port}/oauth2callback`,
    port: port
  };

  config.set('oauth', oauthConfig as any);
  config.setNested('defaults.privacy', defaultPrivacy);
  config.setNested('defaults.category', '22');
  config.setNested('defaults.outputFormat', 'table');
  config.setNested('version', '1.0.0');

  console.log(chalk.green('\n✓ Configuration saved to:'), config.getPath());

  if (!options.nonInteractive) {
    const { authNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'authNow',
        message: 'Would you like to authenticate now?',
        default: true
      }
    ]);

    if (authNow) {
      console.log('');
      const success = await authenticate(port);
      
      if (success) {
        console.log(chalk.cyan('\nNext steps:'));
        console.log('  • List your channels:', chalk.bold('youtube-cli channels'));
        console.log('  • Upload a video:', chalk.bold('youtube-cli upload video.mp4 --title "My Video"'));
        console.log('  • Get help:', chalk.bold('youtube-cli --help\n'));
        return true;
      }
    } else {
      console.log(chalk.cyan('\nRun this command when ready to authenticate:'));
      console.log(chalk.bold('  youtube-cli auth\n'));
    }
  }

  return true;
}
