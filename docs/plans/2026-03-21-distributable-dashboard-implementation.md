# Distributable Analytics Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the local-only analytics dashboard into a distributable skill + hosted web app that any Claude Code user can use to visualize their own usage data.

**Architecture:** A Claude Code custom skill (`/my-analytics`) scans the user's local session files, computes quantitative metrics, generates qualitative insights via Claude, and outputs an `analytics-payload.json` file. A refactored Vercel-hosted React dashboard accepts that payload via drag-and-drop and renders the full analytics experience client-side. The payload schema (`AnalyticsPayloadV2`) is the contract between both sides.

**Tech Stack:** React 18, TypeScript 5.6, Vite 6, Recharts, Tailwind CSS 3, Vitest, react-dropzone (already installed)

**Design doc:** `docs/plans/2026-03-21-distributable-analytics-dashboard-design.md`

---

## Work Streams Overview

This plan has 4 independent work streams. Tasks 1-3 can be executed in parallel. Task 4 depends on all three.

| Stream | Tasks | Can parallelize? |
|--------|-------|-----------------|
| **A: Schema & Types** | Tasks 1-2 | Start first |
| **B: Payload Validator + Mapper** | Tasks 3-6 | After Task 2 |
| **C: Upload UI + App Refactor** | Tasks 7-10 | After Task 5 |
| **D: Integration + Skill** | Tasks 11-13 | After Tasks 6 + 10 |

---

## Task 1: Create the V2 Payload Type Definitions

**Files:**
- Create: `src/types/payload-v2.ts`

**Context:** This file defines the `AnalyticsPayloadV2` interface and all supporting types. It's the shared contract between the skill output and the dashboard input. The complete schema is documented in the design doc at Section 5.

**Step 1: Create the types file**

Create `src/types/payload-v2.ts` with all type definitions from the design doc Section 5 "Payload Schema V2". This includes:

- All union types: `Platform`, `SessionGoal`, `SessionType`, `SessionOutcome`, `SatisfactionBand`, `FrictionType`, `HelpfulFactor`, `ToolErrorCategory`, `BigWinImpactType`, `RecommendationPriority`, `RecommendationEffort`, `ClassificationSource`
- All sub-interfaces: `SessionMetric`, `DailyActivityPoint`, `GoalMetric`, `ToolUsageMetric`, `LanguageMetric`, `ProjectAreaMetric`
- The root `AnalyticsPayloadV2` interface with all nested structures

The complete TypeScript source is in the design doc. Copy it exactly.

**Step 2: Verify TypeScript compiles**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/payload-v2.ts
git commit -m "feat: add AnalyticsPayloadV2 type definitions

Shared contract between the /my-analytics skill and the dashboard.
Includes all enum types, session metrics, and qualitative insight structures."
```

---

## Task 2: Create a Minimal Valid Payload Test Fixture

**Files:**
- Create: `src/test/payload-fixture.ts`

**Context:** We need a realistic test fixture that conforms to `AnalyticsPayloadV2` so all downstream tests have a consistent mock payload to work with. This fixture represents a small but complete dataset: 4 sessions, 2 projects, all sections populated.

**Step 1: Create the fixture file**

Create `src/test/payload-fixture.ts`:

```typescript
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";

