import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { formatChannelList, toJSON } from '../utils/formatting.js';

export function registerChannelsCommand(program: Command): void {
  program
    .command('channels')
    .description('List your channels')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .action(async (options) => {
      requireAuth();

      const spinner = ora('Fetching channels...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const channels = await youtubeAPI.getChannels();

        if (channels.length === 0) {
          spinner.warn('No channels found');
          return;
        }

        spinner.succeed(`Found ${channels.length} channel(s)`);

        if (options.format === 'json') {
          console.log(toJSON(channels));
        } else {
          console.log('\n' + formatChannelList(channels));
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch channels');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}
