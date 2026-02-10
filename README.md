# YouTube CLI Tool

A command-line interface for managing YouTube channels, videos, and content. Enables AI agents and developers to upload videos, manage metadata, set thumbnails, and interact with YouTube Data API v3.

## 🚨 Important: User-Provided Credentials

This is an **open-source tool** that requires you to provide your own Google OAuth credentials. No credentials are included in this repository.

## Quick Start

```bash
# Install
npm install -g youtube-cli

# Setup (first time)
youtube-cli setup

# Authenticate
youtube-cli auth

# Upload a video
youtube-cli upload video.mp4 --title "My Video"
```

## Prerequisites

- Node.js 18 or higher
- A Google Cloud Project with YouTube Data API v3 enabled
- OAuth 2.0 Client credentials

## Installation

### From npm

```bash
npm install -g youtube-cli
```

### From source

```bash
git clone https://github.com/yourusername/youtube-cli.git
cd youtube-cli
npm install
npm run build
npm link
```

## Getting OAuth Credentials

You need to create your own Google OAuth credentials to use this tool:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select an existing one)
3. **Enable YouTube Data API v3**:
   - Navigate to: https://console.cloud.google.com/apis/library/youtube.googleapis.com
   - Click "Enable"
4. **Create OAuth 2.0 Client ID**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application Type: "Desktop app" or "Web application"
   - Add authorized redirect URI: `http://localhost:3000/oauth2callback`
   - Download the JSON or copy the Client ID and Client Secret

For detailed instructions with screenshots, see [SETUP.md](./SETUP.md).

## First-Time Setup

Run the interactive setup wizard:

```bash
youtube-cli setup
```

The wizard will guide you through:
1. Entering your OAuth Client ID
2. Entering your OAuth Client Secret
3. Setting default preferences (privacy, output format, etc.)
4. Optional: Immediate authentication

### Non-Interactive Setup

```bash
youtube-cli setup \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET" \
  --default-privacy private \
  --port 3000 \
  --non-interactive
```

## Commands

### Setup & Configuration

#### `youtube-cli setup`
Interactive setup wizard for first-time configuration.

```bash
youtube-cli setup
```

#### `youtube-cli config show`
Display current configuration (secrets are masked by default).

```bash
youtube-cli config show
youtube-cli config show --reveal-secrets  # Show full values
```

#### `youtube-cli config set <key> <value>`
Set a configuration value.

```bash
youtube-cli config set defaults.privacy public
youtube-cli config set oauth.port 8080
```

#### `youtube-cli reset`
Remove all configuration and tokens.

```bash
youtube-cli reset
youtube-cli reset --confirm  # Skip confirmation
```

### Authentication

#### `youtube-cli auth`
Authenticate with YouTube using configured credentials.

```bash
youtube-cli auth
youtube-cli auth --port 3001           # Use different port
youtube-cli auth --no-browser          # Don't auto-open browser
```

#### `youtube-cli logout`
Remove stored tokens (keeps configuration).

```bash
youtube-cli logout
```

### Channels

#### `youtube-cli channels`
List your YouTube channels.

```bash
youtube-cli channels
youtube-cli channels --format json
```

### Videos

#### `youtube-cli videos`
List your videos.

```bash
youtube-cli videos
youtube-cli videos --limit 20
youtube-cli videos --status private
youtube-cli videos --format json
```

#### `youtube-cli upload <file>`
Upload a video.

```bash
youtube-cli upload video.mp4 \
  --title "My Amazing Video" \
  --description "Video description here" \
  --privacy private \
  --tags "tag1,tag2,tag3" \
  --thumbnail thumbnail.jpg

# With category
youtube-cli upload video.mp4 \
  --title "Tutorial" \
  --category 27  # Education
  --privacy public
```

**Common Category IDs:**
- `1` - Film & Animation
- `10` - Music
- `15` - Pets & Animals
- `17` - Sports
- `20` - Gaming
- `22` - People & Blogs
- `24` - Entertainment
- `27` - Education
- `28` - Science & Technology

#### `youtube-cli update <videoId>`
Update video metadata.

```bash
youtube-cli update dQw4w9WgXcQ \
  --title "New Title" \
  --description "Updated description" \
  --privacy public \
  --tags "new,tags"
```

#### `youtube-cli delete <videoId>`
Delete a video.

