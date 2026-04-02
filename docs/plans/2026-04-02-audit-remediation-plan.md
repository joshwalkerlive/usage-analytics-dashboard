# Usage Analytics Dashboard — Audit Remediation Plan

**Date:** 2026-04-02
**Status:** Ready for execution
**Trigger:** Kyle pilot handoff + future org-wide rollout
**Execution mode:** Claude Code CLI agent swarm (parallel where possible)

---

## How to Run This Plan

This plan is designed for execution via Claude Code CLI. Each task is self-contained
with exact files, exact code references, acceptance criteria, and test commands.

**Launch command:**
```
Read this plan at docs/plans/2026-04-02-audit-remediation-plan.md and execute it phase by phase.
Within each phase, run all independent tasks in parallel using the Agent tool.
After each phase completes, run the verification gate before proceeding to the next phase.
Do not proceed past a failed gate — stop and report.
```

**Parallelism rules:**
- Tasks within the same phase that have no file overlap CAN run in parallel
- Tasks that share files MUST run sequentially (noted in each task)
- Phase gates are blocking — all tasks in a phase must pass before the next phase starts

---

## Phase 0: Critical Bug Fixes (Parallel — No Shared Files)

> **Goal:** Fix the 5 bugs that would break Kyle's first experience.
> **Estimated time:** 15 minutes
> **All 5 tasks can run in parallel.**

---

### Task 0A: Fix InferredSatisfactionChart Color Mapping

**Priority:** Critical
**Files:** `src/components/InferredSatisfactionChart.tsx`
**Depends on:** Nothing
**Conflicts with:** Nothing

