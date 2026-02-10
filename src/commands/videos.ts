import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { formatVideoList, toJSON, formatNumber, formatDate } from '../utils/formatting.js';
import { validateVideoId, validatePrivacyStatus } from '../utils/validation.js';

export function registerVideosCommand(program: Command): void {
  program
    .command('videos')
    .description('List your videos')
    .option('--limit <number>', 'Maximum number of videos to list', '10')
    .option('--status <status>', 'Filter by privacy status (public|private|unlisted)')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .action(async (options) => {
      requireAuth();

      const spinner = ora('Fetching videos...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const videos = await youtubeAPI.getVideos({
          maxResults: parseInt(options.limit),
          status: options.status
        });

        if (videos.length === 0) {
          spinner.warn('No videos found');
          return;
        }

        spinner.succeed(`Found ${videos.length} video(s)`);

        if (options.format === 'json') {
          console.log(toJSON(videos));
        } else {
          console.log('\n' + formatVideoList(videos));
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch videos');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update <videoId>')
    .description('Update video metadata')
    .option('--title <title>', 'Video title')
    .option('--description <description>', 'Video description')
    .option('--privacy <privacy>', 'Privacy status (public|private|unlisted)')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--category <id>', 'Category ID')
    .action(async (videoId, options) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      if (options.privacy && !validatePrivacyStatus(options.privacy)) {
        console.error(chalk.red('✗ Invalid privacy status. Use: public, private, or unlisted'));
        process.exit(1);
      }

      const updates: any = {};
      if (options.title) updates.title = options.title;
      if (options.description) updates.description = options.description;
      if (options.privacy) updates.privacy = options.privacy;
      if (options.tags) updates.tags = options.tags.split(',').map((t: string) => t.trim());
      if (options.category) updates.category = options.category;

      if (Object.keys(updates).length === 0) {
        console.error(chalk.yellow('⚠  No updates specified. Use --title, --description, --privacy, --tags, or --category'));
        process.exit(1);
      }

      const spinner = ora('Updating video...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.updateVideo(videoId, updates);
        spinner.succeed('Video updated successfully!');

        console.log(chalk.cyan(`\nView: https://youtube.com/watch?v=${videoId}\n`));
      } catch (error: any) {
        spinner.fail('Failed to update video');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <videoId>')
    .description('Delete a video')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (videoId, options) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      if (!options.confirm) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete video ${videoId}?`,
            default: false
          }
        ]);

        if (!confirm) {
          console.log('Cancelled.');
          return;
        }
      }

      const spinner = ora('Deleting video...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.deleteVideo(videoId);
        spinner.succeed('Video deleted successfully!');
      } catch (error: any) {
        spinner.fail('Failed to delete video');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerStatsCommand(program: Command): void {
  program
    .command('stats <videoId>')
    .description('Get video statistics')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .action(async (videoId, options) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      const spinner = ora('Fetching video statistics...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const video = await youtubeAPI.getVideoStats(videoId);
        spinner.stop();

        if (options.format === 'json') {
          console.log(toJSON(video));
        } else {
          console.log(chalk.cyan.bold(`\n${video.snippet.title}\n`));
          console.log(`URL: https://youtube.com/watch?v=${videoId}`);
          console.log(`Status: ${video.status.privacyStatus}`);
          console.log(`Published: ${formatDate(video.snippet.publishedAt)}`);
          
          if (video.statistics) {
            console.log(chalk.bold('\nStatistics:'));
            console.log(`  Views: ${formatNumber(parseInt(video.statistics.viewCount || '0'))}`);
            console.log(`  Likes: ${formatNumber(parseInt(video.statistics.likeCount || '0'))}`);
            console.log(`  Comments: ${formatNumber(parseInt(video.statistics.commentCount || '0'))}`);
          }
          
          if (video.contentDetails?.duration) {
            console.log(`\nDuration: ${video.contentDetails.duration}`);
          }
          
          console.log('');
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch video statistics');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}
