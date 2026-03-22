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