**Problem:**
The V2 payload produces satisfaction bands as kebab-case strings (`"very-satisfied"`,
`"satisfied"`, `"neutral"`, `"frustrated"`). But the chart's `SATISFACTION_COLORS` lookup
and `LEVEL_ORDER` array use Title Case strings (`"Very Satisfied"`, `"Satisfied"`, etc.).
The `data.find((d) => d.level === level)` lookup at line 43 never matches, so all bars
render with `FALLBACK_COLOR` (#818cf8) instead of semantic colors.

**Fix:**
Change `SATISFACTION_COLORS` keys and `LEVEL_ORDER` values to match V2 kebab-case values.
The display labels in the chart (XAxis tick, Tooltip) should still show human-readable
Title Case — use a `displayLabel()` helper to convert at render time.

```typescript
// REPLACE the current SATISFACTION_COLORS (lines 18-24)
const SATISFACTION_COLORS: Record<string, string> = {
  "very-satisfied": "#34d399",
  "satisfied": "#d7e260",
  "neutral": "#94a3b8",
  "frustrated": "#fb923c",
};

// REPLACE the current LEVEL_ORDER (lines 29-35)
const LEVEL_ORDER = [
  "very-satisfied",
  "satisfied",
  "neutral",
  "frustrated",
];

// ADD a display label helper
function displayLabel(level: string): string {
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
```

Also update the XAxis `tickFormatter` and Tooltip `labelFormatter` to use `displayLabel()`.

**Acceptance criteria:**
- Satisfaction bars render with distinct semantic colors (green, yellow, grey, orange)
- Tooltip shows "Very Satisfied", "Satisfied", etc. (not kebab-case)
- XAxis labels show Title Case
- `npm run build` passes with no type errors

---

### Task 0B: Fix OutcomesChart Color Mapping

**Priority:** Critical
**Files:** `src/components/OutcomesChart.tsx`
**Depends on:** Nothing
**Conflicts with:** Nothing

**Problem:**
Same pattern as 0A. The V2 payload produces outcomes as kebab-case (`"completed"`,
`"smooth"`, `"success"`, `"high-friction"`, `"partial"`, `"abandoned"`, `"unknown"`).
The chart's `OUTCOME_COLORS` uses Title Case and only knows 4 of the 7 values.
All outcomes fall through to `FALLBACK_COLORS` array cycling.

**Fix:**
Expand `OUTCOME_COLORS` to cover all 7 V2 outcome values, keyed in kebab-case.
Add a `displayLabel()` helper for the Legend and Tooltip (same pattern as Task 0A).

```typescript
// REPLACE the current OUTCOME_COLORS (lines 17-22)
const OUTCOME_COLORS: Record<string, string> = {
  "completed": "#34d399",   // emerald
  "smooth": "#6ee7b7",      // emerald-300
  "success": "#a7f3d0",     // emerald-200
  "high-friction": "#f97316", // orange-500
  "partial": "#fbbf24",     // amber-400
  "abandoned": "#f87171",   // red-400
  "unknown": "#64748b",     // slate-500
};
```

Add a `displayLabel()` helper (same as Task 0A). Use it in the Legend `formatter`,
Tooltip `formatter`, and pie label.

**Acceptance criteria:**
- All 7 V2 outcome types render with distinct, semantically meaningful colors
- Pie chart legend shows human-readable labels ("High Friction", not "high-friction")
- `npm run build` passes with no type errors

---

### Task 0C: Fix String Comparison Bug in MetricsWithSparklines

**Priority:** Critical
**Files:** `src/components/MetricsWithSparklines.tsx`
**Depends on:** Nothing
**Conflicts with:** Nothing

**Problem:**
Line 104: `trend: sessionsPerDay > "2.5" ? "up" : "neutral"` is a lexicographic
string comparison because `sessionsPerDay` is the result of `.toFixed(1)` (a string).
This means `"10.0"` evaluates as less than `"2.5"` because `"1" < "2"` in string sort.
Users with high session counts get the wrong trend arrow.

**Fix:**
```typescript
// Line 104 — change from:
trend: sessionsPerDay > "2.5" ? "up" : "neutral",

// To:
trend: parseFloat(sessionsPerDay) > 2.5 ? "up" : "neutral",
```

**Acceptance criteria:**
- `parseFloat()` is used for the comparison
- A sessions/day value of "10.0" correctly shows "up" trend
- `npm run build` passes with no type errors

---

### Task 0D: Add Null Guards in Payload Mapper

**Priority:** Critical
**Files:** `src/lib/payload-mapper.ts`
**Depends on:** Nothing
**Conflicts with:** Task 1A (if they edit the same function — schedule 0D first)

**Problem:**
The validator checks 11 `requiredQuantFields` but the mapper accesses 5 additional
fields without null guards. A valid-but-minimal payload throws `TypeError`:
- `q.languageStats.map(...)` — line 87
- `q.sessionTypes.map(...)` — line 92
- `q.toolErrors.byCategory.map(...)` — line 110
- `quant.projectAreas.map(...)` — line 180
- `quant.concurrency.parallelUsageDetected` — line 192

**Fix:**
Add nullish-coalescing guards for each:

```typescript
// Line 87
const languageStats: LanguageStat[] = (q.languageStats ?? []).map((l) => ({

// Line 92
const sessionTypeStats: SessionTypeStat[] = (q.sessionTypes ?? []).map((s) => ({

// Line 110
const toolErrorStats: ToolErrorStat[] = (q.toolErrors?.byCategory ?? []).map((e) => ({

// Line 180 (inside mapPayloadToInsightsReport)
projectAreas: (quant.projectAreas ?? []).map((p) => ({

// Lines 192-194 (inside mapPayloadToInsightsReport)
multiClauding: {
  detected: quant.concurrency?.parallelUsageDetected ?? false,
  details: quant.concurrency?.overlappingSessionCount
    ? `${quant.concurrency.overlappingSessionCount} overlapping sessions detected`
    : "No parallel usage detected",
},
```

**Acceptance criteria:**
- A payload missing `languageStats`, `sessionTypes`, `toolErrors`, `projectAreas`,
  or `concurrency` does not crash — renders with empty/default values
- Existing payloads with all fields still work identically
- `npm run build` passes
- `npm run test` passes (existing mapper tests must not break)

---

### Task 0E: Fix PILOT-GUIDE Install Instructions

**Priority:** Critical
**Files:** `docs/PILOT-GUIDE.md`
**Depends on:** Nothing
**Conflicts with:** Nothing

**Problem:**
1. `claude skill install josh/claude-analytics` does not exist as a CLI command
2. Manual path `~/.claude/skills/my-analytics.md` is wrong — should be
   `~/.claude/skills/my-analytics/SKILL.md` (directory with SKILL.md inside)
3. `/my-analytics` slash command syntax in "Step 2" is misleading — skills trigger
   via natural language description matching, not slash commands

**Fix:**
Rewrite the Quick Start section:

```markdown
## Quick Start (2 minutes)

### Step 1: Install the Skill

Run this one-liner in your terminal:

\`\`\`bash
mkdir -p ~/.claude/skills/my-analytics && curl -sL https://raw.githubusercontent.com/joshwalkerlive/usage-analytics-dashboard/main/skill/my-analytics.md -o ~/.claude/skills/my-analytics/SKILL.md
\`\`\`

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
```

Also update the Troubleshooting section:
- Change "Skill not found" fix to reference the correct path
- Add a "Skill doesn't trigger" entry explaining natural language triggering

**Acceptance criteria:**
- No references to `claude skill install` anywhere in the file
- Install path is `~/.claude/skills/my-analytics/SKILL.md`
- No `/my-analytics` slash command references — uses natural language examples
- Troubleshooting covers the correct install path

---

### Phase 0 Gate

```bash
npm run build && npm run test
```

Both must pass with zero errors. Warnings about unused variables are acceptable.
Visually verify the chart fixes by uploading `test-payload.json` to the local dev
server (`npm run dev`) if a payload is available.

---

## Phase 1: Stabilization for Team Use (Some Parallel, Some Sequential)

> **Goal:** Expand type coverage, strengthen validation, clean up dead code, improve skill.
> **Estimated time:** 45 minutes
> **Parallelism noted per task.**

---

### Task 1A: Expand GoalCategory to Include All V2 Goals

**Priority:** High
**Files:** `src/lib/types.ts`, `src/lib/payload-mapper.ts`
**Depends on:** Task 0D must complete first (shared file: payload-mapper.ts)
**Conflicts with:** Task 0D

**Problem:**
`GoalCategory` in `types.ts` (line 53-61) only has 8 values. The V2 schema defines
12: the 8 existing ones plus `analytics`, `content`, `plugin`, `workflow`. The mapper's
`mapGoal()` function (line 281-297) drops the extra 4 to `"unknown"`, inflating the
"Other" segment in `WantedChart`.

**Fix:**

1. In `src/lib/types.ts` line 53-61, expand `GoalCategory`:
```typescript
export type GoalCategory =
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
```

2. In `src/lib/payload-mapper.ts`, update the `mapGoal()` function's `validGoals` array
   to include the 4 new values.

3. In `src/components/WantedChart.tsx`, add colors for the 4 new goal categories to the
   chart's color palette (if it has a fixed color map).

**Acceptance criteria:**
- Sessions with goals like `analytics`, `plugin`, `content`, `workflow` render as
  distinct chart segments with their own labels, not collapsed to "Unknown"
- `npm run build` passes
- `npm run test` passes

---

### Task 1B: Strengthen Payload Validator

**Priority:** High
**Files:** `src/lib/payload-validator.ts`, `src/lib/payload-validator.test.ts`
**Depends on:** Nothing
**Can run in parallel with:** 1A, 1C, 1D, 1E, 1F

**Problem:**
The validator only checks field presence, not value types or enum constraints.
A payload with `frictionScore: "high"` or `goal: "debugging"` passes validation.

**Fix:**

1. Add the 5 missing `requiredQuantFields` that the mapper accesses:
   `"languageStats"`, `"sessionTypes"`, `"toolErrors"`, `"projectAreas"`, `"concurrency"`

   Note: Since Task 0D already added null guards, these can be warnings rather
   than hard errors to maintain backward compatibility.

2. Add type validation for `quantitative.overview` numeric fields:
```typescript
const overview = quant.overview as Record<string, unknown>;
const numericOverviewFields = [
  "totalSessions", "totalMessages", "totalToolCalls",
  "totalDurationMinutes", "avgSessionDurationMinutes",
  "avgMessagesPerSession", "avgToolCallsPerSession",
];
for (const field of numericOverviewFields) {
  if (overview[field] !== undefined && typeof overview[field] !== "number") {
    errors.push(`"quantitative.overview.${field}" must be a number, got ${typeof overview[field]}`);
  }
}
```

3. Add session array item spot-checks (check first session only for performance):
```typescript
if (Array.isArray(quant.sessions) && quant.sessions.length > 0) {
  const firstSession = quant.sessions[0] as Record<string, unknown>;
  if (typeof firstSession.frictionScore !== "number") {
    warnings.push("Session frictionScore should be a number (0-100)");
  }
  if (typeof firstSession.satisfactionScore !== "number") {
    warnings.push("Session satisfactionScore should be a number (0-100)");
  }
}
```

4. Add corresponding tests in `payload-validator.test.ts`:
   - Test that a payload with `frictionScore: "high"` produces a warning
   - Test that a payload with `overview.totalSessions: "five"` produces an error
   - Test that missing `languageStats` produces a warning (not an error, since 0D adds guards)

**Acceptance criteria:**
- Type-mismatched values produce errors or warnings (not silent pass-through)
- All existing tests still pass
- New tests cover the added validation logic
- `npm run test` passes

---

### Task 1C: Update Skill Description with Trigger Phrases

**Priority:** High
**Files:** `skill/my-analytics.md`
**Depends on:** Nothing
**Can run in parallel with:** 1A, 1B, 1D, 1E, 1F

**Problem:**
The skill description is procedural and lacks trigger phrases. It won't match
natural language like "analyze my Claude usage" or "show my session stats".

**Fix:**
Replace the frontmatter description:

```yaml
---
name: my-analytics
description: >-
  This skill should be used when the user asks to analyze their Claude Code usage,
  generate usage analytics, see session stats, review their Claude activity, create
  a usage report, or view their Claude dashboard. It scans local session JSONL files
  from the last 30 days, computes quantitative metrics, generates AI-powered
  qualitative insights, and produces a JSON payload for a browser dashboard.
---
```

Also add a `version` field:
```yaml
---
name: my-analytics
version: 1.0.0
description: >-
  ...
---
```

**Acceptance criteria:**
- Description starts with "This skill should be used when..."
- Includes at least 5 trigger phrases covering common user language
- `version: 1.0.0` is present in frontmatter
- The body content of the skill is unchanged

---

### Task 1D: Extract Schema from Skill to References Directory

**Priority:** High
**Files:** `skill/my-analytics.md`, `skill/references/payload-v2-schema.ts` (new file)
**Depends on:** Nothing
**Can run in parallel with:** 1A, 1B, 1C, 1E, 1F

**Problem:**
The skill embeds ~400 lines of TypeScript schema inline, consuming ~3,200 tokens on
every invocation. This is also a drift risk since `src/types/payload-v2.ts` is the
canonical source.

**Fix:**

1. Create `skill/references/` directory
2. Copy `src/types/payload-v2.ts` to `skill/references/payload-v2-schema.ts`
   (exact copy — this is the canonical schema the skill references)
3. In `skill/my-analytics.md`, replace the entire embedded TypeScript code block
   (lines 234-636, from ` ```typescript ` to ` ``` `) with:

```markdown
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
```

4. Add a comment at the top of `skill/references/payload-v2-schema.ts`:
```typescript
// Canonical source: src/types/payload-v2.ts
// This file is a copy for the Claude Code skill's reference.
// When updating the schema, update both files.
```

**Acceptance criteria:**
- `skill/references/payload-v2-schema.ts` exists and matches `src/types/payload-v2.ts`
- The skill body no longer contains the full TypeScript schema block
- The skill body contains a pointer to the references file with key schema summary points
- Total skill word count is under 3,000 words (was ~4,800)

---

### Task 1E: Add File Size Guard to UploadZone

**Priority:** Medium
**Files:** `src/components/UploadZone.tsx`
**Depends on:** Nothing
**Can run in parallel with:** 1A, 1B, 1C, 1D, 1F

**Problem:**
`file.text()` at line 25 reads arbitrarily large files with no size check.
A multi-megabyte payload can freeze the browser tab.

**Fix:**
Add a size check before reading the file:

```typescript
// Add after line 19 (if (!file) return;)
if (file.size > 25 * 1024 * 1024) {
  setValidation({
    valid: false,
    errors: ["File is too large (max 25 MB). Analytics payloads are typically under 1 MB."],
    warnings: [],
  });
  setParsing(false);
  return;
}
```

**Acceptance criteria:**
- Files over 25 MB show a clear error message
- Files under 25 MB work exactly as before
- `npm run build` passes

---

### Task 1F: Remove Dead Modules

**Priority:** Medium
**Files to delete:**
- `src/components/CalendarHeatmap.tsx` (duplicated by ActivityDashboard)
- `src/components/GlobalInsightsBadge.tsx` (unused, not imported anywhere)
- `src/components/DateRangeFilter.tsx` (unused, not imported anywhere)
- `src/lib/computed-insights.ts` (unused 419-line module)
- `server/session-meta-api.ts` (plugin exists but never registered in vite.config.ts)

**Files to verify NOT imported:** `src/components/ProjectSelector.tsx` — check if App.tsx
imports it. If not imported anywhere, also delete.

**Depends on:** Nothing
**Can run in parallel with:** 1A, 1B, 1C, 1D, 1E

**Verification before deleting:**
For each file, run `grep -r "CalendarHeatmap\|GlobalInsightsBadge\|DateRangeFilter\|computed-insights\|session-meta-api\|ProjectSelector" src/ server/ --include="*.ts" --include="*.tsx"`
to confirm zero import references (excluding the files themselves and test files).

**Fix:**
Delete each confirmed-unused file.

**Acceptance criteria:**
- All listed files are deleted (only if confirmed unused by grep)
- `npm run build` passes with no missing-import errors
- `npm run test` passes
- No component renders incorrectly after deletion

---

### Task 1G: Add Post-Enrichment Recomputation to Skill

**Priority:** Medium
**Files:** `skill/my-analytics.md`
**Depends on:** Task 1C and 1D must complete first (shared file)
**Must run AFTER:** 1C, 1D

**Problem:**
Phase 3's enrichment pass can change session classifications (e.g., upgrading
`goal: "unknown"` to `goal: "feature"`), but the skill never instructs Claude to
recompute the aggregate arrays that depend on those classifications.

