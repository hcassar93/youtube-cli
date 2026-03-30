# YouTube Creator CLI Skill (`youtube-creator-cli`)

This skill teaches an agent to use the YouTube Creator CLI safely, deterministically, and non-interactively where possible.

## 1) Tool identity and binary

- Package: `youtube-creator-cli`
- Primary binary: `youtube-creator-cli`
- Source dev entry: `npm run dev -- <command>`

If the binary is not globally installed, use local execution from repo root:

```bash
npm run dev -- --help
```

## 2) What this CLI is for

Use this CLI to:

- Configure OAuth credentials and defaults
- Authenticate against YouTube Data API v3
- Upload videos
- Read/update/delete videos
- Manage thumbnails
- Manage playlists
- Read/post comments
- Read channel/video stats

## 3) Prerequisites the agent must verify

Before running business commands, verify:

1. Node >= 18
2. A valid setup exists (`setup` already run)
3. Auth is valid (`auth` completed; token refresh works)
4. Local file paths exist for upload/thumbnail operations
5. Intended account/channel is correct (especially before destructive actions)

Validation commands:

```bash
youtube-creator-cli --version
youtube-creator-cli --help
youtube-creator-cli config show
```

## 4) First-run bootstrap workflow

### 4.1 Setup

Interactive:

```bash
youtube-creator-cli setup
```

Non-interactive:

```bash
youtube-creator-cli setup \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET" \
  --default-privacy private \
  --port 3000 \
  --non-interactive
```

### 4.2 Authenticate

```bash
youtube-creator-cli auth
```

Useful auth options:

- `--port <number>`: callback port override
- `--no-browser`: print URL instead of auto-open
- `--profile <name>`: store token under specific auth profile

### 4.3 Confirm readiness

```bash
youtube-creator-cli config show
youtube-creator-cli channels
```

## 5) Command map for agents

Core setup/auth:

- `setup`
- `auth`
- `logout`
- `reset`
- `config show`
- `config set <key> <value>`
- `config use-profile <name>`

Content operations:

- `channels`
- `videos`
- `upload <file>`
- `update <videoId>`
- `delete <videoId>`
- `stats <videoId>`
- `thumbnail <videoId> <imagePath>`

Playlists:

- `playlists`
- `playlist-create`
- `playlist-add <playlistId> <videoId>`
- `playlist-update <playlistId>`
- `playlist-delete <playlistId>`

Comments:

- `comments <videoId>`
- `comment <videoId> <text>`

For exact flags per command:

```bash
youtube-creator-cli <command> --help
```

## 6) High-confidence automation patterns

### 6.1 Upload workflow

```bash
youtube-creator-cli upload ./video.mp4 \
  --title "Launch Demo" \
  --description "Automated upload via agent" \
  --privacy private \
  --tags "demo,launch"
```

Optional thumbnail step:

```bash
youtube-creator-cli thumbnail <VIDEO_ID> ./thumb.jpg
```

### 6.2 Metadata update workflow

```bash
youtube-creator-cli update <VIDEO_ID> \
  --title "Updated Title" \
  --description "Updated description" \
  --privacy unlisted
```

### 6.3 Review + safe delete workflow

```bash
youtube-creator-cli stats <VIDEO_ID>
youtube-creator-cli delete <VIDEO_ID>
```

Agent rule: never delete without explicit confirmation from caller context.

## 7) Agent operating rules (important)

1. Prefer deterministic, explicit flags over defaults for automation.
2. Always run read-only command first before mutating:
   - before `update`: run `videos` or `stats`
   - before `delete`: run `stats` and confirm target ID
3. Use profile-aware auth (`auth --profile`) for multi-tenant work.
4. Never expose secrets in logs or summaries.
5. Treat all OAuth/token/config files as sensitive.
6. Capture command stdout/stderr and return concise structured outcomes.

## 8) Output strategy for agentic environments

- Use command output directly for human-readable operation logs.
- Where available, use JSON-friendly command modes (e.g. `videos --format json`) for downstream parsing.
- For commands lacking JSON mode, parse stable fields (IDs, URLs, statuses) from lines with anchored patterns.
- Store important IDs (`videoId`, `playlistId`) as explicit state for next steps.

## 9) Common failure handling

### Not configured

Symptoms:
- "Configuration not found"

Action:

```bash
youtube-creator-cli setup
```

### Not authenticated / expired token

Action:

```bash
youtube-creator-cli logout
youtube-creator-cli auth
```

### OAuth access blocked

Likely missing test user/scopes in Google OAuth consent screen.

### Port conflict

Action:

```bash
youtube-creator-cli auth --port 3001
```

or persist:

```bash
youtube-creator-cli config set oauth.port 3001
```

### Quota issues

Uploads are expensive quota operations; if upload fails with quota messages, pause and report quota guidance.

## 10) Minimal runbooks

### Runbook A: fresh machine

1. `npm install -g youtube-creator-cli`
2. `youtube-creator-cli setup ...`
3. `youtube-creator-cli auth`
4. `youtube-creator-cli channels`

### Runbook B: weekly publishing

1. `youtube-creator-cli videos --limit 20`
2. `youtube-creator-cli upload ...`
3. `youtube-creator-cli thumbnail ...`
4. `youtube-creator-cli stats ...`

### Runbook C: profile switching

1. `youtube-creator-cli config show`
2. `youtube-creator-cli config use-profile <name>`
3. `youtube-creator-cli auth --profile <name>`
4. `youtube-creator-cli channels`

## 11) Security reminders for agents

- Never commit `~/.youtube-creator-cli/config.json`.
- Never print full client secret/token values.
- Prefer local callback loopback only (`localhost`).
- Use least privilege and only requested operations.

## 12) Quick command cheatsheet

```bash
youtube-creator-cli setup
youtube-creator-cli auth
youtube-creator-cli channels
youtube-creator-cli videos --help
youtube-creator-cli upload ./video.mp4 --title "Title" --privacy private
youtube-creator-cli update <VIDEO_ID> --title "New title"
youtube-creator-cli thumbnail <VIDEO_ID> ./thumb.jpg
youtube-creator-cli playlists
youtube-creator-cli comments <VIDEO_ID>
youtube-creator-cli comment <VIDEO_ID> "Great video!"
youtube-creator-cli logout
```

