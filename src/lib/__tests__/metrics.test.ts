import { describe, it, expect } from "vitest";
import {
  computeSessionMetrics,
  computeToolUsageStats,
  computeGoalDistribution,
  computeFrictionScore,
  computeSatisfactionScore,
  analyzeSession,
} from "../metrics";
import {
  mockRawSession,
  mockRawSessionFeature,
  mockRawSessionWithErrors,
  mockRawSessionExplore,
  allMockSessions,
} from "../../test/fixtures";

describe("computeSessionMetrics", () => {
  it("computes correct total session count", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const metrics = computeSessionMetrics(analyzed);
    expect(metrics.totalSessions).toBe(4);
  });

  it("computes correct average duration", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const metrics = computeSessionMetrics(analyzed);
    const expectedAvg = (300000 + 600000 + 900000 + 120000) / 4;
    expect(metrics.avgDurationMs).toBe(expectedAvg);
  });

  it("computes sessions per day correctly", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const metrics = computeSessionMetrics(analyzed);
    expect(metrics.sessionsPerDay["2025-03-01"]).toBe(1);
    expect(metrics.sessionsPerDay["2025-03-02"]).toBe(1);
    expect(metrics.sessionsPerDay["2025-03-03"]).toBe(1);
    expect(metrics.sessionsPerDay["2025-03-05"]).toBe(1);
  });

  it("computes total messages across all sessions", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const metrics = computeSessionMetrics(analyzed);
    // session1: 4, session2: 2, session3: 4, session4: 2 = 12
    expect(metrics.totalMessages).toBe(12);
  });

  it("computes total tool calls across all sessions", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const metrics = computeSessionMetrics(analyzed);
    // session1: 3, session2: 3, session3: 6, session4: 2 = 14
    expect(metrics.totalToolCalls).toBe(14);
  });

  it("returns zeroes for empty input", () => {
    const metrics = computeSessionMetrics([]);
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.avgDurationMs).toBe(0);
    expect(metrics.totalMessages).toBe(0);
    expect(metrics.totalToolCalls).toBe(0);
  });
});

describe("computeToolUsageStats", () => {
  it("aggregates tool counts across sessions", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const stats = computeToolUsageStats(analyzed);
    const readStat = stats.find((s) => s.tool === "Read");
    expect(readStat).toBeDefined();
    expect(readStat!.count).toBeGreaterThanOrEqual(3);
  });

  it("computes error rates for tools with errors", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const stats = computeToolUsageStats(analyzed);
    const bashStat = stats.find((s) => s.tool === "Bash");
    expect(bashStat).toBeDefined();
    expect(bashStat!.errorCount).toBeGreaterThan(0);
    expect(bashStat!.errorRate).toBeGreaterThan(0);
    expect(bashStat!.errorRate).toBeLessThanOrEqual(1);
  });

  it("returns empty array for empty input", () => {
    const stats = computeToolUsageStats([]);
    expect(stats).toEqual([]);
  });

  it("sorts by count descending", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const stats = computeToolUsageStats(analyzed);
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i - 1].count).toBeGreaterThanOrEqual(stats[i].count);
    }
  });
});

describe("computeGoalDistribution", () => {
  it("returns correct distribution of goal categories", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const dist = computeGoalDistribution(analyzed);
    expect(dist.length).toBeGreaterThan(0);
    const totalPct = dist.reduce((s, d) => s + d.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("percentages sum to 100", () => {
    const analyzed = allMockSessions.map(analyzeSession);
    const dist = computeGoalDistribution(analyzed);
    const sum = dist.reduce((s, d) => s + d.percentage, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it("returns empty for no sessions", () => {
    const dist = computeGoalDistribution([]);
    expect(dist).toEqual([]);
  });
});

describe("computeFrictionScore", () => {
  it("returns a score between 0 and 100", () => {
    const score = computeFrictionScore(mockRawSession);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("gives higher friction for sessions with errors", () => {
    const cleanScore = computeFrictionScore(mockRawSession);
    const errorScore = computeFrictionScore(mockRawSessionWithErrors);
    expect(errorScore).toBeGreaterThan(cleanScore);
  });

  it("gives low friction for explore sessions", () => {
    const score = computeFrictionScore(mockRawSessionExplore);
    expect(score).toBeLessThan(30);
  });
});

describe("computeSatisfactionScore", () => {
  it("returns a score between 0 and 100", () => {
    const score = computeSatisfactionScore(mockRawSession);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("gives higher satisfaction for clean sessions", () => {
    const cleanScore = computeSatisfactionScore(mockRawSession);
    const errorScore = computeSatisfactionScore(mockRawSessionWithErrors);
    expect(cleanScore).toBeGreaterThan(errorScore);
  });
});

describe("analyzeSession", () => {
  it("produces a valid AnalyzedSession", () => {
    const result = analyzeSession(mockRawSession);
    expect(result.id).toBe("session-001");
    expect(result.date).toBe("2025-03-01");
    expect(result.durationMs).toBe(300000);
    expect(result.messageCount).toBe(4);
    expect(result.toolCallCount).toBe(3);
    expect(result.toolErrorCount).toBe(0);
    expect(result.frictionScore).toBeGreaterThanOrEqual(0);
    expect(result.satisfactionScore).toBeGreaterThanOrEqual(0);
    expect(result.model).toBe("claude-sonnet-4-20250514");
  });

  it("counts tool errors correctly", () => {
    const result = analyzeSession(mockRawSessionWithErrors);
    expect(result.toolErrorCount).toBe(3); // 3 errors in that session
  });

  it("identifies correct goal category for bug fix", () => {
    const result = analyzeSession(mockRawSession);
    expect(result.goalCategory).toBe("bug-fix");
  });

  it("identifies correct goal category for feature", () => {
    const result = analyzeSession(mockRawSessionFeature);
    expect(result.goalCategory).toBe("feature");
  });

  it("identifies correct goal category for refactor", () => {
    const result = analyzeSession(mockRawSessionWithErrors);
    expect(result.goalCategory).toBe("refactor");
  });

  it("identifies correct goal category for explore", () => {
    const result = analyzeSession(mockRawSessionExplore);
    expect(result.goalCategory).toBe("explore");
  });

  it("populates toolUsage map", () => {
    const result = analyzeSession(mockRawSession);
    expect(result.toolUsage["Read"]).toBeDefined();
    expect(result.toolUsage["Read"].count).toBe(1);
    expect(result.toolUsage["Edit"]).toBeDefined();
    expect(result.toolUsage["Edit"].count).toBe(1);
  });
});