**Fix:**
Add to the end of Phase 3, after the "Generate qualitative sections" block:

```markdown
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
```

**Acceptance criteria:**
- The instruction appears at the end of Phase 3, before Phase 4
- It explicitly lists the 7 arrays/objects that must be recomputed
- No other Phase 3 content is changed

---

### Phase 1 Gate

```bash
npm run build && npm run test
```

Both must pass. Verify the skill file is under 3,000 words:
```bash
wc -w skill/my-analytics.md
```
Should output less than 3,000.

Verify `skill/references/payload-v2-schema.ts` exists and matches source:
```bash
diff src/types/payload-v2.ts skill/references/payload-v2-schema.ts
```
Should show only the added comment header (no functional differences).

---

## Phase 2: Production Polish (Mostly Parallel)

> **Goal:** Tests, abstractions, UX improvements, documentation.
> **Estimated time:** 60 minutes
> **Most tasks can run in parallel.**

---

### Task 2A: Add Component Tests for Critical Charts

**Priority:** High
**Files:** `src/components/__tests__/InferredSatisfactionChart.test.tsx` (new),
          `src/components/__tests__/OutcomesChart.test.tsx` (new),
          `src/components/__tests__/WantedChart.test.tsx` (new)
**Depends on:** Phase 0 (chart fixes) and Phase 1A (GoalCategory expansion)
**Can run in parallel with:** 2B, 2C, 2D, 2E, 2F, 2G

