# Claude Usage Analytics Dashboard — Pilot Guide

## Quick Start (2 minutes)

### Step 1: Install the Skill

In your Claude Code terminal, run:

```bash
claude skill install josh/claude-analytics
```

Or manually: copy the `skill/my-analytics.md` file to `~/.claude/skills/my-analytics.md`.

### Step 2: Generate Your Analytics

In any Claude Code session, run:

```
/my-analytics
```

This takes about 30-90 seconds. It will:
- Scan your last 30 days of Claude sessions
- Compute usage metrics
- Generate AI-powered insights about your patterns
- Save a payload file and open the dashboard

### Step 3: View Your Dashboard

The dashboard will open in your browser. Drag and drop the `analytics-payload.json` file from `~/.claude/analytics/` onto the upload zone.

## What You'll See

- **At a Glance:** What's working well and what's holding you back
- **Activity Dashboard:** Usage patterns over time, by time of day
- **Tool Usage:** Which Claude tools you use most and their error rates
- **Session Analysis:** Goal distribution, session types, outcomes
- **Big Wins:** Your most productive sessions highlighted
- **Friction Deep-Dive:** Recurring pain points and how to fix them
- **Recommendations:** Specific CLAUDE.md suggestions and workflow tips

## Feedback

After using the dashboard, please share:
1. Which sections were most useful?
2. Did anything look wrong or unexpected?
3. What insights were you hoping to see that weren't there?
4. Any errors or issues during generation?

## Privacy

Your session data is processed entirely on your machine by your Claude instance. The dashboard is a static website — your analytics payload is loaded in the browser and never sent to any server. You can inspect the `analytics-payload.json` file before uploading to verify no sensitive data is included.

## Troubleshooting

**"No Claude sessions found"**
- Make sure you have Claude Code session history at `~/.claude/projects/`
- The skill only looks at the last 30 days

**Dashboard shows errors after upload**
- Check that you're uploading `analytics-payload.json`, not a raw JSONL file
- Try regenerating with `/my-analytics`

**Skill not found**
- Verify the skill is installed: check `~/.claude/skills/my-analytics.md` exists
- Restart Claude Code and try again
