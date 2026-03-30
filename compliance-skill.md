---
name: youtube-creator-cli-compliance-skill
description: Compliance and safety controls for agents operating YouTube Creator CLI.
version: 1.0.0
tools:
  - youtube-creator-cli
---

# Compliance Skill: YouTube Creator CLI

This compliance skill defines how an agent must use `youtube-creator-cli` in a safe, policy-aligned way.

## Scope

Applies to all actions executed via:

- `youtube-creator-cli`
- `npm run dev -- <youtube command>`

## 1) Data classification

Treat as sensitive:

- OAuth client secret
- Access/refresh tokens
- Local config file contents
- Any user-provided private metadata or unpublished video details

Never echo secrets to logs, summaries, or tickets.

## 2) Allowed vs restricted actions

Allowed with normal validation:

- `channels`, `videos`, `stats`, `playlists`, `comments`
- `upload`, `update`, `thumbnail`, `playlist-add`, `comment`

High-risk actions (require explicit user intent confirmation in task context):

- `delete <videoId>`
- `playlist-delete <playlistId>`
- `reset` (destructive local credential/config wipe)

If confirmation is absent, stop and request confirmation in the orchestrator flow.

## 3) Authentication compliance

Required posture:

1. Use legitimate user-owned OAuth credentials only.
2. Keep callback on loopback (`localhost`) only.
3. Never persist tokens outside official CLI config path unless explicitly approved.
4. Re-authenticate on token/auth errors; do not attempt insecure workarounds.

## 4) Secret handling requirements

- Redact secrets in all agent-visible outputs.
- If config display supports masked mode, prefer masked mode.
- Do not copy config files into repo, artifacts, or chat logs.
- Do not commit credential-bearing files under any circumstance.

## 5) Pre-execution validation checklist

Before mutating state:

1. Confirm target channel/profile context.
2. Validate file existence and type (`upload`, `thumbnail`).
3. Validate IDs are explicitly supplied and match requested target.
4. Run a read-only command first when practical.

## 6) Destructive action protocol

For `delete` or `reset`:

1. Display target identifier(s) clearly.
2. Require explicit, contextual confirmation from caller workflow.
3. Execute action.
4. Run post-action verification command where available.

No silent destructive operations.

## 7) Logging and auditability

Agent should log:

- Command executed (without secrets)
- Start/end timestamps
- Outcome (success/failure)
- Key resource IDs (video/playlist) when relevant

Agent should not log:

- Raw tokens
- Client secrets
- Full private metadata unless needed by task

## 8) Error and exception compliance

- Surface API errors verbatim when safe.
- Do not fabricate successful outcomes.
- On auth/quota/policy errors, stop and report actionable remediation.
- Do not retry destructive actions blindly.

## 9) Rate limit and quota conduct

- Respect YouTube API quota constraints.
- Avoid unnecessary polling or repeated upload attempts.
- If quota exceeded, halt and escalate with quota guidance.

## 10) Multi-profile separation

- Keep operations bound to intended auth profile.
- Do not mix IDs/content across profiles in same workflow unless explicitly requested.
- When switching profiles, verify with a read-only command (`channels`).

## 11) Compliance-safe execution examples

Read-only:

```bash
youtube-creator-cli channels
youtube-creator-cli videos --limit 20
youtube-creator-cli stats <VIDEO_ID>
```

Mutating (non-destructive):

```bash
youtube-creator-cli upload ./video.mp4 --title "Title" --privacy private
youtube-creator-cli update <VIDEO_ID> --title "New Title"
youtube-creator-cli thumbnail <VIDEO_ID> ./thumb.jpg
```

Destructive (confirmation required):

```bash
youtube-creator-cli delete <VIDEO_ID>
youtube-creator-cli reset --confirm
```

## 12) Non-compliance examples (forbidden)

- Printing token values to terminal logs
- Committing `~/.youtube-creator-cli/config.json`
- Deleting a video without explicit confirmation context
- Using unknown/untrusted OAuth credentials
- Claiming success when command failed
