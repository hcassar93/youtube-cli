import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { formatCommentList, toJSON } from '../utils/formatting.js';
import { validateVideoId } from '../utils/validation.js';

export function registerCommentsCommand(program: Command): void {
  program
    .command('comments <videoId>')
    .description('List video comments')
    .option('--limit <number>', 'Maximum number of comments', '20')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .action(async (videoId, options) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      const spinner = ora('Fetching comments...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const comments = await youtubeAPI.getComments(videoId, parseInt(options.limit));

        if (comments.length === 0) {
          spinner.warn('No comments found');
          return;
        }

        spinner.succeed(`Found ${comments.length} comment(s)`);

        if (options.format === 'json') {
          console.log(toJSON(comments));
        } else {
          console.log('\n' + formatCommentList(comments));
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch comments');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerCommentCommand(program: Command): void {
  program
    .command('comment <videoId> <text>')
    .description('Post a comment on a video')
    .action(async (videoId, text) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      if (!text || text.trim().length === 0) {
        console.error(chalk.red('✗ Comment text cannot be empty'));
        process.exit(1);
      }

      const spinner = ora('Posting comment...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.postComment(videoId, text);
        spinner.succeed('Comment posted successfully!');

        console.log(chalk.cyan(`\nView: https://youtube.com/watch?v=${videoId}\n`));
      } catch (error: any) {
        spinner.fail('Failed to post comment');
        console.error(chalk.red(error.message));
        
        if (error.message.includes('forbidden')) {
          console.log(chalk.yellow('\n⚠  Comments may be disabled for this video.'));
        }
        
        process.exit(1);
      }
    });
}
