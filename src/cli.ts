import { Command } from 'commander';
import chalk from 'chalk';
import { registerSetupCommand } from './commands/setup.js';
import { registerConfigCommand, registerResetCommand } from './commands/config.js';
import { registerAuthCommand, registerLogoutCommand } from './commands/auth.js';
import { registerChannelsCommand } from './commands/channels.js';
import { registerVideosCommand, registerUpdateCommand, registerDeleteCommand, registerStatsCommand } from './commands/videos.js';
import { registerUploadCommand } from './commands/upload.js';
import { registerThumbnailCommand } from './commands/thumbnail.js';
import { registerPlaylistsCommand, registerPlaylistCreateCommand, registerPlaylistAddCommand } from './commands/playlists.js';
import { registerCommentsCommand, registerCommentCommand } from './commands/comments.js';

const program = new Command();

program
  .name('youtube-creator-cli')
  .description('Command-line interface for YouTube Data API v3')
  .version('1.0.0');

// Setup & Configuration
registerSetupCommand(program);
registerConfigCommand(program);
registerResetCommand(program);

// Authentication
registerAuthCommand(program);
registerLogoutCommand(program);

// Channels
registerChannelsCommand(program);

// Videos
registerVideosCommand(program);
registerUploadCommand(program);
registerUpdateCommand(program);
registerDeleteCommand(program);
registerStatsCommand(program);

// Thumbnails
registerThumbnailCommand(program);

// Playlists
registerPlaylistsCommand(program);
registerPlaylistCreateCommand(program);
registerPlaylistAddCommand(program);

// Comments
registerCommentsCommand(program);
registerCommentCommand(program);

// Error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  if (err.code === 'commander.version') {
    process.exit(0);
  }
  process.exit(err.exitCode);
});

export async function run(): Promise<void> {
  try {
    await program.parseAsync(process.argv);

    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
