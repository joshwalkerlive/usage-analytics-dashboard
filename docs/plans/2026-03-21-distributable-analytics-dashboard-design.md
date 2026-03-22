# PRD: Distributable Claude Usage Analytics Dashboard (Beta/Pilot)

**Date:** 2026-03-21
**Status:** Approved for implementation
**Version:** 1.0

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Target Users](#3-target-users)
4. [Architecture](#4-architecture)
5. [Payload Schema V2 (Skill ↔ Dashboard Contract)](#5-payload-schema-v2)
6. [Skill Design: `/my-analytics`](#6-skill-design)
7. [Dashboard Refactoring](#7-dashboard-refactoring)
8. [Distribution Plan](#8-distribution-plan)
9. [Success Criteria](#9-success-criteria)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Product Overview

### What

Transform the existing local-only Claude Usage Analytics Dashboard into a distributable tool that any Claude Code user can run against their own usage data and view in a hosted web dashboard.

### How

A **two-part hybrid architecture**:

1. **Claude Code Custom Skill** (`/my-analytics`) — runs on the user's machine, scans their Claude session files, computes quantitative metrics via deterministic/heuristic logic, generates qualitative insights via their own Claude instance, and outputs a single self-contained `analytics-payload.json` file.

2. **Hosted Web Dashboard** (Vercel) — a static React SPA that accepts the payload via drag-and-drop upload, renders the full analytics experience client-side, and never stores any data server-side.

### Why

- Internal Claude AI pilot group needs usage insights for their own sessions
- Zero-cost architecture: AI processing runs on the user's Claude instance, dashboard is a static site
- Data privacy: raw session content never leaves the user's machine; only derived analytics are uploaded to the browser
- Path to a future paid API-driven product once the beta proves the value proposition

---

## 2. Goals & Non-Goals

### Goals (Beta/Pilot)

- Any Claude Code user can install the skill and generate their dashboard in under 2 minutes
- Full analytics experience: quantitative metrics + AI-generated qualitative insights
- Data never stored server-side; payload processed entirely in-browser
- Dashboard auto-opens after skill completes
- Payload is self-documenting via `source` and `dataQuality` blocks
- Internal pilot group (target: 10-20 users) actively using and providing feedback

### Non-Goals (Beta/Pilot)

- Cross-platform support beyond macOS (Linux/Windows paths deferred)
- Team comparison or aggregated analytics across users
- User accounts or authentication on the dashboard
- Persistent data storage or session history
- Custom date ranges or project filters in the skill (single `/my-analytics` command, no arguments)
- API-driven processing (future paid version)
- Mobile-responsive dashboard

---

## 3. Target Users

**Primary:** Internal Claude AI pilot group members who:
- Use Claude Code (CLI) daily or near-daily
- Are on macOS
- Have varying technical proficiency (the tool must work for non-technical users)
- Want to understand their usage patterns, improve their prompting, and optimize their workflows

**Secondary (future):** Any Claude Code user who discovers the tool, eventually paid teams/companies.

---

## 4. Architecture

### System Diagram

```
User's Machine                              Vercel (Static)
+----------------------------------+        +---------------------------+
|                                  |        |                           |
|  Claude Code CLI                 |        |  Analytics Dashboard      |
|  +----------------------------+  |        |  (React SPA)              |
|  |                            |  |        |                           |
|  |  /my-analytics skill       |  |        |  +---------------------+ |
|  |                            |  |        |  | Upload Zone         | |
|  |  Phase 1: Discovery        |  |        |  | (drag & drop)       | |
|  |  - Scan ~/.claude/         |  |        |  +---------------------+ |
|  |  - Scan Desktop sessions   |  |        |           |              |
|  |  - Scan Cowork sessions    |  |        |           v              |
|  |  - Deduplicate             |  |        |  +---------------------+ |
|  |                            |  |        |  | Payload Parser      | |
|  |  Phase 2: Quantitative     |  |        |  | (validate schema)   | |
|  |  - Parse JSONL             |  |        |  +---------------------+ |
|  |  - Compute metrics         |  |        |           |              |
|  |  - Heuristic classify      |  |        |           v              |
|  |                            |  |        |  +---------------------+ |
|  |  Phase 3: Qualitative      |  |        |  | Dashboard Renderer  | |
|  |  - Select sample sessions  |  |        |  | (20+ sections)      | |
|  |  - Generate via Claude     |  |        |  | (Recharts, themes)  | |
|  |  - Enrich unknown fields   |  |        |  +---------------------+ |
|  |                            |  |        |                           |
|  |  Phase 4: Bundle & Launch  |  |        +---------------------------+
|  |  - Write JSON payload      |  |
|  |  - Open browser            |  |
|  +----------------------------+  |
|                                  |
|  Output:                         |
|  ~/.claude/analytics/            |
|    analytics-payload.json        |
+----------------------------------+
```

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Skill computes metrics, not dashboard | Keeps dashboard stateless; metrics computation needs file system access |
| Single JSON payload file | Inspectable, portable, versionable; user can review before uploading |
| Dashboard is client-side only | Zero backend cost; no data storage concerns; simple Vercel static deploy |
| AI runs on user's Claude instance | Zero API cost to us; user's own subscription covers it |
| Payload includes `source` + `dataQuality` | Self-documenting; builds trust; aids debugging |
| `classificationSource` on sessions | Audit trail for heuristic vs AI classifications; improves heuristics over time |

---

## 5. Payload Schema V2

This is the **contract** between the skill and the dashboard. Both sides must conform to this exactly.

### Schema Version: 2.0

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

### Schema Conventions

| Convention | Rule |
|-----------|------|
| **Rates** (errorRate, unknownFieldRate) | `0.0–1.0` proportion |
| **Scores** (frictionScore, satisfactionScore, completenessScore) | `0–100` integer scale |
| **Timestamps** | ISO 8601 (`2026-03-21T14:30:00Z`) |
| **Dates** | `YYYY-MM-DD` |
| **Timezones** | IANA format (`America/New_York`) |
| **Project names** | Sanitized directory names only, never full paths |
| **Session IDs** | As-is from Claude session metadata |

---

## 6. Skill Design: `/my-analytics`

### Installation

```bash
claude skill install josh/claude-analytics
```

### Invocation

```
/my-analytics
```

No arguments. Scans last 30 days, all projects, outputs full payload.

### Execution Phases

#### Phase 1: Discovery (~5 seconds)

**What it does:**
- Scans `~/.claude/projects/` recursively for `*.jsonl` files modified in last 30 days
- Scans `~/Library/Application Support/Claude/claude-code-sessions/` for `local_*.json` metadata files
- Scans `~/Library/Application Support/Claude/local-agent-mode-sessions/` for metadata files
- Deduplicates sessions by session ID across all three sources
- Reports: "Found {n} sessions across {n} projects"

**Error handling:**
- If `~/.claude/projects/` doesn't exist: warn and continue (user may only have Desktop sessions)
- If no sessions found anywhere: abort with helpful message ("No Claude sessions found in the last 30 days")
- If a JSONL file is malformed: skip it, log to `source.excludedSessions` with reason

#### Phase 2: Quantitative Analysis (~10-15 seconds)

**What it does:**

1. **Parse JSONL files** into raw session objects:
   - Extract session ID, timestamps, cwd, model from metadata entries
   - Collect user/assistant message pairs
   - Correlate `tool_use` blocks with `tool_result` blocks
   - Calculate duration from first to last timestamp

2. **Compute deterministic metrics** per session:
   - `messageCount`, `toolCallCount`, `errorCount` — direct counts
   - `durationMinutes` — timestamp arithmetic
   - `model` — from message metadata
   - `committedCode` — detect `Bash` tool calls containing `git commit`
   - `hadToolError` — any `tool_result` with `is_error: true`
   - `languageBreakdown` — file extensions from tool call file path arguments

3. **Apply heuristic classifications** per session:
   - `goal` — keyword scan of first 1-3 user messages:
     - "fix", "bug", "error", "broken" → `bug-fix`
     - "add", "create", "build", "implement", "new" → `feature`
     - "refactor", "clean", "rename", "reorganize" → `refactor`
     - "explore", "investigate", "look at", "understand" → `explore`
     - "config", "setup", "install", "configure" → `config`
     - "doc", "readme", "comment", "document" → `docs`
     - "test", "spec", "coverage" → `test`
     - "analytics", "dashboard", "metrics", "report" → `analytics`
     - "content", "write", "draft", "copy" → `content`
     - "plugin", "skill", "hook", "mcp" → `plugin`
     - "workflow", "automate", "pipeline", "ci" → `workflow`
     - No match → `unknown`
   - `sessionType` — based on duration and message count:
     - Duration < 5 min AND messages < 10 → `quick-task`
     - Duration > 30 min AND messages > 50 → `deep-work`
     - Tool calls > 20 AND distinct tool types > 5 → `multi-step`
     - Otherwise → `standard`
   - `frictionScore` (0-100):
     - Error rate component: `(errorCount / toolCallCount) * 60` (capped at 60)
     - Message density component: `min(messageCount / 10, 1) * 20`
     - Duration anomaly component: `min(durationMinutes / 60, 1) * 20`
   - `satisfactionScore` (0-100):
     - Base: 90
     - Error penalty: `- (errorRate * 50)`
     - Duration penalty: `- min(durationMinutes / 120, 1) * 20`
     - Friction adjustment: `- (frictionScore / 5)`
     - Floor at 0, cap at 100
   - `satisfactionBand`:
     - Score 80-100 → `very-satisfied`
     - Score 60-79 → `satisfied`
     - Score 40-59 → `neutral`
     - Score 0-39 → `frustrated`
   - `outcome`:
     - `committedCode` AND frictionScore < 30 → `smooth`
     - `committedCode` AND frictionScore < 60 → `completed`
     - `committedCode` AND frictionScore >= 60 → `high-friction`
     - NOT committedCode AND duration < 3 min → `abandoned`
     - NOT committedCode AND frictionScore < 40 → `success` (completed without commit)
     - Otherwise → `partial`
   - `frictionTypes` — pattern matching on error messages and session patterns:
     - Tool errors with "permission", "EACCES" → `auth`
     - Tool errors with "not found", "ENOENT" → `file-operation`
     - Tool errors with "command failed", "exit code" → `command-failed`
     - Long tool-call chains without user input → `autonomous-exploration`
     - User messages with "no", "stop", "wrong", "don't" after assistant action → `resistance-to-correction`
     - Tool errors with "npm", "yarn", "pip", "cargo" → `dependency`
     - Tool errors with "config", "env", "PATH" → `environment-config`
     - No specific pattern → `unknown`
   - `helpfulFactors` — inverse signals:
     - errorRate < 0.05 → `error-free-tools`
     - duration < 10 min AND goal achieved → `fast-completion`
     - messageCount < 15 → `concise-interaction`
     - frictionScore < 15 → `low-friction`
   - `hadEnvironmentIssue` — error messages containing PATH, EACCES, permission, "not found" in tool context
   - `hadWrongApproachCorrection` — user messages containing correction language after assistant actions
   - `hadAutonomousExplorationIssue` — 5+ consecutive tool calls without user message
   - `correctionCount` — count of correction-language user messages
   - `classificationSource` — set to `"heuristic"` for all sessions in Phase 2

4. **Aggregate across sessions:**
   - Build all `quantitative.*` rollup arrays (dailyActivity, goalDistribution, toolUsage, etc.)
   - Detect concurrency (overlapping session time windows)
   - Compute overview KPIs

5. **Build `source` and `dataQuality` blocks:**
   - Count files processed, messages parsed, tool events
   - Calculate completeness score (% of sessions with valid timestamps + messages + at least 1 tool call)
   - Log any parsing warnings
   - Build initial `classificationSummary` (all heuristic at this point)

#### Phase 3: Qualitative Insights (~30-60 seconds)

**What it does:**

Claude (the user's own instance) analyzes the quantitative output and a curated sample of session content to generate narrative insights.

**Session sampling strategy:**
- Top 5 highest-friction sessions (by frictionScore)
- Top 5 most productive sessions (lowest friction + committed code)
- 5 sessions with interesting patterns (most tool diversity, longest, most corrections)
- Cap at 15 sessions total to control token usage
- For each sampled session: include first 3 user messages, last 3 exchanges, all error events, and tool call summary (not full content)

**AI generation tasks:**

1. **Enrich `unknown` classifications:**
   - For any sampled session where `goal`, `outcome`, `frictionTypes`, or `helpfulFactors` is `"unknown"` or empty, analyze the session content and fill in correct values
   - Update `classificationSource` to `"ai"` for enriched sessions
   - For sessions that had heuristic values AND got AI review, set to `"hybrid"`

2. **Generate `qualitative.atAGlance`:**
   - Input: full quantitative overview + aggregated metrics
   - Output: 3-5 items per array (workingFactors, hinderingFactors, quickWins, ambitiousGoals)

3. **Generate `qualitative.bigWins`:**
   - Input: top productive sessions + their content samples
   - Output: 3-7 big wins with title, description, sessionRef, impactType, evidence

4. **Generate `qualitative.frictionDeepDive`:**
   - Input: top friction sessions + aggregated frictionTypes
   - Output: 3-5 friction patterns with actionable suggestions

5. **Generate `qualitative.usagePatterns`:**
   - Input: full quantitative data + session samples
   - Output: style narrative, 3-5 strengths, 3-5 growth areas

6. **Generate `qualitative.recommendations`:**
   - Input: all qualitative + quantitative data generated so far
   - Output: prioritized recommendations with effort estimates

7. **Generate `qualitative.onTheHorizon`:**
   - Input: usage trajectory + feature suggestions
   - Output: 2-4 forward-looking items

8. **Generate `projectAreas`:**
   - Input: list of all project names + session counts + goal distributions per project
   - Output: 3-8 thematic area groupings with descriptions and constituent projects

9. **Generate `goalAchievement`:**
   - Input: session outcomes + goals + sampled content
   - Output: achievement breakdown counts

10. **Extract `artifacts`** (optional):
    - Input: sampled sessions that created skills, hooks, or configs
    - Output: notable artifacts with content and context

**Update `dataQuality.classificationSummary`:**
- Recount heuristic/ai/hybrid totals
- Calculate final `unknownFieldRate`

#### Phase 4: Bundle & Launch (~2 seconds)

**What it does:**

1. Assemble the complete `AnalyticsPayloadV2` JSON object
2. Validate that all required fields are present
3. Write to `~/.claude/analytics/analytics-payload.json`
4. Print summary:
   ```
   Analytics payload generated successfully.
   - Sessions analyzed: 147
   - Projects: 12
   - Date range: 2026-02-19 to 2026-03-21
   - Classification: 93 heuristic, 42 AI-enriched, 12 hybrid
   - Data quality: 94/100
   - Payload saved to: ~/.claude/analytics/analytics-payload.json
   - Opening dashboard...
   ```
5. Open browser: `open "https://claude-analytics.vercel.app"`

**Note:** The dashboard URL opens without the payload attached. The user drags and drops the file (or the dashboard detects a recently-generated local payload — see Section 7). This keeps the flow simple and avoids URL-encoded data limitations.

---

## 7. Dashboard Refactoring

### Current State

The existing dashboard:
- Fetches data from Vite dev-server middleware (`/api/sessions`, `/api/insights`)
- Computes metrics client-side from raw `RawSession[]` data
- Renders 20+ visualization sections
- Is deployed on Vercel as a static site (but data APIs don't work in production)

### Target State

The dashboard needs to be refactored to:

1. **Accept uploaded payload files** as the primary data source
2. **Parse and validate** `AnalyticsPayloadV2` schema on upload
3. **Render all sections** from the pre-computed payload (no client-side metric computation needed)
4. **Maintain the existing theme system** and visual design
5. **Keep dev-mode API support** for local development (backward compatible)

### Refactoring Work

#### 7.1 New: Upload Landing Page

**When no data is loaded**, the dashboard shows:

```
+--------------------------------------------------+
|                                                   |
|   Claude Usage Analytics                          |
|                                                   |
|   +------------------------------------------+   |
|   |                                          |   |
|   |   Drop your analytics-payload.json here  |   |
|   |                                          |   |
|   |   or click to browse                     |   |
|   |                                          |   |
|   +------------------------------------------+   |
|                                                   |
|   Don't have a payload yet?                       |
|   Run /my-analytics in Claude Code                |
|                                                   |
+--------------------------------------------------+
```

- Uses `react-dropzone` (already a dependency)
- Accepts `.json` files only
- Validates against `AnalyticsPayloadV2` schema on upload
- Shows clear error messages if validation fails (wrong version, missing fields, etc.)
- On successful upload, transitions to the full dashboard view
- Payload is held in React state only (memory) — never sent to a server, discarded on tab close

#### 7.2 Refactor: Data Flow

**Current flow:**
```
App.tsx
  → fetch("/api/sessions") → RawSession[]
  → buildDashboardData(sessions) → DashboardData
  → render sections with DashboardData
```

**New flow:**
```
App.tsx
  → UploadZone → analytics-payload.json
  → validatePayload(json) → AnalyticsPayloadV2
  → mapPayloadToDashboardData(payload) → DashboardData
  → render sections with DashboardData (same components, same props)
```

**Key insight:** The dashboard components don't change. Only the data source changes. We add a **mapping layer** (`mapPayloadToDashboardData`) that transforms the V2 payload into the existing `DashboardData` interface the components already consume.

This means:
- All existing chart components remain unchanged
- The theme system remains unchanged
- Section layout remains unchanged
- We only add: upload zone, payload validator, payload-to-dashboard mapper

#### 7.3 New: Payload Validator

```typescript
// src/lib/payload-validator.ts

interface ValidationResult {
  valid: boolean;
  payload?: AnalyticsPayloadV2;
  errors: string[];
  warnings: string[];
}

function validatePayload(json: unknown): ValidationResult {
  // Check version field
  // Check required top-level fields
  // Check quantitative sub-fields
  // Check qualitative sub-fields
  // Validate enum values
  // Check data consistency (e.g., counts.sessionCount matches sessions.length)
  // Return structured result with actionable error messages
}
```

#### 7.4 New: Payload-to-Dashboard Mapper

```typescript
// src/lib/payload-mapper.ts

function mapPayloadToDashboardData(payload: AnalyticsPayloadV2): DashboardData {
  // Map payload.quantitative.overview → DashboardData.metrics
  // Map payload.quantitative.sessions → DashboardData.sessions
  // Map payload.quantitative.toolUsage → DashboardData.topTools
  // Map payload.quantitative.dailyActivity → DashboardData.activityTimeline
  // ... etc for all 18+ DashboardData properties
}

function mapPayloadToInsightsReport(payload: AnalyticsPayloadV2): InsightsReport {
  // Map payload.qualitative → InsightsReport format
  // Map payload.artifacts → InsightsReport format (if present)
}
```

#### 7.5 Refactor: App.tsx Data Loading

Current `App.tsx` fetches from APIs on mount. Refactor to:

1. Start in "upload" state — show UploadZone
2. On successful upload + validation → transition to "dashboard" state
3. Pass mapped data to all section components (same as before)
4. Add a "Load different file" button in the header for re-uploading

**Dev-mode backward compatibility:**
- If `import.meta.env.DEV` is true, optionally auto-fetch from `/api/sessions` (existing behavior)
- This keeps the local development workflow intact for the maintainer

#### 7.6 Update: Vercel Deployment

- Remove or gate the Vite dev-server middleware plugins (they already only work in dev)
- Ensure the static build includes the upload zone as the default landing
- Update `vercel.json` if needed (likely no changes — it's already a static Vite build)
- Consider updating the Vercel project name/domain to match the public-facing brand

---

## 8. Distribution Plan

### For Internal Pilot

1. **Skill distribution:**
   - Host skill in a GitHub repo (e.g., `josh/claude-analytics`)
   - Pilot members install via: `claude skill install josh/claude-analytics`
   - Or: share the skill file directly, users place in `~/.claude/skills/`

2. **Dashboard access:**
   - Deploy refactored dashboard to Vercel (existing setup)
   - Share URL with pilot group

3. **Instructions to pilot users:**
   ```
   1. Install the skill:  claude skill install josh/claude-analytics
   2. Run it:             /my-analytics
   3. Dashboard opens automatically. Drop the payload file.
   4. Explore your analytics!
   ```

### Feedback Collection

- Ask pilot users to share:
  - `dataQuality` block from their payload (for debugging classification accuracy)
  - Screenshots of anything that looks wrong
  - Which sections they find most/least useful
  - Any missing insights they expected to see

---

## 9. Success Criteria

### Beta Launch (2 weeks)

- [ ] Skill installs and runs successfully on 3+ different machines
- [ ] Payload generates in under 90 seconds for typical usage (100-200 sessions)
- [ ] Dashboard renders all sections from uploaded payload
- [ ] `dataQuality.completenessScore` averages > 80 across pilot users
- [ ] Zero data leakage: no raw conversation content in payload

### Pilot Complete (6 weeks)

- [ ] 10+ internal users have generated and viewed their dashboards
- [ ] Heuristic classification accuracy > 70% (measured by AI override rate)
- [ ] Users report at least 2 actionable insights from their dashboards
- [ ] Fewer than 3 critical bugs reported

---

## 10. Future Roadmap

### Phase 2: Refinement (Post-Pilot)

- Cross-platform support (Linux, Windows file paths)
- Optional arguments: `--days`, `--project`, `--skip-insights`
- Improved heuristics based on pilot `classificationSummary` data
- Dashboard: comparison mode (upload multiple payloads over time)
- Dashboard: shareable snapshot URLs (base64-encoded summary data)

### Phase 3: API-Driven Paid Product

- Hosted backend with Claude API integration
- User accounts and authentication
- Persistent dashboard with historical data
- Team analytics (aggregated, anonymized cross-user insights)
- Subscription tiers: Free (quantitative only), Pro (full insights), Team (cross-user)
- The skill becomes optional — paid users can upload raw JSONL directly and the backend processes everything

---

## Appendix: Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `skill/my-analytics.md` | The Claude Code skill file (contains all instructions for Phases 1-4) |
| `src/types/payload-v2.ts` | TypeScript type definitions for `AnalyticsPayloadV2` (shared schema) |
| `src/lib/payload-validator.ts` | Schema validation logic |
| `src/lib/payload-mapper.ts` | Maps `AnalyticsPayloadV2` → existing `DashboardData` + `InsightsReport` |
| `src/components/UploadZone.tsx` | Drag-and-drop upload landing page |
| `src/components/UploadError.tsx` | Validation error display |
| `docs/plans/2026-03-21-distributable-analytics-dashboard-design.md` | This document |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add upload state, conditional rendering (upload zone vs dashboard) |
| `src/components/Header.tsx` | Add "Load different file" button |
| `src/lib/types.ts` | Import/re-export from `payload-v2.ts` for shared types |
| `package.json` | No new dependencies expected (react-dropzone already installed) |
| `vercel.json` | Possibly update project name/domain |

### Unchanged Files

All existing chart components, theme system, CSS, and visualization sections remain unchanged. The mapping layer adapts the new payload format to the existing `DashboardData` interface.
