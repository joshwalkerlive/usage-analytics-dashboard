---
name: my-analytics
version: 1.0.0
description: >-
  This skill should be used when the user asks to analyze their Claude Code usage,
  generate usage analytics, see session stats, review their Claude activity, create
  a usage report, or view their Claude dashboard. It scans local session JSONL files
  from the last 30 days, computes quantitative metrics, generates AI-powered
  qualitative insights, and produces a JSON payload for a browser dashboard.
---

# Claude Usage Analytics Generator

You are generating a comprehensive analytics payload from the user's Claude Code session history.

## Output Schema

You MUST produce a JSON file conforming to the `AnalyticsPayloadV2` schema (version "2.0"). The complete TypeScript type definitions are at the end of this document.

## Execution Phases

Execute these phases in order. Report progress to the user after each phase.

---

### Phase 1: Discovery

**Goal:** Find all Claude Code session files from the last 30 days.

**Scan these directories (platform-aware):**

1. `~/.claude/projects/` — all platforms. Recursively find all `*.jsonl` files
   modified in the last 30 days.
2. Platform-specific session storage:
   - **macOS:** `~/Library/Application Support/Claude/claude-code-sessions/` and
     `~/Library/Application Support/Claude/local-agent-mode-sessions/`
   - **Linux:** `~/.config/claude/claude-code-sessions/` and
     `~/.config/claude/local-agent-mode-sessions/`
   - **Windows:** `%APPDATA%/Claude/claude-code-sessions/` and
     `%APPDATA%/Claude/local-agent-mode-sessions/`
3. Detect platform via `uname -s` (macOS/Linux) or presence of `%APPDATA%` (Windows).

**Steps:**
1. Use Bash to list files in each directory with modification time filtering
2. Count total sessions found
3. Deduplicate by session ID (if the same session appears in multiple locations)
4. Report to user: "Found {n} sessions across {n} projects"

**Error handling:**
- If a directory doesn't exist, skip it silently
- If no sessions found anywhere, tell the user: "No Claude sessions found from the last 30 days. Make sure you have Claude Code session history at ~/.claude/projects/"
- If a JSONL file is malformed, skip it and log the exclusion

---

### Phase 2: Quantitative Analysis

**Goal:** Parse all session files and compute metrics.

**Guardrails:**
- If more than 100 sessions are found, process only the most recent 100 (by
  modification time). Note the cap in `dataQuality.warnings`.
- For JSONL files larger than 50KB, read in chunks using the Read tool's
  offset/limit parameters rather than reading the entire file in one call.
- For every 25 sessions processed, report progress to the user:
  "Processed {n}/{total} sessions..."
- If more than 50% of session files fail to parse, warn the user and ask
  whether to continue with partial data.

**For each JSONL session file:**
1. Read the file and parse each line as a JSON object
2. Extract metadata: session ID from filename or content, timestamps, cwd, model
3. Collect all user and assistant messages
4. Identify tool calls (`tool_use` blocks) and their results (`tool_result` blocks)
5. Calculate:
   - `durationMinutes`: (last timestamp - first timestamp) / 60000
   - `messageCount`: count of user + assistant entries
   - `toolCallCount`: count of `tool_use` blocks
   - `errorCount`: count of `tool_result` blocks where `is_error === true`

**For each Desktop/Cowork JSON metadata file:**
1. Read the JSON and extract: `createdAt`, `lastActivityAt`, `model`, `cwd` (or `userSelectedFolders`)
2. Look for nested JSONL transcript data for full messages
3. If no transcript available, create a minimal session record from metadata only

**Heuristic classifications (apply to each session):**

**Goal classification** — scan the first 1-3 user messages for keywords:
- "fix", "bug", "error", "broken", "issue" → `bug-fix`
- "add", "create", "build", "implement", "new" → `feature`
- "refactor", "clean", "rename", "reorganize", "simplify" → `refactor`
- "explore", "investigate", "look at", "understand", "explain" → `explore`
- "config", "setup", "install", "configure", "env" → `config`
- "doc", "readme", "comment", "document", "jsdoc" → `docs`
- "test", "spec", "coverage", "vitest", "jest" → `test`
- "analytics", "dashboard", "metrics", "report", "data" → `analytics`
- "content", "write", "draft", "copy", "blog" → `content`
- "plugin", "skill", "hook", "mcp", "extension" → `plugin`
- "workflow", "automate", "pipeline", "ci", "deploy" → `workflow`
- No match → `unknown`

**Session type** — based on duration and activity:
- Duration < 5 min AND messages < 10 → `quick-task`
- Duration > 30 min AND messages > 50 → `deep-work`
- Tool calls > 20 AND distinct tool types > 5 → `multi-step`
- Otherwise → `standard`

