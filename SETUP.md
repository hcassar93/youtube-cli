# YouTube CLI - Detailed Setup Guide

This guide walks you through setting up Google OAuth credentials and configuring the YouTube CLI tool.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Google Cloud Project](#creating-a-google-cloud-project)
3. [Enabling YouTube Data API v3](#enabling-youtube-data-api-v3)
4. [Creating OAuth 2.0 Credentials](#creating-oauth-20-credentials)
5. [Configuring the CLI](#configuring-the-cli)
6. [Authentication](#authentication)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- A Google account
- Node.js 18 or higher installed
- YouTube CLI installed (`npm install -g youtube-cli`)

## Creating a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a new project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "YouTube CLI Tool")
   - Click "Create"
   - Wait for the project to be created (may take a few seconds)

3. **Select your project**
   - Click the project dropdown again
   - Select your newly created project

## Enabling YouTube Data API v3

1. **Navigate to API Library**
   - Go to: https://console.cloud.google.com/apis/library
   - Or use the navigation menu: "APIs & Services" → "Library"

2. **Search for YouTube Data API v3**
   - In the search box, type: "YouTube Data API v3"
   - Click on "YouTube Data API v3" from the results

3. **Enable the API**
   - Click the "Enable" button
   - Wait for it to be enabled (usually instant)

## Creating OAuth 2.0 Credentials

### Step 1: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to: https://console.cloud.google.com/apis/credentials/consent
   - Or: "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select **"External"** (unless you have a Google Workspace account)
   - Click "Create"

3. **Fill in App Information**
   - **App name**: YouTube CLI (or any name you prefer)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Leave other fields as default
   - Click "Save and Continue"

4. **Scopes** (Step 2)
   - Click "Add or Remove Scopes"
   - Search for "YouTube Data API v3"
   - Select these scopes:
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/youtube.upload`
   - Click "Update"
   - Click "Save and Continue"

5. **Test Users** (Step 3)
   - Click "Add Users"
   - Add your Google email address
   - Click "Add"
   - Click "Save and Continue"

6. **Summary** (Step 4)
   - Review your settings
   - Click "Back to Dashboard"

### Step 2: Create OAuth 2.0 Client ID

1. **Go to Credentials**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Or: "APIs & Services" → "Credentials"

2. **Create Credentials**
   - Click "Create Credentials" at the top
   - Select "OAuth 2.0 Client ID"

3. **Choose Application Type**
   - Application type: **"Desktop app"**
   - Name: "YouTube CLI Client" (or any name)
   - Click "Create"

4. **Important: Configure Redirect URI**
   - After creation, click on your newly created OAuth client
   - Under "Authorized redirect URIs", click "Add URI"
   - Add: `http://localhost:3000/oauth2callback`
   - Click "Save"

5. **Download or Copy Credentials**
   - You'll see your Client ID and Client Secret
   - **Copy both values** - you'll need them for the CLI setup

   Your Client ID looks like:
   ```
   123456789-abc123def456.apps.googleusercontent.com
   ```

   Your Client Secret looks like:
   ```
   GOCSPX-abc123def456ghi789
   ```

## Configuring the CLI

### Method 1: Interactive Setup (Recommended)

1. **Run the setup command**
   ```bash
   youtube-cli setup
   ```

2. **Follow the prompts**
   - Confirm you have credentials ready
   - Paste your Client ID
   - Paste your Client Secret
   - Choose default privacy setting (recommend: private)
   - Set OAuth port (default: 3000)
   - Choose output format (recommend: table)

3. **Authenticate immediately**
   - When prompted, choose "Yes" to authenticate now
   - A browser window will open
   - Sign in with your Google account
   - Click "Allow" to grant permissions
   - Return to the terminal

### Method 2: Non-Interactive Setup

```bash
youtube-cli setup \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET" \
  --default-privacy private \
  --port 3000 \
  --non-interactive
```

Then authenticate:
```bash
youtube-cli auth
```

## Authentication

### First-Time Authentication

1. **Run the auth command**
   ```bash
   youtube-cli auth
   ```

2. **Browser opens automatically**
   - If it doesn't, copy the URL displayed and open it manually
   - Sign in with your Google account
   - Review the permissions requested
   - Click "Allow"

3. **Success!**
   - The terminal will show: "✓ Authentication successful!"
   - Your tokens are now stored securely

### Token Refresh

- Access tokens expire after ~1 hour
- The CLI **automatically refreshes** them using your refresh token
- No action needed from you

### Re-authentication

If token refresh fails:
```bash
youtube-cli logout
youtube-cli auth
```

## Troubleshooting

### "Redirect URI mismatch" error

**Problem:** The redirect URI in your Google Cloud Console doesn't match the one the CLI uses.

**Solution:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure you have: `http://localhost:3000/oauth2callback`
4. If using a different port, update the URI: `http://localhost:XXXX/oauth2callback`
5. Click "Save"
6. Try `youtube-cli auth` again

### "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not configured properly.

**Solution:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Ensure your app is configured
3. Add yourself as a test user
4. Make sure the required scopes are added

### "Port already in use"

**Problem:** Port 3000 is being used by another application.

**Solution:**
```bash
# Use a different port temporarily
youtube-cli auth --port 3001

# Or change the default port
youtube-cli config set oauth.port 3001
```

### "Invalid client credentials"

**Problem:** Client ID or Client Secret is incorrect.

**Solution:**
1. Verify your credentials in: https://console.cloud.google.com/apis/credentials
2. Run setup again:
   ```bash
   youtube-cli setup
   ```
3. Paste the correct values

### "Access Not Configured" error

**Problem:** YouTube Data API v3 is not enabled for your project.

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Select your project
3. Click "Enable"
4. Wait a minute, then try again

### "The user did not consent" error

**Problem:** You clicked "Cancel" or "Deny" during authentication.

**Solution:**
```bash
youtube-cli auth
```
This time, click "Allow" to grant permissions.

### Can't open browser automatically

**Problem:** The CLI can't open your browser automatically.

**Solution:**
```bash
youtube-cli auth --no-browser
```
Then manually copy and paste the URL shown.

## Multiple Accounts

To use different Google accounts:

1. **Logout from current account**
   ```bash
   youtube-cli logout
   ```

2. **Authenticate with new account**
   ```bash
   youtube-cli auth
   ```
   
3. **Sign in with different Google account** in the browser

## Using Different Projects

To use credentials from different Google Cloud Projects:

1. **Run setup again**
   ```bash
   youtube-cli setup
   ```

2. **Enter new credentials** from the different project

3. **Authenticate**
   ```bash
   youtube-cli auth
   ```

## Security Best Practices

1. **Never share your credentials**
   - Don't commit `~/.youtube-cli/config.json` to git
   - Don't share your Client Secret publicly
   - Don't include credentials in screenshots

2. **Use "Desktop app" type**
   - More secure than "Web application" for CLI tools
   - Doesn't require a public redirect URI

3. **Limit scope in production**
   - Only enable the scopes you need
   - Review permissions regularly

4. **Keep credentials local**
   - The config file is stored locally at `~/.youtube-cli/config.json`
   - Has restricted permissions (0600)

5. **Rotate credentials if compromised**
   - Delete the OAuth client in Google Cloud Console
   - Create a new one
   - Run `youtube-cli setup` again

## Testing Your Setup

After setup and authentication:

```bash
# List your channels
youtube-cli channels

# List your videos
youtube-cli videos --limit 5

# Check config
youtube-cli config show
```

If these commands work, you're all set! 🎉

## Getting Help

- Check the main [README.md](./README.md) for command usage
- Visit: https://github.com/yourusername/youtube-cli/issues
- Read YouTube API docs: https://developers.google.com/youtube/v3

---

**Questions?** Open an issue on GitHub: https://github.com/yourusername/youtube-cli/issues