**Tests to write:**

1. **InferredSatisfactionChart.test.tsx:**
   - Renders bars with correct semantic colors for each V2 band value
   - Handles empty data array without crashing
   - Displays human-readable labels on XAxis (not kebab-case)

2. **OutcomesChart.test.tsx:**
   - Renders all 7 V2 outcome values with distinct colors
   - Handles empty data array without crashing
   - Legend shows human-readable labels

3. **WantedChart.test.tsx:**
   - Renders all 12 GoalCategory values (including the 4 new ones)
   - Percentages are rounded integers (not raw floats)
   - Handles empty data without crashing

Use `@testing-library/react` and `vitest`. Mock `ResizeObserver` if Recharts
requires it (common in test environments).

**Acceptance criteria:**
- All 3 test files exist with at least 3 tests each
- `npm run test` passes including new tests
- Tests would have caught the original color-mapping bugs (regression prevention)

---

### Task 2B: Extract Shared Chart Utilities

**Priority:** Medium
**Files:** `src/lib/chart-utils.ts` (new),
          `src/components/Header.tsx`,
          `src/components/NavTOC.tsx`,
          `src/components/ThemeSelector.tsx`
**Depends on:** Nothing
**Can run in parallel with:** 2A, 2C, 2D, 2E, 2F, 2G