**Friction score** (0-100):
- Error rate component: `min((errorCount / max(toolCallCount, 1)) * 60, 60)`
- Message density component: `min(messageCount / 10, 1) * 20`
- Duration anomaly component: `min(durationMinutes / 60, 1) * 20`
- Total = sum of components, capped at 100

**Satisfaction score** (0-100):
- Base: 90
- Error penalty: `- (errorRate * 50)` where errorRate = errorCount / max(toolCallCount, 1)
- Duration penalty: `- min(durationMinutes / 120, 1) * 20`
- Friction adjustment: `- (frictionScore / 5)`
- Floor at 0, cap at 100

**Satisfaction band:**
- 80-100 → `very-satisfied`
- 60-79 → `satisfied`
- 40-59 → `neutral`
- 0-39 → `frustrated`

**Outcome:**
- Committed code (detect `git commit` in Bash tool calls) AND frictionScore < 30 → `smooth`
- Committed code AND frictionScore < 60 → `completed`
- Committed code AND frictionScore >= 60 → `high-friction`
- No commit AND duration < 3 min → `abandoned`
- No commit AND frictionScore < 40 → `success`
- Otherwise → `partial`

**Friction types** — pattern match on error messages:
- "permission", "EACCES", "sudo" → `auth`
- "not found", "ENOENT", "no such file" → `file-operation`
- "command failed", "exit code", "non-zero" → `command-failed`
- 5+ consecutive tool calls without user message → `autonomous-exploration`
- User says "no", "stop", "wrong", "don't", "that's not" after assistant action → `resistance-to-correction`
- "npm", "yarn", "pip", "cargo", "dependency" errors → `dependency`
- "config", "env", "PATH", ".env" errors → `environment-config`

**Helpful factors** — positive signals:
- errorRate < 0.05 → `error-free-tools`
- duration < 10 min AND outcome is smooth/completed/success → `fast-completion`
- messageCount < 15 → `concise-interaction`
- frictionScore < 15 → `low-friction`

**Boolean flags:**
- `committedCode`: any Bash tool call containing "git commit"
- `hadToolError`: any tool_result with is_error
- `hadEnvironmentIssue`: error messages containing PATH, EACCES, permission
- `hadWrongApproachCorrection`: user messages with correction language after assistant actions
- `hadAutonomousExplorationIssue`: 5+ consecutive tool calls without user input
- `correctionCount`: count of correction-language user messages

Set `classificationSource` to `"heuristic"` for all sessions.

**Aggregate metrics:**
- Build all rollup arrays: dailyActivity, goalDistribution, toolUsage, toolErrors, languageStats, timeOfDay, responseTiming, topProjects, outcomes, helpfulFactors, frictionAndSatisfaction, concurrency
- Compute overview KPIs
- Detect concurrency (sessions with overlapping time windows)

**Build `source` block:** Count files processed, messages parsed, tool events. Record timezone.

**Build `dataQuality` block:** Calculate completeness score = % of sessions with valid timestamps AND at least 1 message AND at least 1 tool call. Log any warnings.

Report to user: "Analyzed {n} sessions. Computed quantitative metrics."

---

### Phase 3: Qualitative Insights

**Goal:** Generate AI-powered narrative insights from the quantitative data.

**Session count edge case:**
If total sessions < 15, use all sessions for the sampling strategy. Do not
attempt to pick 5+5+5 from a pool smaller than 15.

**Session sampling strategy:**
Select up to 15 representative sessions for deep analysis:
- Top 5 by highest frictionScore
- Top 5 by lowest frictionScore with committedCode = true (most productive)
- Up to 5 with interesting patterns: most tool diversity, longest, most corrections
- Remove duplicates

For each sampled session, prepare a summary including:
- First 3 user messages (text content only, not tool results)
- Last 3 message exchanges
- All error events (tool name + error indicator)
- Tool call summary (tool name + count)
- Do NOT include full file contents or long tool outputs
- **Privacy filter:** When summarizing user messages, redact anything that
  resembles an API key, password, token, secret, or credential. Replace with
  `[REDACTED]`. Do NOT include raw user message content in the payload —
  only analytical summaries.