export const mockPayloadV2: AnalyticsPayloadV2 = {
  version: "2.0",
  generatedAt: "2026-03-21T12:00:00Z",
  dateRange: { start: "2026-02-19", end: "2026-03-21" },
  platform: "macos",

  source: {
    parserVersion: "1.0.0",
    aggregationVersion: "1.0.0",
    timezone: "America/New_York",
    dateRangeMode: "inclusive",
    rawSessionFilesProcessed: 4,
    rawMessageRecordsProcessed: 28,
    rawToolEventsProcessed: 14,
    filtersApplied: ["last-30-days"],
    excludedSessions: [],
  },

  dataQuality: {
    completenessScore: 95,
    warnings: [],
    inconsistencies: [],
    classificationSummary: {
      heuristicCount: 2,
      aiCount: 1,
      hybridCount: 1,
      unknownFieldRate: 0.05,
    },
  },

  counts: {
    sessionCount: 4,
    projectCount: 2,
  },

  quantitative: {
    overview: {
      totalSessions: 4,
      totalMessages: 12,
      totalToolCalls: 14,
      totalDurationMinutes: 32,
      avgSessionDurationMinutes: 8,
      avgMessagesPerSession: 3,
      avgToolCallsPerSession: 3.5,
      sessionsPerDay: 0.13,
      avgErrorCountPerSession: 0.75,
      avgFrictionScore: 35,
      avgSatisfactionScore: 72,
    },

    sessions: [
      {
        id: "session-001",
        project: "my-app",
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T10:05:00Z",
        durationMinutes: 5,
        messageCount: 4,
        toolCallCount: 3,
        errorCount: 0,
        goal: "bug-fix",
        sessionType: "quick-task",
        outcome: "smooth",
        frictionScore: 10,
        satisfactionScore: 92,
        satisfactionBand: "very-satisfied",
        frictionTypes: [],
        helpfulFactors: ["error-free-tools", "fast-completion"],
        hadWrongApproachCorrection: false,
        hadEnvironmentIssue: false,
        hadToolError: false,
        hadAutonomousExplorationIssue: false,
        model: "claude-sonnet-4-20250514",
        committedCode: true,
        classificationSource: "heuristic",
      },
      {
        id: "session-002",
        project: "my-app",
        startTime: "2026-03-02T14:00:00Z",
        endTime: "2026-03-02T14:10:00Z",
        durationMinutes: 10,
        messageCount: 2,
        toolCallCount: 3,
        errorCount: 0,
        goal: "feature",
        sessionType: "standard",
        outcome: "completed",
        frictionScore: 15,
        satisfactionScore: 85,
        satisfactionBand: "very-satisfied",
        frictionTypes: [],
        helpfulFactors: ["error-free-tools", "concise-interaction"],
        hadWrongApproachCorrection: false,
        hadEnvironmentIssue: false,
        hadToolError: false,
        hadAutonomousExplorationIssue: false,
        model: "claude-sonnet-4-20250514",
        committedCode: true,
        classificationSource: "ai",
      },
      {
        id: "session-003",
        project: "api-server",
        startTime: "2026-03-03T09:00:00Z",
        endTime: "2026-03-03T09:15:00Z",
        durationMinutes: 15,
        messageCount: 4,
        toolCallCount: 6,
        errorCount: 3,
        correctionCount: 1,
        goal: "refactor",
        sessionType: "multi-step",
        outcome: "high-friction",
        frictionScore: 72,
        satisfactionScore: 38,
        satisfactionBand: "frustrated",
        frictionTypes: ["command-failed", "dependency"],
        helpfulFactors: [],
        hadWrongApproachCorrection: true,
        hadEnvironmentIssue: false,
        hadToolError: true,
        hadAutonomousExplorationIssue: false,
        model: "claude-sonnet-4-20250514",
        committedCode: false,
        classificationSource: "hybrid",
      },
      {
        id: "session-004",
        project: "my-app",
        startTime: "2026-03-05T16:00:00Z",
        endTime: "2026-03-05T16:02:00Z",
        durationMinutes: 2,
        messageCount: 2,
        toolCallCount: 2,
        errorCount: 0,
        goal: "explore",
        sessionType: "quick-task",
        outcome: "success",
        frictionScore: 5,
        satisfactionScore: 95,
        satisfactionBand: "very-satisfied",
        frictionTypes: [],
        helpfulFactors: ["fast-completion", "error-free-tools"],
        hadWrongApproachCorrection: false,
        hadEnvironmentIssue: false,
        hadToolError: false,
        hadAutonomousExplorationIssue: false,
        model: "claude-sonnet-4-20250514",
        committedCode: false,
        classificationSource: "heuristic",
      },
    ],

    dailyActivity: [
      { date: "2026-03-01", sessions: 1, messages: 4, toolCalls: 3, errors: 0 },
      { date: "2026-03-02", sessions: 1, messages: 2, toolCalls: 3, errors: 0 },
      { date: "2026-03-03", sessions: 1, messages: 4, toolCalls: 6, errors: 3 },
      { date: "2026-03-05", sessions: 1, messages: 2, toolCalls: 2, errors: 0 },
    ],

    goalDistribution: [
      { goal: "bug-fix", count: 1 },
      { goal: "feature", count: 1 },
      { goal: "refactor", count: 1 },
      { goal: "explore", count: 1 },
    ],

    goalAchievement: {
      fullyAchieved: 2,
      mostlyAchieved: 1,
      partiallyAchieved: 0,
      failed: 1,
      unknown: 0,
    },

    sessionTypes: [
      { type: "quick-task", count: 2 },
      { type: "standard", count: 1 },
      { type: "multi-step", count: 1 },
    ],

    toolUsage: [
      { name: "Read", count: 4, sessionCount: 4, errorCount: 0, errorRate: 0, avgCallsPerSession: 1 },
      { name: "Edit", count: 3, sessionCount: 2, errorCount: 1, errorRate: 0.33, avgCallsPerSession: 1.5 },
      { name: "Bash", count: 4, sessionCount: 2, errorCount: 2, errorRate: 0.5, avgCallsPerSession: 2 },
      { name: "Write", count: 1, sessionCount: 1, errorCount: 0, errorRate: 0, avgCallsPerSession: 1 },
      { name: "Grep", count: 1, sessionCount: 1, errorCount: 0, errorRate: 0, avgCallsPerSession: 1 },
    ],

    toolErrors: {
      byCategory: [
        { category: "command-failed", count: 2 },
        { category: "file-operation", count: 1 },
      ],
      byTool: [
        { tool: "Bash", errorCount: 2 },
        { tool: "Edit", errorCount: 1 },
      ],
    },

    languageStats: [
      { language: "TypeScript", sessionCount: 4, fileCount: 6 },
    ],

    timeOfDay: [
      { bucket: "morning", count: 2 },
      { bucket: "afternoon", count: 2 },
    ],

    responseTiming: {
      distribution: [
        { bucket: "<5s", count: 5 },
        { bucket: "5-15s", count: 6 },
        { bucket: "15-30s", count: 2 },
        { bucket: "30s-1m", count: 1 },
      ],
      avgSeconds: 9.2,
      medianSeconds: 7.0,
      p90Seconds: 22.0,
    },

    projectAreas: [
      {
        name: "Frontend Application",
        description: "Core app development including UI features and bug fixes",
        sessionCount: 3,
        totalMinutes: 17,
        percentageOfTime: 53,
        projects: ["my-app"],
      },
      {
        name: "Backend Infrastructure",
        description: "API server and database work",
        sessionCount: 1,
        totalMinutes: 15,
        percentageOfTime: 47,
        projects: ["api-server"],
      },
    ],

    topProjects: [
      { name: "my-app", sessions: 3, totalMinutes: 17 },
      { name: "api-server", sessions: 1, totalMinutes: 15 },
    ],

    outcomes: [
      { outcome: "smooth", count: 1 },
      { outcome: "completed", count: 1 },
      { outcome: "high-friction", count: 1 },
      { outcome: "success", count: 1 },
    ],

    helpfulFactors: [
      { factor: "error-free-tools", count: 3 },
      { factor: "fast-completion", count: 2 },
      { factor: "concise-interaction", count: 1 },
    ],

    frictionAndSatisfaction: {
      avgFrictionScore: 25.5,
      avgSatisfactionScore: 77.5,
      frictionTypes: [
        { type: "command-failed", count: 1 },
        { type: "dependency", count: 1 },
      ],
      satisfactionBands: [
        { band: "very-satisfied", count: 3 },
        { band: "frustrated", count: 1 },
      ],
    },

    concurrency: {
      parallelUsageDetected: false,
    },
  },

  qualitative: {
    atAGlance: {
      workingFactors: [
        "Clean prompting style leads to efficient sessions",
        "Good tool usage diversity across Read, Edit, and Bash",
      ],
      hinderingFactors: [
        "Dependency issues cause friction in infrastructure work",
        "Error recovery adds unnecessary session length",
      ],
      quickWins: [
        "Add a lockfile check to CLAUDE.md to prevent dependency install failures",
      ],
      ambitiousGoals: [
        "Build a pre-flight environment validator skill",
      ],
    },

    bigWins: [
      {
        title: "Password Hashing Bug Fix",
        description: "Quick, zero-error fix of a critical auth vulnerability in under 5 minutes.",
        sessionRef: "session-001",
        impactType: "quality",
        evidence: ["Zero tool errors", "3 tool calls only", "Committed code"],
      },
      {
        title: "Dark Mode Feature",
        description: "Shipped a complete dark mode toggle with theme system in a single session.",
        sessionRef: "session-002",
        impactType: "delivery",
        evidence: ["Feature complete in 10 minutes", "No errors"],
      },
    ],

    frictionDeepDive: [
      {
        pattern: "Dependency installation failures",
        frequency: "1 in 4 sessions",
        suggestion: "Add --legacy-peer-deps as a default flag in CLAUDE.md Bash rules",
        relatedFrictionTypes: ["command-failed", "dependency"],
        exampleSessionRefs: ["session-003"],
      },
    ],

    usagePatterns: {
      style: "Direct and task-focused. Tends to give clear, specific instructions upfront with minimal back-and-forth.",
      strengths: ["Clear problem statements", "Efficient tool usage", "Good error recovery"],
      growthAreas: ["Consider breaking large refactors into smaller sessions"],
      keyInsight: "Highest productivity when sessions stay under 10 minutes with a single clear goal.",
    },

    recommendations: {
      claudeMdSuggestions: [
        { text: "Add npm install flags to prevent peer dependency conflicts", priority: "high" },
        { text: "Document preferred test runner commands", priority: "medium" },
      ],
      workflowTips: [
        { text: "Use /my-analytics weekly to track friction trends", priority: "medium", effort: "low" },
      ],
      featureSuggestions: [
        { text: "Pre-flight environment check before refactoring sessions", priority: "high", effort: "medium" },
      ],
    },

    onTheHorizon: [
      {
        title: "Multi-Session Project Tracking",
        description: "Track progress across related sessions working on the same feature.",
        tip: "Tag sessions with project milestones in your prompts.",
      },
    ],
  },
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx tsc --noEmit`
Expected: No errors. This confirms the fixture conforms to the schema.

**Step 3: Commit**

```bash
git add src/test/payload-fixture.ts
git commit -m "test: add AnalyticsPayloadV2 mock fixture for testing"
```

---

## Task 3: Create the Payload Validator

**Files:**
- Create: `src/lib/__tests__/payload-validator.test.ts`
- Create: `src/lib/payload-validator.ts`

**Context:** The validator checks uploaded JSON files against the `AnalyticsPayloadV2` schema. It returns structured errors so the UI can show actionable messages. We do runtime validation (not just TypeScript) because the payload comes from an external file.

**Step 1: Write the failing tests**

Create `src/lib/__tests__/payload-validator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validatePayload } from "../payload-validator";
import { mockPayloadV2 } from "../../test/payload-fixture";

