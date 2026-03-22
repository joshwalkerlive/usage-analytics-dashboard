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
