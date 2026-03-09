import { describe, it, expect } from "vitest";
import { buildDashboardData } from "../dashboard-data";
import { allMockSessions } from "../../test/fixtures";
import type { DateRange } from "../types";

describe("buildDashboardData", () => {
  it("produces valid DashboardData from raw sessions", () => {
    const data = buildDashboardData(allMockSessions);
    expect(data.sessions).toHaveLength(4);
    expect(data.sessionMetrics.totalSessions).toBe(4);
    expect(data.toolUsageStats.length).toBeGreaterThan(0);
    expect(data.goalDistribution.length).toBeGreaterThan(0);
    expect(data.frictionOverTime).toHaveLength(4);
    expect(data.satisfactionDistribution).toHaveLength(4);
  });

  it("applies date range filter", () => {
    const range: DateRange = { start: "2025-03-01", end: "2025-03-02" };
    const data = buildDashboardData(allMockSessions, range);
    expect(data.sessions).toHaveLength(2);
    expect(data.sessionMetrics.totalSessions).toBe(2);
  });

  it("toolUsageStats have valid structure", () => {
    const data = buildDashboardData(allMockSessions);
    for (const stat of data.toolUsageStats) {
      expect(stat.tool).toBeTruthy();
      expect(stat.count).toBeGreaterThanOrEqual(1);
      expect(stat.errorRate).toBeGreaterThanOrEqual(0);
      expect(stat.errorRate).toBeLessThanOrEqual(1);
    }
  });

  it("goalDistribution percentages sum to 100", () => {
    const data = buildDashboardData(allMockSessions);
    const sum = data.goalDistribution.reduce((s, d) => s + d.percentage, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it("frictionOverTime has valid scores", () => {
    const data = buildDashboardData(allMockSessions);
    for (const point of data.frictionOverTime) {
      expect(point.score).toBeGreaterThanOrEqual(0);
      expect(point.score).toBeLessThanOrEqual(100);
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("satisfactionDistribution has valid scores", () => {
    const data = buildDashboardData(allMockSessions);
    for (const point of data.satisfactionDistribution) {
      expect(point.score).toBeGreaterThanOrEqual(0);
      expect(point.score).toBeLessThanOrEqual(100);
    }
  });

  it("frictionOverTime is sorted by date ascending", () => {
    const data = buildDashboardData(allMockSessions);
    for (let i = 1; i < data.frictionOverTime.length; i++) {
      expect(data.frictionOverTime[i].date >= data.frictionOverTime[i - 1].date).toBe(true);
    }
  });
});