**Problem:**
1. `hexToRgba` is duplicated in Header.tsx (line 13), NavTOC.tsx (line 5),
   ThemeSelector.tsx (line 3) — identical implementations.
2. Recharts Tooltip `contentStyle`/`labelStyle`/`itemStyle` config is copy-pasted
   across 8+ chart components.

**Fix:**

1. Create `src/lib/chart-utils.ts`:
```typescript
/**
 * Converts a hex color to rgba with the given alpha.
 * Uses parseInt with slice (NOT regex — regex triggers security hook false positive).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Returns Recharts-compatible tooltip style props from the current theme.
 */
export function tooltipStyles(theme: { colors: { bg: { secondary: string }; text: { primary: string; secondary: string }; border: string } }) {
  return {
    contentStyle: {
      backgroundColor: theme.colors.bg.secondary,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "8px",
      color: theme.colors.text.primary,
    },
    labelStyle: { color: theme.colors.text.primary },
    itemStyle: { color: theme.colors.text.secondary },
  };
}

/**
 * Converts a kebab-case string to Title Case for chart display labels.
 */
export function displayLabel(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
```

2. Replace `hexToRgba` in Header.tsx, NavTOC.tsx, ThemeSelector.tsx with import
   from `@/lib/chart-utils`.

3. Optionally: update 2-3 chart components to use `tooltipStyles()` as a demonstration.
   (Full migration of all 11 charts can be a separate task.)