**Enrichment pass:**
For sampled sessions where `goal`, `outcome`, `frictionTypes`, or `helpfulFactors` are `"unknown"` or empty, analyze the session content and fill in better values. Update `classificationSource` to `"ai"` (or `"hybrid"` if the session already had heuristic values that you're supplementing).

**Generate qualitative sections:**

Using the full quantitative data + sampled session summaries, generate:

1. **atAGlance**: 3-5 items per array (workingFactors, hinderingFactors, quickWins, ambitiousGoals). Be specific and actionable, referencing actual patterns you observed.

2. **bigWins**: 3-7 notable accomplishments. Include title, description, sessionRef (ID), impactType, and evidence (specific metrics/facts).

3. **frictionDeepDive**: 3-5 friction patterns. Include the pattern name, frequency ("X in Y sessions"), a concrete suggestion, related friction types, and example session refs.

4. **usagePatterns**: A narrative description of the user's collaboration style. List 3-5 strengths and 3-5 growth areas. Include a keyInsight (single most important observation).

5. **recommendations**:
   - claudeMdSuggestions: 2-5 specific additions to CLAUDE.md, each with priority
   - workflowTips: 2-4 workflow improvements, each with priority and effort
   - featureSuggestions: 2-4 feature ideas, each with priority and effort

6. **onTheHorizon**: 2-4 forward-looking ideas based on the user's trajectory.

7. **projectAreas**: Cluster the user's projects into 3-8 thematic domains. Each area needs a name, description, session count, total minutes, and list of constituent project names.

8. **goalAchievement**: Based on outcomes, estimate how many sessions fully/mostly/partially achieved their goal, how many failed, and how many are unknown.

**Update `dataQuality.classificationSummary`:** Recount heuristic/ai/hybrid totals and calculate final unknownFieldRate.

Report to user: "Generated qualitative insights. {n} sessions enriched by AI analysis."

**Post-enrichment recomputation:**
After completing all enrichment and qualitative generation, recompute these
aggregate arrays to reflect any classification changes made during enrichment:
- `goalDistribution` — recount by updated session goals
- `outcomes` — recount by updated session outcomes
- `helpfulFactors` — recount by updated session helpful factors
- `frictionAndSatisfaction.frictionTypes` — recount by updated friction types
- `frictionAndSatisfaction.satisfactionBands` — recount by updated satisfaction bands
- `sessionTypes` — recount by updated session types
- `dataQuality.classificationSummary` — recount heuristic/ai/hybrid totals

This ensures the aggregate rollups are consistent with the individual session records.

---

### Phase 4: Bundle & Launch

**Goal:** Assemble the final payload, save it, and open the dashboard.

1. Assemble the complete JSON object conforming to `AnalyticsPayloadV2`
2. Validate that `version` is `"2.0"` and all required fields are present
3. Create the output directory if it doesn't exist: `mkdir -p ~/.claude/analytics`
4. Write the payload to `~/.claude/analytics/analytics-payload.json`
5. Print a summary:

```
Analytics payload generated successfully.
- Sessions analyzed: {n}
- Projects: {n}
- Date range: {start} to {end}
- Classification: {heuristic} heuristic, {ai} AI-enriched, {hybrid} hybrid
- Data quality: {score}/100
- Payload saved to: ~/.claude/analytics/analytics-payload.json
- Opening dashboard...
```

6. Open the dashboard in the user's browser:
   - **macOS:** `open "https://usage-analytics-dashboard.vercel.app"`
   - **Linux:** `xdg-open "https://usage-analytics-dashboard.vercel.app"`
   - **Windows:** `start "https://usage-analytics-dashboard.vercel.app"`
   - Detect platform via `uname -s` or equivalent.

7. Tell the user: "Dashboard opened. Drag and drop your analytics-payload.json file onto the upload zone."

---

## AnalyticsPayloadV2 Schema Reference

The output JSON must conform to the TypeScript schema defined in `references/payload-v2-schema.ts`.
Read that file before beginning Phase 2. All types, enums, and interfaces in that file
are normative — your output must match exactly.

Key points from the schema:
- Root type: `AnalyticsPayloadV2`
- Version field must be `"2.0"`
- Session metrics: `SessionMetric` with friction/satisfaction scores (0-100)
- Goals: 12 possible `SessionGoal` values (bug-fix, feature, refactor, explore, config, docs, test, analytics, content, plugin, workflow, unknown)
- Outcomes: 7 possible `SessionOutcome` values (completed, smooth, success, high-friction, abandoned, partial, unknown)
- Satisfaction bands: 4 values (very-satisfied, satisfied, neutral, frustrated)
- All timestamps: ISO 8601
- Error rates: 0.0-1.0 (proportions, NOT percentages)
- Scores: 0-100 (integers)

## Important Notes

- **Privacy:** Never include raw conversation content, full file paths, or API keys in the payload. Only include derived analytics, sanitized project names (directory name only), and session IDs.
- **Project name sanitization:** Extract only the final directory component from cwd paths. `/Users/josh/Documents/my-project` becomes `my-project`.
- **Rates vs scores:** Error rates use 0.0-1.0 (proportions). Scores use 0-100 (integers).
- **Timestamps:** All timestamps must be ISO 8601 format.
- **Token budget:** Keep Phase 3 focused on the 15 sampled sessions to control token usage.
- **Notes and artifacts fields:** The `notes` field on sessions and `artifacts`
  array must contain only analytical observations, never quoted user input or
  file contents.