```bash
youtube-cli delete dQw4w9WgXcQ
youtube-cli delete dQw4w9WgXcQ --confirm  # Skip confirmation
```

#### `youtube-cli stats <videoId>`
Get video statistics.

```bash
youtube-cli stats dQw4w9WgXcQ
youtube-cli stats dQw4w9WgXcQ --format json
```

### Thumbnails

#### `youtube-cli thumbnail <videoId> <imagePath>`
Set or update video thumbnail.

```bash
youtube-cli thumbnail dQw4w9WgXcQ thumbnail.jpg
```

**Requirements:**
- Format: JPG, PNG, or GIF
- Max size: 2MB
- Recommended: 1280x720 pixels

### Playlists

#### `youtube-cli playlists`
List your playlists.

```bash
youtube-cli playlists
youtube-cli playlists --limit 50
youtube-cli playlists --format json
```

#### `youtube-cli playlist-create`
Create a new playlist.

```bash
youtube-cli playlist-create \
  --title "My Playlist" \
  --description "Playlist description" \
  --privacy private
```

#### `youtube-cli playlist-add <playlistId> <videoId>`
Add video to playlist.

```bash
youtube-cli playlist-add PLxxxxxx dQw4w9WgXcQ
```

### Comments

#### `youtube-cli comments <videoId>`
List video comments.

```bash
youtube-cli comments dQw4w9WgXcQ
youtube-cli comments dQw4w9WgXcQ --limit 50
youtube-cli comments dQw4w9WgXcQ --format json
```

#### `youtube-cli comment <videoId> <text>`
Post a comment on a video.

```bash
youtube-cli comment dQw4w9WgXcQ "Great video!"
```

## Configuration File

Configuration is stored at: `~/.youtube-cli/config.json`

```json
{
  "oauth": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "refresh_token": "obtained-after-auth",
    "access_token": "obtained-after-auth",
    "expires_at": 1234567890,
    "redirect_uri": "http://localhost:3000/oauth2callback",
    "port": 3000
  },
  "defaults": {
    "privacy": "private",
    "category": "22",
    "outputFormat": "table"
  },
  "version": "1.0.0"
}
```

**Security:** The config file is automatically created with `0600` permissions (owner read/write only).

## Troubleshooting

### "Configuration not found"
Run `youtube-cli setup` to create your configuration.

### "Authentication failed: Invalid client credentials"
Your OAuth credentials may be incorrect. Run `youtube-cli setup` again or check your Google Cloud Console.

### Port already in use
Use a different port:
```bash
youtube-cli auth --port 3001
```

Or update your configuration:
```bash
youtube-cli config set oauth.port 3001
```

### Token expired
The CLI automatically refreshes access tokens. If that fails:
```bash
youtube-cli logout
youtube-cli auth
```

### Upload quota exceeded
YouTube has daily upload quotas. Check your quota at:
https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

### Comments disabled
Some videos have comments disabled. You'll receive an error if you try to read or post comments.

## Security & Privacy

- **Your credentials are stored locally only** at `~/.youtube-cli/config.json`
- Config file has restricted permissions (0600)
- **Never commit your config file to version control**
- Credentials are never logged to console
- This tool makes direct API calls to YouTube - no intermediary servers

## Examples

### Upload a video with all metadata
```bash
youtube-cli upload my-video.mp4 \
  --title "My Tutorial Video" \
  --description "Learn how to use this amazing tool" \
  --privacy public \
  --tags "tutorial,howto,education" \
  --category 27 \
  --thumbnail thumb.jpg
```

### Batch check video stats
```bash
for id in dQw4w9WgXcQ abc123def456; do
  youtube-cli stats $id
done
```

### Export videos list to JSON
```bash
youtube-cli videos --format json > my-videos.json
```

## Development

### Run from source
```bash
npm install
npm run dev -- setup
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- GitHub Repository: https://github.com/yourusername/youtube-cli
- YouTube Data API v3: https://developers.google.com/youtube/v3
- Google Cloud Console: https://console.cloud.google.com/

## Support

- Issues: https://github.com/yourusername/youtube-cli/issues
- Discussions: https://github.com/yourusername/youtube-cli/discussions

---

**Note:** This tool is not affiliated with or endorsed by Google or YouTube. It uses the official YouTube Data API v3.
