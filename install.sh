#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$HOME/.claude/skills/my-analytics"
SKILL_URL="https://raw.githubusercontent.com/joshwalkerlive/usage-analytics-dashboard/main/skill/my-analytics.md"
REF_DIR="$SKILL_DIR/references"
REF_URL="https://raw.githubusercontent.com/joshwalkerlive/usage-analytics-dashboard/main/skill/references/payload-v2-schema.ts"

echo "Installing Claude Usage Analytics skill..."

mkdir -p "$SKILL_DIR"
mkdir -p "$REF_DIR"

curl -sL "$SKILL_URL" -o "$SKILL_DIR/SKILL.md"
curl -sL "$REF_URL" -o "$REF_DIR/payload-v2-schema.ts"

if [ -f "$SKILL_DIR/SKILL.md" ]; then
  echo ""
  echo "Installed successfully!"
  echo "  Skill: $SKILL_DIR/SKILL.md"
  echo "  Schema: $REF_DIR/payload-v2-schema.ts"
  echo ""
  echo "To generate your analytics, open Claude Code and say:"
  echo '  "Analyze my Claude usage"'
  echo ""
  echo "Dashboard: https://usage-analytics-dashboard.vercel.app"
else
  echo "Installation failed. Please check your network and try again."
  exit 1
fi
