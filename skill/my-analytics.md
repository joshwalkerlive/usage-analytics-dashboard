---
name: my-analytics
description: Generate a comprehensive analytics dashboard of your Claude Code usage from the last 30 days. Scans your local session files, computes quantitative metrics, generates AI-powered qualitative insights, and opens the dashboard in your browser.
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

**Scan these directories:**

1. `~/.claude/projects/` — recursively find all `*.jsonl` files modified in the last 30 days
2. `~/Library/Application Support/Claude/claude-code-sessions/` — find `local_*.json` metadata files
3. `~/Library/Application Support/Claude/local-agent-mode-sessions/` — find metadata files

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
   ```bash
   open "https://usage-analytics-dashboard.vercel.app"
   ```

7. Tell the user: "Dashboard opened. Drag and drop your analytics-payload.json file onto the upload zone."

---

## AnalyticsPayloadV2 Schema Reference

The output JSON must conform to this TypeScript schema:

```typescript
// ============================================================
// Enums & Branded Types
// ============================================================

export type Platform = "macos" | "linux" | "windows";

export type SessionGoal =
  | "bug-fix"
  | "feature"
  | "refactor"
  | "explore"
  | "config"
  | "docs"
  | "test"
  | "analytics"
  | "content"
  | "plugin"
  | "workflow"
  | "unknown";

export type SessionType =
  | "quick-task"
  | "deep-work"
  | "multi-step"
  | "standard"
  | "unknown";

export type SessionOutcome =
  | "completed"
  | "smooth"
  | "success"
  | "high-friction"
  | "abandoned"
  | "partial"
  | "unknown";

export type SatisfactionBand =
  | "very-satisfied"
  | "satisfied"
  | "neutral"
  | "frustrated"
  | "unknown";

export type FrictionType =
  | "autonomous-exploration"
  | "environment-config"
  | "premature-action"
  | "resistance-to-correction"
  | "tool-error"
  | "command-failed"
  | "file-operation"
  | "auth"
  | "dependency"
  | "ambiguous-intent"
  | "unknown";

export type HelpfulFactor =
  | "low-friction"
  | "deep-automation"
  | "error-free-tools"
  | "fast-completion"
  | "concise-interaction"
  | "clear-prompting"
  | "good-environment"
  | "skill-reuse"
  | "unknown";

export type ToolErrorCategory =
  | "command-failed"
  | "file-operation"
  | "tool-error"
  | "auth"
  | "config"
  | "dependency"
  | "network"
  | "timeout"
  | "unknown";

export type BigWinImpactType =
  | "time-saved"
  | "quality"
  | "automation"
  | "delivery"
  | "learning"
  | "system-leverage"
  | "other";

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationEffort = "low" | "medium" | "high";

export type ClassificationSource = "heuristic" | "ai" | "hybrid";

// ============================================================
// Sub-Interfaces
// ============================================================

export interface SessionMetric {
  id: string;
  project: string; // sanitized project name only, no full paths
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  durationMinutes: number;
  messageCount: number;
  toolCallCount: number;
  errorCount: number;
  correctionCount?: number;
  goal: SessionGoal;
  sessionType: SessionType;
  outcome: SessionOutcome;
  frictionScore: number; // 0-100
  satisfactionScore: number; // 0-100, inferred
  satisfactionBand?: SatisfactionBand;
  frictionTypes: FrictionType[];
  helpfulFactors: HelpfulFactor[];
  hadWrongApproachCorrection?: boolean;
  hadEnvironmentIssue?: boolean;
  hadToolError?: boolean;
  hadAutonomousExplorationIssue?: boolean;
  model: string;
  languageBreakdown?: Array<{
    language: string;
    fileCount: number;
  }>;
  committedCode?: boolean;
  notes?: string[];
  /**
   * Tracks whether this session's categorical fields (goal, outcome, frictionTypes, etc.)
   * were set by deterministic heuristics, AI analysis, or a combination.
   * Used to audit classification quality and improve heuristics over time.
   */
  classificationSource: ClassificationSource;
}

export interface DailyActivityPoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  messages: number;
  toolCalls: number;
  errors: number;
  avgSatisfactionScore?: number; // 0-100
}

export interface GoalMetric {
  goal: SessionGoal;
  count: number;
}

export interface ToolUsageMetric {
  name: string;
  count: number;
  sessionCount: number;
  errorCount: number;
  errorRate: number; // 0.0-1.0 (proportion, NOT percentage)
  avgCallsPerSession: number;
  totalDurationSeconds?: number;
  avgDurationSeconds?: number;
}

export interface LanguageMetric {
  language: string;
  sessionCount: number;
  fileCount: number;
  lineEditCount?: number;
  toolCallCount?: number;
  messageMentions?: number;
}

export interface ProjectAreaMetric {
  name: string;
  description: string;
  sessionCount: number;
  totalMinutes: number;
  percentageOfTime?: number;
  /** Which sanitized project names roll up into this area */
  projects: string[];
}

// ============================================================
// Root Payload
// ============================================================

export interface AnalyticsPayloadV2 {
  version: "2.0";
  generatedAt: string; // ISO 8601
  dateRange: { start: string; end: string };
  platform: Platform;

  /**
   * Raw-input provenance and rollup controls.
   * Important for reconciling discrepancies between dashboard sections.
   */
  source: {
    parserVersion: string;
    aggregationVersion: string;
    timezone: string; // IANA timezone, e.g. "America/New_York"
    dateRangeMode: "inclusive" | "exclusive";
    rawSessionFilesProcessed: number;
    rawMessageRecordsProcessed: number;
    rawToolEventsProcessed: number;
    filtersApplied: string[];
    excludedSessions: Array<{
      id: string;
      reason: string;
    }>;
  };

  /**
   * Health of the dataset and rollups.
   */
  dataQuality: {
    completenessScore: number; // 0-100
    warnings: string[];
    inconsistencies: Array<{
      metric: string;
      details: string;
      severity: "low" | "medium" | "high";
    }>;
    classificationSummary: {
      heuristicCount: number;
      aiCount: number;
      hybridCount: number;
      unknownFieldRate: number; // 0.0-1.0, proportion of fields that remained "unknown"
    };
  };

  counts: {
    sessionCount: number;
    projectCount: number;
  };

  quantitative: {
    overview: {
      totalSessions: number;
      totalMessages: number;
      totalToolCalls: number;
      totalDurationMinutes: number;
      avgSessionDurationMinutes: number;
      avgMessagesPerSession: number;
      avgToolCallsPerSession: number;
      sessionsPerDay?: number;
      avgErrorCountPerSession?: number;
      avgFrictionScore?: number; // 0-100
      avgSatisfactionScore?: number; // 0-100
    };

    sessions: SessionMetric[];

    dailyActivity: DailyActivityPoint[];

    goalDistribution: GoalMetric[];

    goalAchievement: {
      fullyAchieved: number;
      mostlyAchieved: number;
      partiallyAchieved: number;
      failed: number;
      unknown: number;
    };

    sessionTypes: Array<{
      type: SessionType;
      count: number;
    }>;

    toolUsage: ToolUsageMetric[];

    toolErrors: {
      byCategory: Array<{
        category: ToolErrorCategory;
        count: number;
      }>;
      byTool: Array<{
        tool: string;
        errorCount: number;
      }>;
    };

    languageStats: LanguageMetric[];

    timeOfDay: Array<{
      bucket: "morning" | "afternoon" | "evening" | "night";
      count: number;
    }>;

    responseTiming: {
      distribution: Array<{
        bucket: "<5s" | "5-15s" | "15-30s" | "30s-1m" | "1-3m" | "3-10m" | ">10m";
        count: number;
      }>;
      avgSeconds: number;
      medianSeconds: number;
      p90Seconds?: number;
    };

    projectAreas: ProjectAreaMetric[];

    topProjects: Array<{
      name: string;
      sessions: number;
      totalMinutes: number;
    }>;

    outcomes: Array<{
      outcome: SessionOutcome;
      count: number;
    }>;

    helpfulFactors: Array<{
      factor: HelpfulFactor;
      count: number;
    }>;

    frictionAndSatisfaction: {
      avgFrictionScore: number; // 0-100
      avgSatisfactionScore: number; // 0-100
      frictionTypes: Array<{
        type: FrictionType;
        count: number;
      }>;
      satisfactionBands: Array<{
        band: SatisfactionBand;
        count: number;
      }>;
    };

    concurrency: {
      parallelUsageDetected: boolean;
      overlappingSessionCount?: number;
    };
  };

  qualitative: {
    atAGlance: {
      workingFactors: string[];
      hinderingFactors: string[];
      quickWins: string[];
      ambitiousGoals: string[];
    };

    bigWins: Array<{
      title: string;
      description: string;
      sessionRef: string;
      impactType?: BigWinImpactType;
      evidence?: string[];
      estimatedValue?: Array<{
        metric: string;
        value: number;
        unit: string;
      }>;
    }>;

    frictionDeepDive: Array<{
      pattern: string;
      frequency: string;
      suggestion: string;
      relatedFrictionTypes?: FrictionType[];
      exampleSessionRefs?: string[];
    }>;

    usagePatterns: {
      style: string;
      strengths: string[];
      growthAreas: string[];
      keyInsight?: string;
    };

    recommendations: {
      claudeMdSuggestions: Array<{
        text: string;
        priority: RecommendationPriority;
      }>;
      workflowTips: Array<{
        text: string;
        priority: RecommendationPriority;
        effort: RecommendationEffort;
      }>;
      featureSuggestions: Array<{
        text: string;
        priority: RecommendationPriority;
        effort: RecommendationEffort;
      }>;
    };

    onTheHorizon?: Array<{
      title: string;
      description: string;
      tip?: string;
    }>;
  };

  /**
   * Optional supporting artifacts (skill files, hooks, configs)
   * referenced in qualitative narratives.
   */
  artifacts?: Array<{
    type: "skill" | "hook" | "command" | "config" | "report-snippet";
    title: string;
    content: string;
    relatedSessionRef?: string;
  }>;
}
```

## Important Notes

- **Privacy:** Never include raw conversation content, full file paths, or API keys in the payload. Only include derived analytics, sanitized project names (directory name only), and session IDs.
- **Project name sanitization:** Extract only the final directory component from cwd paths. `/Users/josh/Documents/my-project` becomes `my-project`.
- **Rates vs scores:** Error rates use 0.0-1.0 (proportions). Scores use 0-100 (integers).
- **Timestamps:** All timestamps must be ISO 8601 format.
- **Token budget:** Keep Phase 3 focused on the 15 sampled sessions to control token usage.
