import { config } from './config.js';
import chalk from 'chalk';

export function checkFirstRun(): boolean {
  return !config.exists();
}

export function checkAuthentication(): boolean {
  return config.isAuthenticated();
}

export function requireSetup(): void {
  if (checkFirstRun()) {
    console.error(chalk.yellow('\n⚠  Configuration not found.\n'));
    console.log('Please run the setup wizard:');
    console.log(chalk.cyan('  youtube-cli setup\n'));
    console.log('For more information, visit:');
    console.log(chalk.cyan('  https://github.com/yourusername/youtube-cli#setup\n'));
    process.exit(1);
  }
}

export function requireAuth(): void {
  requireSetup();
  
  if (!checkAuthentication()) {
    console.error(chalk.yellow('\n⚠  Not authenticated.\n'));
    console.log('Please authenticate with YouTube:');
    console.log(chalk.cyan('  youtube-cli auth\n'));
    process.exit(1);
  }
}
