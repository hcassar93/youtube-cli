import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { validateVideoId, validateImageFile } from '../utils/validation.js';

export function registerThumbnailCommand(program: Command): void {
  program
    .command('thumbnail <videoId> <imagePath>')
    .description('Set video thumbnail')
    .action(async (videoId, imagePath) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      const validation = validateImageFile(imagePath);
      if (!validation.valid) {
        console.error(chalk.red(`✗ ${validation.error}`));
        process.exit(1);
      }

      const spinner = ora('Setting thumbnail...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.setThumbnail(videoId, imagePath);
        spinner.succeed('Thumbnail set successfully!');

        console.log(chalk.cyan(`\nView: https://youtube.com/watch?v=${videoId}\n`));
      } catch (error: any) {
        spinner.fail('Failed to set thumbnail');
        console.error(chalk.red(error.message));
        
        if (error.message.includes('quota')) {
          console.log(chalk.yellow('\n⚠  You may have exceeded your daily quota.'));
        }
        
        process.exit(1);
      }
    });
}
