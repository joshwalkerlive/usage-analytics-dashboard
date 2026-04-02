# Claude Usage Analytics Dashboard — Pilot Guide

## Quick Start (2 minutes)

### Step 1: Install the Skill

Run this one-liner in your terminal:

```bash
mkdir -p ~/.claude/skills/my-analytics && curl -sL https://raw.githubusercontent.com/joshwalkerlive/usage-analytics-dashboard/main/skill/my-analytics.md -o ~/.claude/skills/my-analytics/SKILL.md
```

Or manually: copy `skill/my-analytics.md` from this repo to `~/.claude/skills/my-analytics/SKILL.md`.

**Verify it worked:** In Claude Code, start a new session and say "analyze my Claude usage".
Claude should recognize the `my-analytics` skill and begin scanning your sessions.

### Step 2: Generate Your Analytics

In any Claude Code session, say:

> "Generate my Claude usage analytics"

or

> "Run my analytics dashboard"

This takes about 1-3 minutes depending on your session count. It will:
- Scan your last 30 days of Claude sessions
- Compute usage metrics
- Generate AI-powered insights about your patterns
- Save a payload file to `~/.claude/analytics/analytics-payload.json`
- Open the dashboard in your browser

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
- Try regenerating by saying "Generate my Claude usage analytics"

**Skill not found**
- Verify the skill is installed: check `~/.claude/skills/my-analytics/SKILL.md` exists
- Restart Claude Code and try again

**Skill doesn't trigger**
- Skills are triggered via natural language, not slash commands. Say something like "analyze my Claude usage" or "run my analytics dashboard".
- Make sure `~/.claude/skills/my-analytics/SKILL.md` exists and is not empty.
- Start a fresh Claude Code session after installing the skill.