**Acceptance criteria:**
- `hexToRgba` exists only in `src/lib/chart-utils.ts`
- Header, NavTOC, ThemeSelector import it from there
- No duplicate `hexToRgba` implementations remain
- `npm run build` passes

---

### Task 2C: Map workflowTips to Dashboard

**Priority:** Medium
**Files:** `src/lib/insights-types.ts`, `src/lib/payload-mapper.ts`,
          `src/components/FeatureSuggestions.tsx`
**Depends on:** Nothing
**Can run in parallel with:** 2A, 2B, 2D, 2E, 2F, 2G

**Problem:**
`qualitative.recommendations.workflowTips` exists in the V2 payload but is silently
discarded by `mapPayloadToInsightsReport`. The data is never rendered.

**Fix:**

1. Add `workflowTips` to `InsightsReport` in `src/lib/insights-types.ts`:
```typescript
workflowTips: {
  text: string;
  priority: string;
  effort: string;
}[];
```

2. Map it in `payload-mapper.ts` inside `mapPayloadToInsightsReport`:
```typescript
workflowTips: (q.recommendations.workflowTips ?? []).map((w) => ({
  text: w.text,
  priority: w.priority,
  effort: w.effort,
})),
```

3. Render in `FeatureSuggestions.tsx` (or create a new `WorkflowTips` section)
   alongside the existing feature recommendations.

**Acceptance criteria:**
- Workflow tips from the payload appear in the dashboard
- Empty workflow tips array renders gracefully (no crash, no empty section)
- `npm run build` passes

---

### Task 2D: Persist Theme Selection in localStorage

**Priority:** Medium
**Files:** `src/context/ThemeContext.tsx`
**Depends on:** Nothing
**Can run in parallel with:** 2A, 2B, 2C, 2E, 2F, 2G

**Problem:**
Theme resets to `"morning"` on every page reload. Line 260 initializes state
with no localStorage read.

**Fix:**
1. On mount, read from `localStorage.getItem("analytics-theme")`
2. On theme change, write to `localStorage.setItem("analytics-theme", newTheme)`
3. Fall back to `"morning"` if no stored value

```typescript
const [theme, setThemeState] = useState<ThemeName>(() => {
  const stored = localStorage.getItem("analytics-theme");
  return stored && isValidTheme(stored) ? stored : "morning";
});

const setTheme = useCallback((t: ThemeName) => {
  setThemeState(t);
  localStorage.setItem("analytics-theme", t);
}, []);
```

Add a type guard helper:
```typescript
function isValidTheme(value: string): value is ThemeName {
  return ["morning", "day", "evening", "dark", "retro"].includes(value);
}
```

**Acceptance criteria:**
- Selecting a theme persists across page reloads
- Invalid localStorage values fall back to "morning" without errors
- `npm run build` passes

---

### Task 2E: Fix HighlightReel Conditional Rendering

**Priority:** Medium
**Files:** `src/components/HighlightReel.tsx`, `src/App.tsx`
**Depends on:** Nothing
**Can run in parallel with:** 2A, 2B, 2C, 2D, 2F, 2G

**Problem:**
`HighlightReel` always fetches `/api/facets` on mount, even in production
(Vercel) where the endpoint doesn't exist. It silently returns null.
It's rendered unconditionally in App.tsx.

**Fix:**
Option A (simpler): Conditionally render HighlightReel only when NOT in
upload-payload mode. In App.tsx, wrap the HighlightReel render:
```tsx
{!uploadedPayload && <HighlightReel />}
```

Option B (cleaner): Remove HighlightReel entirely from the render tree since
it has no data source in the upload-first production flow. Delete the import
and JSX from App.tsx. Do NOT delete the component file (it may be useful for
future dev-mode features).

