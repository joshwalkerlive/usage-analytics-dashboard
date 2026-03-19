# Bugs & Issues Tracker

## Fixed

### BUG-001: Tool calls showing as 0
- **Status**: Fixed (2026-03-19)
- **Symptom**: Dashboard header showed "0 tool calls" despite 3,492 actual tool calls in the data
- **Root cause**: Format mismatch between server and client. Server JSONL parser (`sessions-api.ts`) emits messages with `content: string` + `toolCalls: [{tool, args, error}]`. Client metrics (`metrics.ts`) expected `content: ContentBlock[]` with `{type: "tool_use"}` blocks inline.
- **Fix**: Updated `getToolUses()` and `getToolResults()` in `metrics.ts` to also read from the `toolCalls` property. Extended `RawMessage` type to include the `toolCalls` field.
- **Impact**: This fix restored data for: tool call counts, Top Tools chart, Tool Errors chart, session type classification (Deep Work vs Conversation), friction scores, satisfaction scores, helpful factor stats, and outcome stats.

## Open

### BUG-002: Session count discrepancy between Claude Code CLI and Desktop
- **Status**: Open
- **Detail**: Dashboard currently scans `~/.claude/projects/` which only captures Claude Code CLI sessions. Claude Desktop stores additional sessions in `~/Library/Application Support/Claude/`:
  - `claude-code-sessions/`: 47 Claude Code (Desktop) sessions (JSON metadata files, no JSONL transcripts)
  - `local-agent-mode-sessions/`: 64 Cowork sessions (JSON metadata + some nested JSONL transcripts)
- **Impact**: The "40 sessions analyzed" count only reflects CLI sessions. Desktop-launched Claude Code and Cowork sessions are not included.
- **Potential fix**: Extend `sessions-api.ts` to also scan the Desktop session directories and parse their formats.

### BUG-003: Claude Chat sessions not accessible locally
- **Status**: Open / By Design
- **Detail**: Claude Chat (web) conversations are stored server-side at Anthropic, not in local filesystem. There is no local export. To include these, the user would need to use Claude Chat's export feature (if available) or have Claude Chat generate a structured output compatible with the dashboard's format.
- **Workaround**: Generate session data from Claude Chat/Cowork using a structured prompt (see cross-platform-prompts.md).

### BUG-004: Avg duration shows inflated values (e.g. "646m")
- **Status**: Open / Needs investigation
- **Detail**: Average session duration shows 646 minutes per session (~10.7 hours), which seems unrealistically high. Likely caused by some sessions having very long `durationMs` values from first-to-last timestamp spread (sessions left idle), skewing the average.
- **Potential fix**: Cap session duration or use median instead of mean.

### BUG-005: Language stats may be incomplete
- **Status**: Open / Needs investigation
- **Detail**: `computeLanguageStats()` extracts file extensions from tool inputs (`file_path`, `path`, `command` fields). With the server JSONL format, tool inputs live in `toolCalls[].args` rather than content blocks. The function may not correctly extract language data from the server format.
- **Potential fix**: Update `computeLanguageStats()` to also check `msg.toolCalls[].args` for file paths.

## Feature Gaps

### GAP-001: No cross-platform session aggregation
- **Detail**: Dashboard only ingests Claude Code CLI sessions. Claude Cowork and Claude Chat data are stored in different locations/formats and not yet integrated.
- **See**: docs/issues/cross-platform-prompts.md for workaround prompts.