describe("validatePayload", () => {
  it("accepts a valid payload", () => {
    const result = validatePayload(mockPayloadV2);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.payload).toBeDefined();
    expect(result.payload!.version).toBe("2.0");
  });

  it("rejects non-object input", () => {
    const result = validatePayload("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Payload must be a JSON object");
  });

  it("rejects null input", () => {
    const result = validatePayload(null);
    expect(result.valid).toBe(false);
  });

  it("rejects missing version field", () => {
    const { version, ...noVersion } = mockPayloadV2;
    const result = validatePayload(noVersion);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("rejects unsupported version", () => {
    const result = validatePayload({ ...mockPayloadV2, version: "99.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("rejects missing quantitative block", () => {
    const { quantitative, ...noQuant } = mockPayloadV2;
    const result = validatePayload(noQuant);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("quantitative"))).toBe(true);
  });

  it("rejects missing qualitative block", () => {
    const { qualitative, ...noQual } = mockPayloadV2;
    const result = validatePayload(noQual);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("qualitative"))).toBe(true);
  });

  it("rejects missing sessions array", () => {
    const bad = {
      ...mockPayloadV2,
      quantitative: { ...mockPayloadV2.quantitative, sessions: undefined },
    };
    const result = validatePayload(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("sessions"))).toBe(true);
  });

  it("warns on session count mismatch", () => {
    const bad = {
      ...mockPayloadV2,
      counts: { ...mockPayloadV2.counts, sessionCount: 999 },
    };
    const result = validatePayload(bad);
    // Mismatch is a warning, not a hard failure
    expect(result.warnings.some((w) => w.includes("count"))).toBe(true);
  });

  it("accepts payload with optional artifacts", () => {
    const withArtifacts = {
      ...mockPayloadV2,
      artifacts: [
        { type: "skill" as const, title: "Test skill", content: "content here" },
      ],
    };
    const result = validatePayload(withArtifacts);
    expect(result.valid).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run src/lib/__tests__/payload-validator.test.ts`
Expected: FAIL — module `../payload-validator` not found

**Step 3: Implement the validator**

Create `src/lib/payload-validator.ts`:

```typescript
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";

export interface ValidationResult {
  valid: boolean;
  payload?: AnalyticsPayloadV2;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that an unknown JSON value conforms to the AnalyticsPayloadV2 schema.
 * Returns structured errors/warnings for UI display.
 */
export function validatePayload(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must be a non-null object
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Payload must be a JSON object"], warnings };
  }

  const obj = input as Record<string, unknown>;

  // Version check
  if (!obj.version) {
    errors.push('Missing required field: "version"');
  } else if (obj.version !== "2.0") {
    errors.push(
      `Unsupported payload version: "${obj.version}". Expected "2.0".`
    );
  }

  // Required top-level fields
  const requiredTopLevel = [
    "generatedAt",
    "dateRange",
    "platform",
    "source",
    "dataQuality",
    "counts",
    "quantitative",
    "qualitative",
  ];

  for (const field of requiredTopLevel) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // If we're already missing critical fields, bail early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const quant = obj.quantitative as Record<string, unknown>;
  const qual = obj.qualitative as Record<string, unknown>;
  const counts = obj.counts as Record<string, unknown>;

  // Quantitative sub-fields
  const requiredQuantFields = [
    "overview",
    "sessions",
    "dailyActivity",
    "goalDistribution",
    "toolUsage",
    "timeOfDay",
    "responseTiming",
    "topProjects",
    "outcomes",
    "helpfulFactors",
    "frictionAndSatisfaction",
  ];

  for (const field of requiredQuantFields) {
    if (quant[field] === undefined || quant[field] === null) {
      errors.push(`Missing required field: "quantitative.${field}"`);
    }
  }

  // Sessions must be an array
  if (quant.sessions !== undefined && !Array.isArray(quant.sessions)) {
    errors.push('"quantitative.sessions" must be an array');
  }

  // Qualitative sub-fields
  const requiredQualFields = [
    "atAGlance",
    "bigWins",
    "frictionDeepDive",
    "usagePatterns",
    "recommendations",
  ];

  for (const field of requiredQualFields) {
    if (qual[field] === undefined || qual[field] === null) {
      errors.push(`Missing required field: "qualitative.${field}"`);
    }
  }

  // Consistency warnings (not hard failures)
  if (
    Array.isArray(quant.sessions) &&
    typeof counts.sessionCount === "number" &&
    quant.sessions.length !== counts.sessionCount
  ) {
    warnings.push(
      `Session count mismatch: counts.sessionCount is ${counts.sessionCount} but quantitative.sessions has ${quant.sessions.length} entries`
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    payload: input as AnalyticsPayloadV2,
    errors,
    warnings,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run src/lib/__tests__/payload-validator.test.ts`
Expected: All 10 tests PASS

**Step 5: Commit**

```bash
git add src/lib/payload-validator.ts src/lib/__tests__/payload-validator.test.ts
git commit -m "feat: add payload validator for AnalyticsPayloadV2 uploads

Runtime validation of uploaded JSON files with structured errors
and consistency warnings for the upload UI."
```

---

## Task 4: Create the Payload-to-DashboardData Mapper

**Files:**
- Create: `src/lib/__tests__/payload-mapper.test.ts`
- Create: `src/lib/payload-mapper.ts`

**Context:** The mapper transforms `AnalyticsPayloadV2` (from the skill) into the existing `DashboardData` interface (that all chart components already consume). This is the key bridge — it means zero changes to any existing chart component.

**Important:** Read these files before starting to understand the exact target shapes:
- `src/lib/types.ts` — `DashboardData` and all its sub-interfaces (lines 160-193)
- `src/lib/insights-types.ts` — `InsightsReport` interface (lines 6-74)

**Step 1: Write the failing tests**

Create `src/lib/__tests__/payload-mapper.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  mapPayloadToDashboardData,
  mapPayloadToInsightsReport,
} from "../payload-mapper";
import { mockPayloadV2 } from "../../test/payload-fixture";
import type { DashboardData } from "../types";
import type { InsightsReport } from "../insights-types";

describe("mapPayloadToDashboardData", () => {
  let data: DashboardData;

  beforeAll(() => {
    data = mapPayloadToDashboardData(mockPayloadV2);
  });

  it("maps sessions with correct count", () => {
    expect(data.sessions).toHaveLength(4);
  });

  it("maps session fields to AnalyzedSession shape", () => {
    const s = data.sessions[0];
    expect(s.id).toBe("session-001");
    expect(s.date).toBe("2026-03-01");
    expect(s.durationMs).toBe(300000); // 5 min * 60000
    expect(s.messageCount).toBe(4);
    expect(s.toolCallCount).toBe(3);
    expect(s.toolErrorCount).toBe(0);
    expect(s.goalCategory).toBe("bug-fix");
    expect(s.frictionScore).toBe(10);
    expect(s.satisfactionScore).toBe(92);
    expect(s.model).toBe("claude-sonnet-4-20250514");
  });

  it("maps sessionMetrics", () => {
    expect(data.sessionMetrics.totalSessions).toBe(4);
    expect(data.sessionMetrics.totalMessages).toBe(12);
    expect(data.sessionMetrics.totalToolCalls).toBe(14);
  });

  it("maps toolUsageStats", () => {
    expect(data.toolUsageStats.length).toBeGreaterThan(0);
    const readTool = data.toolUsageStats.find((t) => t.tool === "Read");
    expect(readTool).toBeDefined();
    expect(readTool!.count).toBe(4);
    expect(readTool!.errorRate).toBe(0);
  });

  it("maps goalDistribution with percentages", () => {
    expect(data.goalDistribution).toHaveLength(4);
    const sum = data.goalDistribution.reduce((s, d) => s + d.percentage, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it("maps frictionOverTime sorted by date", () => {
    expect(data.frictionOverTime).toHaveLength(4);
    for (let i = 1; i < data.frictionOverTime.length; i++) {
      expect(
        data.frictionOverTime[i].date >= data.frictionOverTime[i - 1].date
      ).toBe(true);
    }
  });

  it("maps dailyMetrics", () => {
    expect(data.dailyMetrics.length).toBeGreaterThan(0);
    expect(data.dailyMetrics[0].date).toBe("2026-03-01");
  });

  it("maps all expanded chart data arrays", () => {
    expect(data.languageStats.length).toBeGreaterThan(0);
    expect(data.sessionTypeStats.length).toBeGreaterThan(0);
    expect(data.timeOfDayBuckets.length).toBeGreaterThan(0);
    expect(data.toolErrorStats.length).toBeGreaterThan(0);
    expect(data.helpfulFactorStats.length).toBeGreaterThan(0);
    expect(data.outcomeStats.length).toBeGreaterThan(0);
    expect(data.frictionTypeStats.length).toBeGreaterThan(0);
    expect(data.inferredSatisfaction.length).toBeGreaterThan(0);
  });
});

describe("mapPayloadToInsightsReport", () => {
  let report: InsightsReport;

  beforeAll(() => {
    report = mapPayloadToInsightsReport(mockPayloadV2);
  });

  it("maps atAGlance fields", () => {
    expect(report.atAGlance.working.length).toBeGreaterThan(0);
    expect(report.atAGlance.hindering.length).toBeGreaterThan(0);
    expect(report.atAGlance.quickWins.length).toBeGreaterThan(0);
    expect(report.atAGlance.ambitious.length).toBeGreaterThan(0);
  });

  it("maps bigWins", () => {
    expect(report.bigWins.length).toBeGreaterThan(0);
    expect(report.bigWins[0].title).toBeTruthy();
    expect(report.bigWins[0].description).toBeTruthy();
  });

  it("maps frictionCategories", () => {
    expect(report.frictionCategories.length).toBeGreaterThan(0);
  });

  it("maps projectAreas", () => {
    expect(report.projectAreas.length).toBeGreaterThan(0);
    expect(report.projectAreas[0].name).toBeTruthy();
  });

  it("maps recommendations to featureRecommendations", () => {
    expect(report.featureRecommendations.length).toBeGreaterThan(0);
  });

  it("maps usagePatterns", () => {
    expect(report.usagePatterns.length).toBeGreaterThan(0);
  });

  it("maps horizonIdeas from onTheHorizon", () => {
    expect(report.horizonIdeas.length).toBeGreaterThan(0);
  });

  it("maps generatedAt and dateRange", () => {
    expect(report.generatedAt).toBe("2026-03-21T12:00:00Z");
    expect(report.dateRange.start).toBe("2026-02-19");
  });

  it("maps sessionCount", () => {
    expect(report.sessionCount).toBe(4);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run src/lib/__tests__/payload-mapper.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the mapper**

Create `src/lib/payload-mapper.ts`:

```typescript
import type { AnalyticsPayloadV2, SessionMetric } from "@/types/payload-v2";
import type {
  DashboardData,
  AnalyzedSession,
  SessionMetrics,
  ToolUsageStat,
  GoalDistribution,
  FrictionDataPoint,
  SatisfactionDataPoint,
  DailyMetric,
  LanguageStat,
  SessionTypeStat,
  ResponseTimeBucket,
  TimeOfDayBucket,
  ToolErrorStat,
  HelpfulFactorStat,
  OutcomeStat,
  FrictionTypeStat,
  InferredSatisfaction,
  GoalCategory,
} from "./types";
import type { InsightsReport } from "./insights-types";

/**
 * Maps an AnalyticsPayloadV2 to the existing DashboardData interface
 * consumed by all chart components. This is the bridge that lets us
 * keep every chart component unchanged.
 */
export function mapPayloadToDashboardData(
  payload: AnalyticsPayloadV2
): DashboardData {
  const { quantitative: q } = payload;

  const sessions: AnalyzedSession[] = q.sessions.map(mapSessionMetricToAnalyzed);

  const sessionMetrics: SessionMetrics = {
    totalSessions: q.overview.totalSessions,
    avgDurationMs: q.overview.avgSessionDurationMinutes * 60_000,
    sessionsPerDay: Object.fromEntries(
      q.dailyActivity.map((d) => [d.date, d.sessions])
    ),
    totalMessages: q.overview.totalMessages,
    totalToolCalls: q.overview.totalToolCalls,
  };

  const toolUsageStats: ToolUsageStat[] = q.toolUsage.map((t) => ({
    tool: t.name,
    count: t.count,
    errorCount: t.errorCount,
    errorRate: t.errorRate,
    avgDurationMs: (t.avgDurationSeconds ?? 0) * 1000,
  }));

  const totalSessions = q.overview.totalSessions;
  const goalDistribution: GoalDistribution[] = q.goalDistribution.map((g) => ({
    category: mapGoal(g.goal),
    count: g.count,
    percentage: totalSessions > 0 ? (g.count / totalSessions) * 100 : 0,
  }));

  const frictionOverTime: FrictionDataPoint[] = q.sessions
    .map((s) => ({
      date: s.startTime.slice(0, 10),
      score: s.frictionScore,
      sessionId: s.id,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const satisfactionDistribution: SatisfactionDataPoint[] = q.sessions.map(
    (s) => ({
      score: s.satisfactionScore,
      sessionId: s.id,
      date: s.startTime.slice(0, 10),
    })
  );

  const dailyMetrics: DailyMetric[] = q.dailyActivity.map((d) => ({
    date: d.date,
    sessions: d.sessions,
    messages: d.messages,
    toolCalls: d.toolCalls,
    toolErrors: d.errors,
    avgFriction: computeAvgForDate(q.sessions, d.date, "frictionScore"),
    avgSatisfaction: computeAvgForDate(q.sessions, d.date, "satisfactionScore"),
  }));

  const languageStats: LanguageStat[] = q.languageStats.map((l) => ({
    language: l.language,
    fileCount: l.fileCount,
  }));

  const sessionTypeStats: SessionTypeStat[] = q.sessionTypes.map((s) => ({
    type: s.type,
    count: s.count,
  }));

  const responseTimeBuckets: ResponseTimeBucket[] =
    q.responseTiming.distribution.map((r) => ({
      range: r.bucket,
      count: r.count,
      medianMs: q.responseTiming.medianSeconds * 1000,
    }));

  const timeOfDayBuckets: TimeOfDayBucket[] = q.timeOfDay.map((t) => ({
    period: t.bucket,
    count: t.count,
    hours: bucketToHours(t.bucket),
  }));

  const toolErrorStats: ToolErrorStat[] = q.toolErrors.byCategory.map((e) => ({
    errorType: e.category,
    count: e.count,
  }));

  const helpfulFactorStats: HelpfulFactorStat[] = q.helpfulFactors.map(
    (h) => ({
      factor: h.factor,
      count: h.count,
    })
  );

  const outcomeStats: OutcomeStat[] = q.outcomes.map((o) => ({
    outcome: o.outcome,
    count: o.count,
  }));

  const frictionTypeStats: FrictionTypeStat[] =
    q.frictionAndSatisfaction.frictionTypes.map((f) => ({
      type: f.type,
      count: f.count,
    }));

  const inferredSatisfaction: InferredSatisfaction[] =
    q.frictionAndSatisfaction.satisfactionBands.map((s) => ({
      level: s.band,
      count: s.count,
    }));

  return {
    sessions,
    sessionMetrics,
    toolUsageStats,
    goalDistribution,
    frictionOverTime,
    satisfactionDistribution,
    dailyMetrics,
    languageStats,
    sessionTypeStats,
    responseTimeBuckets,
    timeOfDayBuckets,
    toolErrorStats,
    helpfulFactorStats,
    outcomeStats,
    frictionTypeStats,
    inferredSatisfaction,
  };
}

/**
 * Maps an AnalyticsPayloadV2 to the existing InsightsReport interface
 * consumed by all narrative/qualitative components.
 */
export function mapPayloadToInsightsReport(
  payload: AnalyticsPayloadV2
): InsightsReport {
  const { qualitative: q, quantitative: quant } = payload;

  return {
    generatedAt: payload.generatedAt,
    dateRange: payload.dateRange,
    sessionCount: payload.counts.sessionCount,

    atAGlance: {
      working: q.atAGlance.workingFactors,
      hindering: q.atAGlance.hinderingFactors,
      quickWins: q.atAGlance.quickWins,
      ambitious: q.atAGlance.ambitiousGoals,
    },

    projectAreas: quant.projectAreas.map((p) => ({
      name: p.name,
      sessionCount: p.sessionCount,
      description: p.description,
    })),

    usageNarrative: {
      paragraphs: [q.usagePatterns.style],
      keyInsight: q.usagePatterns.keyInsight ?? q.usagePatterns.style,
    },

    multiClauding: {
      detected: quant.concurrency.parallelUsageDetected,
      details: quant.concurrency.overlappingSessionCount
        ? `${quant.concurrency.overlappingSessionCount} overlapping sessions detected`
        : "No parallel usage detected",
    },

    bigWins: q.bigWins.map((b) => ({
      title: b.title,
      description: b.description,
    })),

    frictionCategories: q.frictionDeepDive.map((f) => ({
      title: f.pattern,
      description: f.suggestion,
      examples: f.exampleSessionRefs ?? [],
    })),

    claudeMdSuggestions: q.recommendations.claudeMdSuggestions.map(
      (s, i) => ({
        id: `cmd-${i}`,
        text: s.text,
      })
    ),

    featureRecommendations: q.recommendations.featureSuggestions.map((f) => ({
      title: f.text,
      description: `Priority: ${f.priority}, Effort: ${f.effort}`,
    })),

    usagePatterns: [
      ...q.usagePatterns.strengths.map((s) => ({
        title: "Strength",
        summary: s,
        detail: s,
        prompt: "",
      })),
      ...q.usagePatterns.growthAreas.map((g) => ({
        title: "Growth Area",
        summary: g,
        detail: g,
        prompt: "",
      })),
    ],

    horizonIdeas: (q.onTheHorizon ?? []).map((h) => ({
      title: h.title,
      possible: h.description,
      tip: h.tip ?? "",
      prompt: "",
    })),

    funEnding: {
      headline: "Keep building!",
      detail: `Analyzed ${payload.counts.sessionCount} sessions across ${payload.counts.projectCount} projects.`,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────

function mapSessionMetricToAnalyzed(s: SessionMetric): AnalyzedSession {
  // Map V2 SessionGoal to existing GoalCategory
  // The existing GoalCategory is a subset — map extended goals to "unknown"
  const goalCategory = mapGoal(s.goal);

  // Build toolUsage record from the session's tool data
  // We don't have per-session tool breakdown in SessionMetric,
  // so provide an empty record (charts use the aggregate toolUsageStats instead)
  const toolUsage: Record<string, { count: number; errors: number }> = {};

  return {
    id: s.id,
    date: s.startTime.slice(0, 10),
    durationMs: s.durationMinutes * 60_000,
    messageCount: s.messageCount,
    toolCallCount: s.toolCallCount,
    toolErrorCount: s.errorCount,
    goalCategory,
    frictionScore: s.frictionScore,
    satisfactionScore: s.satisfactionScore,
    model: s.model,
    toolUsage,
  };
}

/**
 * Maps the V2 expanded SessionGoal to the existing GoalCategory type.
 * Goals not in the original enum map to "unknown".
 */
function mapGoal(
  goal: string
): GoalCategory {
  const validGoals: GoalCategory[] = [
    "bug-fix",
    "feature",
    "refactor",
    "explore",
    "config",
    "docs",
    "test",
    "unknown",
  ];
  return validGoals.includes(goal as GoalCategory)
    ? (goal as GoalCategory)
    : "unknown";
}

function computeAvgForDate(
  sessions: SessionMetric[],
  date: string,
  field: "frictionScore" | "satisfactionScore"
): number {
  const matching = sessions.filter((s) => s.startTime.slice(0, 10) === date);
  if (matching.length === 0) return 0;
  return matching.reduce((sum, s) => sum + s[field], 0) / matching.length;
}

function bucketToHours(bucket: string): number[] {
  switch (bucket) {
    case "morning":
      return [6, 7, 8, 9, 10, 11];
    case "afternoon":
      return [12, 13, 14, 15, 16, 17];
    case "evening":
      return [18, 19, 20, 21];
    case "night":
      return [22, 23, 0, 1, 2, 3, 4, 5];
    default:
      return [];
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run src/lib/__tests__/payload-mapper.test.ts`
Expected: All tests PASS

**Step 5: Run the full test suite to check for regressions**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run`
Expected: All existing tests still pass

**Step 6: Commit**

```bash
git add src/lib/payload-mapper.ts src/lib/__tests__/payload-mapper.test.ts
git commit -m "feat: add payload-to-DashboardData mapper

Bridges AnalyticsPayloadV2 to existing DashboardData and InsightsReport
interfaces so all chart components work unchanged with uploaded payloads."
```

---

## Task 5: Create the UploadZone Component

**Files:**
- Create: `src/components/UploadZone.tsx`

**Context:** This is the landing page users see when they visit the dashboard URL without data loaded. It uses `react-dropzone` (already a dependency) for file upload. On successful upload + validation, it calls a callback with the parsed payload.

**Important:** Read these files before starting:
- `src/context/ThemeContext.tsx` — for `useTheme()` hook and theme color tokens
- `src/components/Header.tsx` — for visual style reference

**Step 1: Create the component**

Create `src/components/UploadZone.tsx`:

```tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTheme } from "@/context/ThemeContext";
import { validatePayload, type ValidationResult } from "@/lib/payload-validator";
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";

interface UploadZoneProps {
  onPayloadLoaded: (payload: AnalyticsPayloadV2) => void;
}

export function UploadZone({ onPayloadLoaded }: UploadZoneProps) {
  const { theme } = useTheme();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parsing, setParsing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setParsing(true);
      setValidation(null);

      try {
        const text = await file.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          setValidation({
            valid: false,
            errors: ["File is not valid JSON. Make sure you're uploading the analytics-payload.json file."],
            warnings: [],
          });
          setParsing(false);
          return;
        }

        const result = validatePayload(json);
        setValidation(result);

        if (result.valid && result.payload) {
          onPayloadLoaded(result.payload);
        }
      } catch (err) {
        setValidation({
          valid: false,
          errors: [`Failed to read file: ${err instanceof Error ? err.message : "Unknown error"}`],
          warnings: [],
        });
      } finally {
        setParsing(false);
      }
    },
    [onPayloadLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: false,
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      <h1
        className="text-4xl font-bold mb-2"
        style={{ color: theme.colors.primary }}
      >
        Claude Usage Analytics
      </h1>
      <p className="text-lg mb-8 opacity-70">
        Insights into how you work with Claude Code
      </p>

      <div
        {...getRootProps()}
        className={`
          w-full max-w-lg p-12 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200 text-center
          ${isDragActive ? "scale-[1.02]" : "hover:scale-[1.01]"}
        `}
        style={{
          borderColor: isDragActive
            ? theme.colors.primary
            : theme.colors.border ?? theme.colors.text + "33",
          background: isDragActive
            ? theme.colors.primary + "10"
            : theme.colors.card ?? theme.colors.background,
        }}
      >
        <input {...getInputProps()} />
        {parsing ? (
          <p className="text-lg">Validating payload...</p>
        ) : isDragActive ? (
          <p className="text-lg" style={{ color: theme.colors.primary }}>
            Drop your payload here
          </p>
        ) : (
          <>
            <p className="text-lg mb-2">
              Drop your <code className="font-mono font-bold">analytics-payload.json</code> here
            </p>
            <p className="text-sm opacity-60">or click to browse</p>
          </>
        )}
      </div>

      {validation && !validation.valid && (
        <div
          className="w-full max-w-lg mt-6 p-4 rounded-xl"
          style={{
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          <p className="font-bold mb-2">Validation failed:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation?.warnings && validation.warnings.length > 0 && (
        <div
          className="w-full max-w-lg mt-4 p-4 rounded-xl"
          style={{
            background: "#fef3c7",
            color: "#92400e",
          }}
        >
          <p className="font-bold mb-2">Warnings:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 text-center opacity-60">
        <p className="text-sm mb-1">Don't have a payload yet?</p>
        <p className="text-sm">
          Run{" "}
          <code
            className="font-mono px-2 py-1 rounded"
            style={{ background: theme.colors.primary + "20" }}
          >
            /my-analytics
          </code>{" "}
          in Claude Code to generate one.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/UploadZone.tsx
git commit -m "feat: add UploadZone drag-and-drop landing component

Accepts analytics-payload.json files, validates against V2 schema,
shows structured error messages on failure."
```

---

## Task 6: Refactor App.tsx for Upload-First Data Flow

**Files:**
- Modify: `src/App.tsx`

**Context:** Currently App.tsx auto-fetches from `/api/sessions` on mount. We need to add an "upload" state that shows the UploadZone first, then transitions to the dashboard when a valid payload is loaded. Dev mode should still auto-fetch for the maintainer's local workflow.

**Important:** Read these files before starting:
- `src/App.tsx` — the full file, all ~409 lines
- `src/lib/payload-mapper.ts` — the mapper you created in Task 4
- `src/components/UploadZone.tsx` — the component you created in Task 5

**Step 1: Modify App.tsx**

Add the new imports near the top of `src/App.tsx` (after the existing imports):

```typescript
import { UploadZone } from "@/components/UploadZone";
import {
  mapPayloadToDashboardData,
  mapPayloadToInsightsReport,
} from "@/lib/payload-mapper";
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";
```

Replace the current state declarations and data loading logic (approximately lines 52-98) with:

```typescript
export default function App() {
  const [rawSessions, setRawSessions] = useState<RawSession[]>([]);
  const [insights, setInsights] = useState<InsightsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Payload-driven state (for uploaded files)
  const [uploadedPayload, setUploadedPayload] =
    useState<AnalyticsPayloadV2 | null>(null);

  // In dev mode, auto-fetch from local API (backward compatible)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    setLoading(true);

    async function loadData() {
      try {
        const [sessionsRes, insightsData] = await Promise.all([
          fetch("/api/sessions").then((r) =>
            r.ok
              ? r.json()
              : Promise.reject(new Error(`Sessions: ${r.status}`))
          ),
          fetchInsights(),
        ]);
        if (!cancelled) {
          if (Array.isArray(sessionsRes.sessions)) {
            setRawSessions(sessionsRes.sessions);
          }
          if (insightsData) {
            setInsights(insightsData);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Dev auto-fetch failed (expected in production):", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle payload upload
  const handlePayloadLoaded = useCallback(
    (payload: AnalyticsPayloadV2) => {
      setUploadedPayload(payload);
      // Clear any raw session data to use payload data instead
      setRawSessions([]);
      setInsights(null);
    },
    []
  );

  // Handle "load different file" — reset to upload state
  const handleReset = useCallback(() => {
    setUploadedPayload(null);
    setRawSessions([]);
    setInsights(null);
    setError(null);
  }, []);

  // Compute dashboard data from whichever source is active
  const dashboardData: DashboardData | null = useMemo(() => {
    if (uploadedPayload) {
      return mapPayloadToDashboardData(uploadedPayload);
    }
    return rawSessions.length > 0 ? buildDashboardData(rawSessions) : null;
  }, [uploadedPayload, rawSessions]);

  // Compute insights from whichever source is active
  const activeInsights: InsightsReport | null = useMemo(() => {
    if (uploadedPayload) {
      return mapPayloadToInsightsReport(uploadedPayload);
    }
    return insights;
  }, [uploadedPayload, insights]);

  // Compute date range
  const sessionDateRange = useMemo(() => {
    if (uploadedPayload) {
      return uploadedPayload.dateRange;
    }
    if (rawSessions.length === 0) return null;
    let min = rawSessions[0].timestamp;
    let max = rawSessions[0].timestamp;
    for (const s of rawSessions) {
      if (s.timestamp < min) min = s.timestamp;
      if (s.timestamp > max) max = s.timestamp;
    }
    return { start: min.slice(0, 10), end: max.slice(0, 10) };
  }, [uploadedPayload, rawSessions]);

  // Show upload zone if no data is loaded (production) or still loading (dev)
  const hasData = dashboardData !== null;

  if (!hasData && !loading) {
    return <UploadZone onPayloadLoaded={handlePayloadLoaded} />;
  }
```

Then in the JSX, wherever `insights` is currently referenced, replace with `activeInsights`. And wherever `handleRefresh` is referenced, ensure `handleReset` is available (add a "Load different file" button to the Header or NavTOC area).

**Key changes summary:**
- `loading` starts as `false` (not `true`) — upload-first in production
- Dev mode auto-fetch is gated behind `import.meta.env.DEV`
- New `uploadedPayload` state drives an alternate data path
- `dashboardData` and `activeInsights` are computed from whichever source is active
- When no data is loaded, show `UploadZone` instead of the dashboard
- All existing component rendering remains identical — they receive the same `DashboardData` and `InsightsReport` props

**Step 2: Update insights references**

Search for all references to the `insights` variable in the JSX rendering section of App.tsx and replace with `activeInsights`. Common patterns:

```
insights?.atAGlance  →  activeInsights?.atAGlance
insights?.bigWins    →  activeInsights?.bigWins
{insights && ...}    →  {activeInsights && ...}
```

**Step 3: Add reset button to Header area**

In the Header or top navigation area, add:

```tsx
{uploadedPayload && (
  <button
    onClick={handleReset}
    className="text-sm opacity-60 hover:opacity-100 transition-opacity"
  >
    Load different file
  </button>
)}
```

**Step 4: Remove the old `handleRefresh` function**

The `handleRefresh` callback (which re-fetched from `/api/sessions`) is no longer needed in production. You can keep it for dev mode or remove it entirely. If any component references it, gate it behind `import.meta.env.DEV`.

**Step 5: Verify TypeScript compiles**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx tsc --noEmit`
Expected: No errors

**Step 6: Run the full test suite**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: refactor App.tsx for upload-first data flow

Production shows UploadZone landing page; dev mode still auto-fetches.
Payload mapper bridges uploaded data to existing component interfaces."
```

---

## Task 7: Manual Smoke Test — Upload Flow

**No files to create. This is a verification task.**

**Step 1: Start the dev server**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run dev`

**Step 2: Test the upload flow in a browser**

1. Open the Vite dev URL (likely `http://localhost:5173`)
2. In dev mode, the dashboard may auto-load from local APIs. That's expected and confirms backward compatibility.
3. To test the upload flow, temporarily comment out the dev auto-fetch `useEffect` in App.tsx, or test in a production build:

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run build && npm run preview`

4. Open the preview URL. You should see the UploadZone landing page.
5. Create a test payload file from the fixture:

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && node -e "const f = require('./src/test/payload-fixture'); require('fs').writeFileSync('/tmp/test-payload.json', JSON.stringify(f.mockPayloadV2, null, 2))"`

Note: This may not work directly due to TypeScript/ESM. Alternative — create a simple JSON file manually or use the `mockPayloadV2` object from the fixture.

6. Drag and drop the test payload onto the upload zone.
7. Verify the dashboard renders with the mock data.
8. Check: all chart sections render without errors, qualitative sections show content, no console errors.

**Step 3: Test error cases**

1. Drop a non-JSON file → should show "File is not valid JSON" error
2. Drop a JSON file with wrong structure → should show specific validation errors
3. Drop a valid payload → dashboard should render

**Step 4: Revert any temporary changes and commit nothing** (this was a verification task)

---

## Task 8: Build the Vite Export Script for Test Payload

**Files:**
- Create: `scripts/export-test-payload.ts`

**Context:** A simple script that writes the mock payload fixture to a JSON file, useful for testing the upload flow and for generating sample payloads to share with pilot users.

**Step 1: Create the script**

Create `scripts/export-test-payload.ts`:

```typescript
/**
 * Exports the test payload fixture as a standalone JSON file.
 * Usage: npx tsx scripts/export-test-payload.ts [output-path]
 */
import { mockPayloadV2 } from "../src/test/payload-fixture";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = process.argv[2] ?? resolve(__dirname, "../test-payload.json");
writeFileSync(outputPath, JSON.stringify(mockPayloadV2, null, 2));
console.log(`Test payload written to: ${outputPath}`);
```

**Step 2: Add a script to package.json**

Add to the `"scripts"` section of `package.json`:

```json
"export-test-payload": "tsx scripts/export-test-payload.ts"
```

Note: If `tsx` is not installed, install it as a dev dependency:
Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm install -D tsx`

**Step 3: Test the script**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run export-test-payload`
Expected: `Test payload written to: /Users/josh/Documents/Ren Projects/Usage Analytics Dashboard/test-payload.json`

Verify the file exists and is valid JSON:
Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && node -e "JSON.parse(require('fs').readFileSync('test-payload.json', 'utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 4: Add test-payload.json to .gitignore**

Add this line to `.gitignore`:
```
test-payload.json
```

**Step 5: Commit**

```bash
git add scripts/export-test-payload.ts package.json .gitignore
git commit -m "chore: add test payload export script for upload flow testing"
```

---

## Task 9: Create the `/my-analytics` Skill File

**Files:**
- Create: `skill/my-analytics.md`

**Context:** This is the Claude Code custom skill that users install and invoke with `/my-analytics`. It's a Markdown file with YAML frontmatter that contains structured instructions for Claude to execute the 4-phase analysis pipeline. The skill tells Claude what to scan, how to compute metrics, what qualitative analysis to generate, and how to output the payload.

**Important:** Read the design doc Section 6 ("Skill Design") for the complete phase specifications, heuristic algorithms, and sampling strategy.

**Step 1: Create the skill directory and file**

Run: `mkdir -p "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard/skill"`

Create `skill/my-analytics.md`:

````markdown
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
   open "https://claude-analytics.vercel.app"
   ```

7. Tell the user: "Dashboard opened. Drag and drop your analytics-payload.json file onto the upload zone."

---

## AnalyticsPayloadV2 Schema Reference

The output JSON must conform to this TypeScript schema:

```typescript
// [Include the complete contents of src/types/payload-v2.ts here]
// This will be filled in during implementation from the actual types file.
```

## Important Notes

- **Privacy:** Never include raw conversation content, full file paths, or API keys in the payload. Only include derived analytics, sanitized project names (directory name only), and session IDs.
- **Project name sanitization:** Extract only the final directory component from cwd paths. `/Users/josh/Documents/my-project` becomes `my-project`.
- **Rates vs scores:** Error rates use 0.0-1.0 (proportions). Scores use 0-100 (integers).
- **Timestamps:** All timestamps must be ISO 8601 format.
- **Token budget:** Keep Phase 3 focused on the 15 sampled sessions to control token usage.
````

**Step 2: Verify the file is well-formed**

Visually inspect the Markdown renders correctly and the YAML frontmatter is valid.

**Step 3: Commit**

```bash
git add skill/my-analytics.md
git commit -m "feat: add /my-analytics Claude Code skill

Custom skill that scans local session files, computes quantitative
metrics with heuristic classification, generates AI qualitative
insights, and outputs an AnalyticsPayloadV2 JSON file."
```

---

## Task 10: Inline the Schema into the Skill File

**Files:**
- Modify: `skill/my-analytics.md`

**Context:** The skill file references the schema but contains a placeholder. We need to inline the actual TypeScript types so Claude has the complete schema when executing the skill.

**Step 1: Read the types file**

Read `src/types/payload-v2.ts` to get the complete contents.

**Step 2: Replace the placeholder**

In `skill/my-analytics.md`, find the placeholder comment:
```
// [Include the complete contents of src/types/payload-v2.ts here]
// This will be filled in during implementation from the actual types file.
```

Replace it with the complete contents of `src/types/payload-v2.ts`.

**Step 3: Commit**

```bash
git add skill/my-analytics.md
git commit -m "chore: inline complete V2 schema into skill file"
```

---

## Task 11: Run Full Test Suite and Build Verification

**No files to create. This is a verification task.**

**Step 1: Run all tests**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vitest run`
Expected: All tests pass (existing + new)

**Step 2: Run TypeScript check**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx tsc --noEmit`
Expected: No errors

**Step 3: Run production build**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run build`
Expected: Build succeeds, output in `dist/`

**Step 4: Run production preview**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run preview`
Expected: Opens on a local port. Navigate to it and verify:
- Upload zone is shown (production mode, no dev API)
- No console errors
- Drag-and-drop area is visible and interactive

**Step 5: Test with exported payload**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npm run export-test-payload`
Then drag `test-payload.json` onto the upload zone in the browser preview.
Expected: Dashboard renders with mock data across all sections.

---

## Task 12: Update Vercel Configuration and Deploy

**Files:**
- Modify: `vercel.json` (if needed)

**Step 1: Verify vercel.json is correct**

Read `vercel.json`. It should already be configured for Vite static builds:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

No changes should be needed. The dashboard is already a static SPA.

**Step 2: Deploy to Vercel**

Run: `cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard" && npx vercel --prod`

Or push to the main branch if auto-deploy is configured.

**Step 3: Verify production deployment**

Visit the Vercel URL and confirm:
- Upload zone landing page loads
- No console errors
- Upload flow works with the test payload

---

## Task 13: Write Pilot User Instructions

**Files:**
- Create: `docs/PILOT-GUIDE.md`

**Step 1: Create the guide**

Create `docs/PILOT-GUIDE.md`:

```markdown
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
```

**Step 2: Commit**

```bash
git add docs/PILOT-GUIDE.md
git commit -m "docs: add pilot user guide for analytics dashboard"
```

---

## Summary: Task Dependency Graph

```
Task 1: Schema Types ─────────┐
                               ├─→ Task 3: Validator ─────┐
Task 2: Test Fixture ─────────┤                            │
                               ├─→ Task 4: Mapper ─────────┤
                               │                            │
                               │   Task 5: UploadZone ─────┤
                               │                            │
                               │         Task 6: App.tsx ───┤
                               │                            │
                               │   Task 7: Smoke Test ──────┤
                               │                            │
                               │   Task 8: Export Script ───┤
                               │                            │
                               ├─→ Task 9: Skill File ─────┤
                               │                            │
                               └─→ Task 10: Inline Schema ─┤
                                                            │
                                   Task 11: Full Verify ────┤
                                                            │
                                   Task 12: Deploy ─────────┤
                                                            │
                                   Task 13: Pilot Guide ────┘
```

**Parallelizable groups:**
- Group A (independent): Tasks 1 + 2
- Group B (after Group A): Tasks 3, 4, 5, 9 can all start in parallel
- Group C (after Group B): Tasks 6, 8, 10
- Group D (after Group C): Tasks 7, 11
- Group E (after Group D): Tasks 12, 13
