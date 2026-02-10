import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { statSync } from 'fs';
import { youtubeAPI } from '../api/youtube.js';
import { requireAuth } from '../utils/firstRun.js';
import { validateVideoFile } from '../utils/validation.js';
import { config } from '../utils/config.js';

export function registerUploadCommand(program: Command): void {
  program
    .command('upload <file>')
    .description('Upload a video')
    .requiredOption('--title <title>', 'Video title')
    .option('--description <description>', 'Video description', '')
    .option('--privacy <privacy>', 'Privacy status (public|private|unlisted)')
    .option('--category <id>', 'Category ID')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--thumbnail <image>', 'Thumbnail image path')
    .action(async (file, options) => {
      requireAuth();

      // Validate video file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        console.error(chalk.red(`✗ ${validation.error}`));
        process.exit(1);
      }

      // Get defaults
      const defaults = config.get('defaults');
      const privacy = options.privacy || defaults?.privacy || 'private';
      const category = options.category || defaults?.category || '22';
      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

      const fileSize = statSync(file).size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      console.log(chalk.cyan(`\nUploading: ${file} (${fileSizeMB} MB)`));
      console.log(`Title: ${options.title}`);
      console.log(`Privacy: ${privacy}\n`);

      const spinner = ora('Initializing upload...').start();

      try {
        const initialized = await youtubeAPI.initialize();
        if (!initialized) {
          spinner.fail('Failed to initialize YouTube API');
          process.exit(1);
        }

        let lastProgress = 0;
        const video = await youtubeAPI.uploadVideo({
          filePath: file,
          title: options.title,
          description: options.description,
          privacy: privacy,
          category: category,
          tags: tags,
          onProgress: (progress) => {
            if (progress > lastProgress) {
              spinner.text = `Uploading... ${progress}%`;
              lastProgress = progress;
            }
          }
        });

        spinner.succeed('Video uploaded successfully!');

        console.log(chalk.green.bold('\n✓ Video uploaded successfully!\n'));
        console.log(`  ID: ${video.id}`);
        console.log(`  URL: ${chalk.cyan(`https://youtube.com/watch?v=${video.id}`)}`);
        console.log(`  Status: ${privacy}`);

        // Set thumbnail if provided
        if (options.thumbnail) {
          const thumbSpinner = ora('Setting thumbnail...').start();
          try {
            await youtubeAPI.setThumbnail(video.id, options.thumbnail);
            thumbSpinner.succeed('Thumbnail set successfully!');
          } catch (error: any) {
            thumbSpinner.fail('Failed to set thumbnail');
            console.error(chalk.yellow(`  ${error.message}`));
          }
        }

        console.log(chalk.cyan('\nNext steps:'));
        console.log(`  • Update: ${chalk.bold(`youtube-cli update ${video.id}`)}`);
        console.log(`  • Add thumbnail: ${chalk.bold(`youtube-cli thumbnail ${video.id} image.jpg`)}`);
        console.log(`  • View stats: ${chalk.bold(`youtube-cli stats ${video.id}`)}\n`);

      } catch (error: any) {
        spinner.fail('Upload failed');
        console.error(chalk.red(`\n${error.message}`));
        
        if (error.message.includes('quota')) {
          console.log(chalk.yellow('\n⚠  You may have exceeded your daily upload quota.'));
          console.log('Check your quota at: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas\n');
        }
        
        process.exit(1);
      }
    });
}
