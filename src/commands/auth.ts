import { Command } from 'commander';
import chalk from 'chalk';
import { authenticate } from '../auth/oauth.js';
import { clearTokens } from '../auth/credentials.js';
import { requireSetup } from '../utils/firstRun.js';

export function registerAuthCommand(program: Command): void {
  program
    .command('auth')
    .description('Authenticate with YouTube using configured credentials')
    .option('--port <number>', 'Override OAuth callback port')
    .option('--no-browser', 'Display URL instead of opening browser')
    .action(async (options) => {
      requireSetup();

      const port = options.port ? parseInt(options.port) : undefined;
      const success = await authenticate(port, !options.browser);

      if (!success) {
        process.exit(1);
      }
    });
}

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored tokens (keeps config)')
    .action(() => {
      requireSetup();
      
      clearTokens();
      console.log(chalk.green('✓ Logged out successfully'));
      console.log(chalk.cyan('\nTo authenticate again:'));
      console.log(chalk.bold('  youtube-cli auth\n'));
    });
}
