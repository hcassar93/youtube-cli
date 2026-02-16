import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { formatPlaylistList, toJSON } from '../utils/formatting.js';
import { validateVideoId, validatePrivacyStatus } from '../utils/validation.js';

export function registerPlaylistsCommand(program: Command): void {
  program
    .command('playlists')
    .description('List playlists')
    .option('--limit <number>', 'Maximum number of playlists', '25')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .action(async (options) => {
      requireAuth();

      const spinner = ora('Fetching playlists...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const playlists = await youtubeAPI.getPlaylists(parseInt(options.limit));

        if (playlists.length === 0) {
          spinner.warn('No playlists found');
          return;
        }

        spinner.succeed(`Found ${playlists.length} playlist(s)`);

        if (options.format === 'json') {
          console.log(toJSON(playlists));
        } else {
          console.log('\n' + formatPlaylistList(playlists));
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch playlists');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerPlaylistCreateCommand(program: Command): void {
  program
    .command('playlist-create')
    .description('Create a new playlist')
    .requiredOption('--title <title>', 'Playlist title')
    .option('--description <description>', 'Playlist description', '')
    .option('--privacy <privacy>', 'Privacy status (public|private|unlisted)', 'private')
    .action(async (options) => {
      requireAuth();

      if (!validatePrivacyStatus(options.privacy)) {
        console.error(chalk.red('✗ Invalid privacy status. Use: public, private, or unlisted'));
        process.exit(1);
      }

      const spinner = ora('Creating playlist...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const playlist = await youtubeAPI.createPlaylist({
          title: options.title,
          description: options.description,
          privacy: options.privacy
        });

        spinner.succeed('Playlist created successfully!');

        console.log(chalk.green.bold('\n✓ Playlist created!\n'));
        console.log(`  ID: ${playlist.id}`);
        console.log(`  Title: ${playlist.snippet.title}`);
        console.log(`  Status: ${playlist.status.privacyStatus}`);
        console.log(chalk.cyan(`\nAdd videos: youtube-cli playlist-add ${playlist.id} <videoId>\n`));
      } catch (error: any) {
        spinner.fail('Failed to create playlist');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerPlaylistAddCommand(program: Command): void {
  program
    .command('playlist-add <playlistId> <videoId>')
    .description('Add video to playlist')
    .action(async (playlistId, videoId) => {
      requireAuth();

      if (!validateVideoId(videoId)) {
        console.error(chalk.red('✗ Invalid video ID format'));
        process.exit(1);
      }

      const spinner = ora('Adding video to playlist...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.addToPlaylist(playlistId, videoId);
        spinner.succeed('Video added to playlist successfully!');

        console.log(chalk.cyan(`\nVideo: https://youtube.com/watch?v=${videoId}\n`));
      } catch (error: any) {
        spinner.fail('Failed to add video to playlist');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerPlaylistUpdateCommand(program: Command): void {
  program
    .command('playlist-update <playlistId>')
    .description('Update playlist metadata')
    .option('--title <title>', 'Playlist title')
    .option('--description <description>', 'Playlist description')
    .option('--privacy <privacy>', 'Privacy status (public|private|unlisted)')
    .action(async (playlistId, options) => {
      requireAuth();

      if (options.privacy && !validatePrivacyStatus(options.privacy)) {
        console.error(chalk.red('✗ Invalid privacy status. Use: public, private, or unlisted'));
        process.exit(1);
      }

      const spinner = ora('Updating playlist...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        const playlist = await youtubeAPI.updatePlaylist(playlistId, {
          title: options.title,
          description: options.description,
          privacy: options.privacy
        });

        spinner.succeed('Playlist updated successfully!');

        console.log(chalk.green.bold('\n✓ Playlist updated!\n'));
        console.log(`  ID: ${playlist.id}`);
        console.log(`  Title: ${playlist.snippet.title}`);
        console.log(`  Status: ${playlist.status.privacyStatus}`);
        console.log('');
      } catch (error: any) {
        spinner.fail('Failed to update playlist');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}

export function registerPlaylistDeleteCommand(program: Command): void {
  program
    .command('playlist-delete <playlistId>')
    .description('Delete a playlist')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (playlistId, options) => {
      requireAuth();

      if (!options.confirm) {
        const inquirer = (await import('inquirer')).default;
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete playlist ${playlistId}?`,
            default: false
          }
        ]);

        if (!confirm) {
          console.log('Cancelled.');
          return;
        }
      }

      const spinner = ora('Deleting playlist...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        await youtubeAPI.deletePlaylist(playlistId);
        spinner.succeed('Playlist deleted successfully!');
      } catch (error: any) {
        spinner.fail('Failed to delete playlist');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });
}