**Recommended:** Option A for now.

**Acceptance criteria:**
- HighlightReel does not fetch `/api/facets` when a payload is uploaded
- No 404 errors in browser console during normal upload flow
- `npm run build` passes

---

### Task 2F: Round Percentage in WantedChart Tooltip

**Priority:** Low
**Files:** `src/lib/payload-mapper.ts`
**Depends on:** Task 0D and 1A must complete first (shared file)
**Must run AFTER:** 0D, 1A

**Problem:**
`goalDistribution` percentage at line 58 is `(g.count / totalSessions) * 100`
with no rounding. Tooltip shows `33.333333336%`.

**Fix:**
```typescript
// Line 58 — change from:
percentage: totalSessions > 0 ? (g.count / totalSessions) * 100 : 0,
// To:
percentage: totalSessions > 0 ? Math.round((g.count / totalSessions) * 100) : 0,
```

**Acceptance criteria:**
- Percentages in the WantedChart tooltip are whole numbers
- `npm run build` passes

---

### Task 2G: Create Install Script for Team Distribution

**Priority:** High
**Files:** `install.sh` (new, at project root)
**Depends on:** Task 0E (PILOT-GUIDE must be updated first for consistent messaging)
**Can run in parallel with:** 2A-2F

**Fix:**
Create `install.sh`:

```bash
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
```

Make it executable: `chmod +x install.sh`

**Acceptance criteria:**
- `install.sh` exists at project root and is executable
- Running it creates the correct directory structure and downloads both files
- Success message includes the natural language trigger and dashboard URL
- Script is idempotent (safe to run multiple times)

---

### Phase 2 Gate

```bash
npm run build && npm run test
```

Also verify:
```bash
# Theme persistence
# 1. Open dev server, select "retro" theme, reload page — should still be retro

# Install script (dry run)
bash install.sh && ls -la ~/.claude/skills/my-analytics/
```

---

## Phase 3: Skill Improvements (Sequential — Single File)

> **Goal:** Improve the skill's robustness and cross-platform support.
> **Estimated time:** 20 minutes
> **Tasks are sequential (all edit skill/my-analytics.md).**

---

### Task 3A: Add Cross-Platform Support to Skill

**Priority:** Medium
**Files:** `skill/my-analytics.md`
**Depends on:** Phase 1 (1C, 1D, 1G must be complete)

**Fix:**
In Phase 1 (Discovery), replace the macOS-only scan directories with
platform-aware instructions:

```markdown
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
```

In Phase 4 (Bundle & Launch), replace the `open` command:

```markdown
6. Open the dashboard in the user's browser:
   - **macOS:** `open "https://usage-analytics-dashboard.vercel.app"`
   - **Linux:** `xdg-open "https://usage-analytics-dashboard.vercel.app"`
   - **Windows:** `start "https://usage-analytics-dashboard.vercel.app"`
   - Detect platform via `uname -s` or equivalent.
```

**Acceptance criteria:**
- Phase 1 includes Linux and Windows paths
- Phase 4 includes cross-platform browser launch
- macOS paths are unchanged (backward compatible)

---

### Task 3B: Add Session Count Cap and Progress Reporting

**Priority:** Medium
**Files:** `skill/my-analytics.md`
**Depends on:** Task 3A (sequential — same file)

**Fix:**
Add to Phase 2, after the opening paragraph:

```markdown
**Guardrails:**
- If more than 100 sessions are found, process only the most recent 100 (by
  modification time). Note the cap in `dataQuality.warnings`.
- For JSONL files larger than 50KB, read in chunks using the Read tool's
  offset/limit parameters rather than reading the entire file in one call.
- For every 25 sessions processed, report progress to the user:
  "Processed {n}/{total} sessions..."
- If more than 50% of session files fail to parse, warn the user and ask
  whether to continue with partial data.
```

Add to Phase 3, before the sampling strategy:

```markdown
**Session count edge case:**
If total sessions < 15, use all sessions for the sampling strategy. Do not
attempt to pick 5+5+5 from a pool smaller than 15.
```

**Acceptance criteria:**
- 100-session cap is documented with the warning instruction
- Chunked reading guidance is present
- Progress reporting every 25 sessions is specified
- Phase 3 handles < 15 sessions gracefully

---

### Task 3C: Add Privacy Safeguards for Phase 3

**Priority:** Medium
**Files:** `skill/my-analytics.md`
**Depends on:** Task 3B (sequential — same file)

