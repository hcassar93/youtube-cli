# YouTube Creator CLI

A command-line tool for managing YouTube channels, videos, and content. Upload videos, manage metadata, set thumbnails, and interact with the YouTube Data API v3.

## 🚨 Important: User-Provided Credentials

This is an **open-source tool** that requires you to provide your own Google OAuth credentials. No credentials are included in this repository.

## Prerequisites

- Node.js 18 or higher
- A Google account
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/youtube-creator-cli.git
cd youtube-creator-cli

# Install dependencies
npm install

# Build
npm run build
```

### Option 1: Run with npm (Recommended for Quick Start)

```bash
npm run dev -- setup
npm run dev -- auth
npm run dev -- upload video.mp4 --title "My Video"
```

### Option 2: Link Globally (Recommended for Regular Use)

Make the command available globally so you can use `youtube-creator-cli` directly:

```bash
# After building, link it globally
npm link

# Now you can use it anywhere without npm run dev
youtube-creator-cli setup
youtube-creator-cli auth
youtube-creator-cli upload video.mp4 --title "My Video"

# To unlink later (if needed)
npm unlink -g youtube-creator-cli
```

> **Note:** This tool is not published to npm because Copilot can't be bothered with all that. Clone and link instead! 🤷

## Getting Started

### Step 1: Get OAuth Credentials from Google

1. **Create a Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable YouTube Data API v3**
   - Navigate to: https://console.cloud.google.com/apis/library/youtube.googleapis.com
   - Click "Enable"

3. **Configure OAuth Consent Screen** ⚠️ **IMPORTANT**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Choose "External" user type
   - Fill in app name and your email
   - Add these scopes:
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/youtube.upload`
   - **CRITICAL:** Add your Google email as a test user (without this, auth will fail with "Access blocked")

4. **Create OAuth 2.0 Client ID**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **"Desktop app"**
   - Add authorized redirect URI: `http://localhost:3000/oauth2callback`
   - Copy the Client ID and Client Secret

### Step 2: Configure the CLI

Run the interactive setup:

```bash
npm run dev -- setup
```

Or non-interactive:

```bash
npm run dev -- setup \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET" \
  --default-privacy private \
  --port 3000 \
  --non-interactive
```

### Step 3: Authenticate

```bash
npm run dev -- auth
```

A browser window will open. Sign in with your Google account and grant permissions.

## Usage

### Upload a Video

```bash
npm run dev -- upload video.mp4 \
  --title "My Amazing Video" \
  --description "Video description here" \
  --privacy private \
  --tags "tag1,tag2,tag3"
```

### List Your Videos

```bash
npm run dev -- videos --limit 20
npm run dev -- videos --status private
npm run dev -- videos --format json
```

### Update Video Metadata

```bash
npm run dev -- update VIDEO_ID \
  --title "New Title" \
  --description "Updated description" \
  --privacy public
```

### Set Thumbnail

```bash
npm run dev -- thumbnail VIDEO_ID thumbnail.jpg
```

### List Channels

```bash
npm run dev -- channels
```

### Get Video Stats

```bash
npm run dev -- stats VIDEO_ID
```

### Manage Playlists

```bash
# List playlists
npm run dev -- playlists

# Create playlist
npm run dev -- playlist-create \
  --title "My Playlist" \
  --privacy private

# Add video to playlist
npm run dev -- playlist-add PLAYLIST_ID VIDEO_ID
```

### Comments

```bash
# List comments
npm run dev -- comments VIDEO_ID --limit 50

# Post comment
npm run dev -- comment VIDEO_ID "Great video!"
```

## All Commands

If using `npm link` (global), replace `npm run dev --` with `youtube-creator-cli`:

```bash
# Without npm link
npm run dev -- setup              # Interactive setup wizard
npm run dev -- config show        # View configuration
npm run dev -- config set KEY VAL # Set config value
npm run dev -- reset              # Remove all config
npm run dev -- auth               # Authenticate
npm run dev -- logout             # Remove tokens
npm run dev -- channels           # List channels
npm run dev -- videos             # List videos
npm run dev -- upload FILE        # Upload video
npm run dev -- update VIDEO_ID    # Update video
npm run dev -- delete VIDEO_ID    # Delete video
npm run dev -- stats VIDEO_ID     # Get video stats
npm run dev -- thumbnail VIDEO IMAGE # Set thumbnail
npm run dev -- playlists          # List playlists
npm run dev -- playlist-create    # Create playlist
npm run dev -- playlist-add       # Add video to playlist
npm run dev -- comments VIDEO_ID  # List comments
npm run dev -- comment VIDEO TEXT # Post comment

# With npm link (after running 'npm link')
youtube-creator-cli setup
youtube-creator-cli config show
youtube-creator-cli auth
# ... etc
```

Add `--help` to any command for more options.

## Common Options

- `--privacy <privacy>` - `private`, `unlisted`, or `public`
- `--format <format>` - Output format: `table` (default) or `json`
- `--limit <number>` - Limit results
- `--tags <tags>` - Comma-separated tags
- `--category <id>` - YouTube category ID
- `--port <port>` - OAuth callback port (default: 3000)

## YouTube Category IDs

- `1` - Film & Animation
- `10` - Music
- `15` - Pets & Animals
- `17` - Sports
- `20` - Gaming
- `22` - People & Blogs (default)
- `24` - Entertainment
- `27` - Education
- `28` - Science & Technology

## Configuration

Configuration is stored at: `~/.youtube-creator-cli/config.json`

The file has restricted permissions (0600) and includes:
- OAuth credentials (client ID, client secret)
- Access and refresh tokens
- Default settings (privacy, category, output format)

**Never commit this file to version control.**

## Troubleshooting

### "Access blocked: This app's request is invalid"

**Problem:** You weren't added as a test user in the OAuth consent screen.

**Solution:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "Test Users"
3. Add your Google email address
4. Try `npm run dev -- auth` again

### "Configuration not found"

Run: `npm run dev -- setup`

### "Invalid client credentials"

Your OAuth credentials may be incorrect. Run setup again and double-check your Client ID and Secret.

### "Port already in use"

```bash
npm run dev -- auth --port 3001
```

Or update config: `npm run dev -- config set oauth.port 3001`

### "Token expired"

The CLI auto-refreshes tokens, but if that fails:

```bash
npm run dev -- logout
npm run dev -- auth
```

### "Upload quota exceeded"

YouTube has daily upload quotas. Check at:
https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

## Development

```bash
# Run in dev mode (no build needed, changes reflected immediately)
npm run dev -- COMMAND

# Build TypeScript
npm run build

# Link globally for testing (after building)
npm link

# Now test as if it's installed
youtube-creator-cli --help

# Make changes, rebuild, and test again
npm run build
youtube-creator-cli COMMAND

# Unlink when done
npm unlink -g youtube-creator-cli
```

## Security

- Credentials are stored locally only
- Config file has restricted permissions (owner read/write only)
- Never commit config files to git
- No intermediary servers - direct API calls to YouTube
- OAuth tokens automatically refresh

## API Limits

YouTube Data API v3 has quota limits:
- Default: 10,000 units per day
- Upload: ~1600 units per video
- Check usage: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- YouTube Data API v3: https://developers.google.com/youtube/v3
- Google Cloud Console: https://console.cloud.google.com/

---

**Note:** This tool is not affiliated with or endorsed by Google or YouTube.
