import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { maskSecret } from '../utils/formatting.js';

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('View or edit configuration');

  configCmd
    .command('show')
    .description('Display current configuration')
    .option('--reveal-secrets', 'Show full credential values')
    .action((options) => {
      if (!config.exists()) {
        console.log(chalk.yellow('No configuration found. Run: youtube-cli setup'));
        return;
      }

      const cfg = config.getAll();
      const oauth = cfg.oauth;

      console.log(chalk.cyan.bold('\nConfiguration:\n'));
      console.log(chalk.bold('OAuth:'));
      console.log(`  Client ID: ${options.revealSecrets ? oauth.client_id : maskSecret(oauth.client_id)}`);
      console.log(`  Client Secret: ${options.revealSecrets ? oauth.client_secret : maskSecret(oauth.client_secret, 0)}`);
      console.log(`  Port: ${oauth.port}`);
      console.log(`  Authenticated: ${config.isAuthenticated() ? chalk.green('Yes') : chalk.red('No')}`);

      if (cfg.defaults) {
        console.log(chalk.bold('\nDefaults:'));
        console.log(`  Privacy: ${cfg.defaults.privacy}`);
        console.log(`  Category: ${cfg.defaults.category}`);
        console.log(`  Output Format: ${cfg.defaults.outputFormat}`);
      }

      console.log(chalk.bold('\nConfig File:'), config.getPath());
      console.log('');
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key, value) => {
      if (!config.exists()) {
        console.log(chalk.yellow('No configuration found. Run: youtube-cli setup'));
        return;
      }

      try {
        config.setNested(key, value);
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
      } catch (error: any) {
        console.error(chalk.red(`✗ Failed to set config: ${error.message}`));
      }
    });
}

export function registerResetCommand(program: Command): void {
  program
    .command('reset')
    .description('Remove all configuration and tokens')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (options) => {
      if (!options.confirm) {
        const inquirer = (await import('inquirer')).default;
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete all configuration?',
            default: false
          }
        ]);

        if (!confirm) {
          console.log('Cancelled.');
          return;
        }
      }

      config.reset();
      console.log(chalk.green('✓ Configuration reset. Run setup to configure again.'));
    });
}