**Fix:**
Add to Phase 3, in the "For each sampled session" block:

```markdown
- **Privacy filter:** When summarizing user messages, redact anything that
  resembles an API key, password, token, secret, or credential. Replace with
  `[REDACTED]`. Do NOT include raw user message content in the payload —
  only analytical summaries.
```

Add to the "Important Notes" section at the bottom:

```markdown
- **Notes and artifacts fields:** The `notes` field on sessions and `artifacts`
  array must contain only analytical observations, never quoted user input or
  file contents.
```

**Acceptance criteria:**
- Phase 3 includes explicit redaction instructions
- Important Notes section includes the notes/artifacts guidance
- No other content changed

---

### Phase 3 Gate

```bash
wc -w skill/my-analytics.md
# Must be under 3,000 words

# Verify the skill file is valid YAML frontmatter + markdown
head -10 skill/my-analytics.md
# Should show --- / name / version / description / ---
```

---

## Summary: Task Dependency Graph

```
Phase 0 (all parallel):
  0A ─┐
  0B ─┤
  0C ─┤── Phase 0 Gate
  0D ─┤
  0E ─┘

Phase 1 (mostly parallel):
  1A (after 0D) ─┐
  1B ─────────────┤
  1C ─────────────┤
  1D ─────────────┤── Phase 1 Gate
  1E ─────────────┤
  1F ─────────────┤
  1G (after 1C,1D)┘

Phase 2 (mostly parallel):
  2A (after P0,1A) ─┐
  2B ────────────────┤
  2C ────────────────┤
  2D ────────────────┤── Phase 2 Gate
  2E ────────────────┤
  2F (after 0D,1A) ──┤
  2G (after 0E) ─────┘

Phase 3 (sequential):
  3A → 3B → 3C ── Phase 3 Gate
```

## File Manifest

Files **modified** (existing):
- `src/components/InferredSatisfactionChart.tsx` (Task 0A)
- `src/components/OutcomesChart.tsx` (Task 0B)
- `src/components/MetricsWithSparklines.tsx` (Task 0C)
- `src/lib/payload-mapper.ts` (Tasks 0D, 1A, 2F)
- `docs/PILOT-GUIDE.md` (Task 0E)
- `src/lib/types.ts` (Task 1A)
- `src/lib/payload-validator.ts` (Task 1B)
- `skill/my-analytics.md` (Tasks 1C, 1D, 1G, 3A, 3B, 3C)
- `src/components/UploadZone.tsx` (Task 1E)
- `src/lib/insights-types.ts` (Task 2C)
- `src/components/FeatureSuggestions.tsx` (Task 2C)
- `src/context/ThemeContext.tsx` (Task 2D)
- `src/components/HighlightReel.tsx` or `src/App.tsx` (Task 2E)
- `src/components/Header.tsx` (Task 2B)
- `src/components/NavTOC.tsx` (Task 2B)
- `src/components/ThemeSelector.tsx` (Task 2B)

Files **created** (new):
- `skill/references/payload-v2-schema.ts` (Task 1D)
- `src/lib/chart-utils.ts` (Task 2B)
- `src/components/__tests__/InferredSatisfactionChart.test.tsx` (Task 2A)
- `src/components/__tests__/OutcomesChart.test.tsx` (Task 2A)
- `src/components/__tests__/WantedChart.test.tsx` (Task 2A)
- `src/lib/__tests__/payload-validator.test.ts` (Task 1B — extends existing)
- `install.sh` (Task 2G)

Files **deleted:**
- `src/components/CalendarHeatmap.tsx` (Task 1F — after confirming unused)
- `src/components/GlobalInsightsBadge.tsx` (Task 1F)
- `src/components/DateRangeFilter.tsx` (Task 1F)
- `src/lib/computed-insights.ts` (Task 1F)
- `server/session-meta-api.ts` (Task 1F)
- `src/components/ProjectSelector.tsx` (Task 1F — if confirmed unused)

---

## Future Work (Not In This Plan)

These items were identified in the audit but deferred:
- Package as a Claude Code plugin with `manifest.json`
- Schema migration support (handle v1 + v2 payloads)
- Aggregate/team analytics view (multi-payload upload)
- Auto-update checking for skill version
- Full chart accessibility (aria-labels, screen reader descriptions)
- `my-analytics-local` as default distribution path
- Remove legacy dev server path (`server/` directory, `import.meta.env.DEV` branch in App.tsx)
