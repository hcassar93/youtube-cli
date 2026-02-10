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
      console.log('\n4. Configure OAuth Consent Screen:');
      console.log('   https://console.cloud.google.com/apis/credentials/consent');
      console.log(chalk.yellow('   ⚠️  IMPORTANT: Add test users (your Google email) under "Test Users"'));
      console.log(chalk.yellow('   ⚠️  Without this, authentication will fail with "Access blocked" error'));
      console.log('\n5. Create OAuth 2.0 Client ID:');
      console.log('   Go to Credentials → Create Credentials → OAuth 2.0 Client ID');
      console.log('   Application Type: "Desktop app"');
      console.log('   Add authorized redirect URI: http://localhost:3000/oauth2callback');
      console.log('\n6. Copy the Client ID and Client Secret\n');
      console.log(chalk.cyan('Run this command again when you have your credentials ready.\n'));
      return false;
    }
  }

  // Check for existing configuration to allow resuming setup
  const existingOAuth = config.get('oauth');
  const existingDefaults = config.get('defaults');
  
  let clientId = options.clientId || existingOAuth?.client_id;
  let clientSecret = options.clientSecret || existingOAuth?.client_secret;
  let defaultPrivacy = options.defaultPrivacy || existingDefaults?.privacy || 'private';
  let port = options.port || existingOAuth?.port || 3000;

  if (!options.nonInteractive) {
    // Display current configuration if resuming
    if (existingOAuth?.client_id) {
      console.log(chalk.yellow('\nℹ  Existing configuration detected. Skipping already configured values.\n'));
      console.log(chalk.gray(`Client ID: ${existingOAuth.client_id}`));
      console.log(chalk.gray(`Port: ${existingOAuth.port}\n`));
    }
    
    // Only ask for values that aren't already configured
    const questions: any[] = [];
    
    if (!clientId) {
      questions.push({
        type: 'input',
        name: 'clientId',
        message: 'Enter your Client ID:',
        validate: (input: string) => {
          if (!input) return 'Client ID is required';
          if (!validateClientId(input)) {
            return 'Invalid Client ID format (should end with .apps.googleusercontent.com)';
          }
          return true;
        }
      });
    }
    
    if (!clientSecret) {
      questions.push({
        type: 'password',
        name: 'clientSecret',
        message: 'Enter your Client Secret:',
        mask: '*',
        validate: (input: string) => {
          if (!input) return 'Client Secret is required';
          if (!validateClientSecret(input)) {
            return 'Invalid Client Secret format (should be at least 24 characters)';
          }
          return true;
        }
      });
    }
    
    if (!existingDefaults?.privacy) {
      questions.push({
        type: 'list',
        name: 'defaultPrivacy',
        message: 'Default video privacy setting:',
        choices: ['private', 'unlisted', 'public'],
        default: 'private'
      });
    }
    
    if (!existingOAuth?.port) {
      questions.push({
        type: 'number',
        name: 'port',
        message: 'OAuth callback port:',
        default: 3000,
        validate: (input: number) => {
          if (!validatePort(input)) {
            return 'Port must be between 1024 and 65535';
          }
          return true;
        }
      });
    }
    
    if (!existingDefaults?.outputFormat) {
      questions.push({
        type: 'list',
        name: 'outputFormat',
        message: 'Preferred output format:',
        choices: ['table', 'json', 'csv'],
        default: 'table'
      });
    }

    const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

    clientId = answers.clientId || clientId;
    clientSecret = answers.clientSecret || clientSecret;
    defaultPrivacy = answers.defaultPrivacy || defaultPrivacy;
    port = answers.port || port;
    const outputFormat = answers.outputFormat || existingDefaults?.outputFormat || 'table';
    
    // Save output format for later use
    config.setNested('defaults.outputFormat', outputFormat);
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
  config.setNested('defaults.category', existingDefaults?.category || '22');
  // outputFormat already saved above if interactive, or set default here if non-interactive
  if (options.nonInteractive && !existingDefaults?.outputFormat) {
    config.setNested('defaults.outputFormat', 'table');
  }
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
