import { Command } from 'commander';
import { runSetupWizard } from '../auth/setup.js';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Interactive setup wizard (first-time configuration)')
    .option('--client-id <id>', 'OAuth Client ID')
    .option('--client-secret <secret>', 'OAuth Client Secret')
    .option('--default-privacy <privacy>', 'Default privacy setting (public|private|unlisted)', 'private')
    .option('--port <number>', 'OAuth callback port', '3000')
    .option('--non-interactive', 'Run in non-interactive mode')
    .action(async (options) => {
      await runSetupWizard(options);
    });
}
