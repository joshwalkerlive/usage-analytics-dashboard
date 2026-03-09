import { describe, it, expect } from "vitest";
import { filterByDateRange } from "../filters";
import { analyzeSession } from "../metrics";
import { allMockSessions } from "../../test/fixtures";
import type { DateRange } from "../types";

describe("filterByDateRange", () => {
  const analyzed = allMockSessions.map(analyzeSession);

  it("returns all sessions when no date range specified", () => {
    const range: DateRange = { start: null, end: null };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(4);
  });

  it("filters by start date only", () => {
    const range: DateRange = { start: "2025-03-03", end: null };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(2); // March 3 and March 5
  });

  it("filters by end date only", () => {
    const range: DateRange = { start: null, end: "2025-03-02" };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(2); // March 1 and March 2
  });

  it("filters by both start and end date", () => {
    const range: DateRange = { start: "2025-03-02", end: "2025-03-03" };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(2); // March 2 and March 3
  });

  it("returns empty when range matches no sessions", () => {
    const range: DateRange = { start: "2026-01-01", end: "2026-12-31" };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(0);
  });

  it("is inclusive on both boundaries", () => {
    const range: DateRange = { start: "2025-03-01", end: "2025-03-01" };
    const result = filterByDateRange(analyzed, range);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("session-001");
  });
});
