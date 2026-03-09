import { describe, it, expect } from "vitest";
import { parseSessionExport, validateRawSession } from "../parser";
import {
  mockRawSession,
  allMockSessions,
} from "../../test/fixtures";

describe("parseSessionExport", () => {
  it("parses a valid JSON string containing an array of sessions", () => {
    const json = JSON.stringify(allMockSessions);
    const result = parseSessionExport(json);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe("session-001");
  });

  it("parses a single session object (not wrapped in array)", () => {
    const json = JSON.stringify(mockRawSession);
    const result = parseSessionExport(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("session-001");
  });

  it("parses an object with a sessions key", () => {
    const json = JSON.stringify({ sessions: allMockSessions });
    const result = parseSessionExport(json);
    expect(result).toHaveLength(4);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseSessionExport("not json")).toThrow();
  });

  it("throws on empty array", () => {
    expect(() => parseSessionExport("[]")).toThrow();
  });

  it("throws on null input", () => {
    expect(() => parseSessionExport("null")).toThrow();
  });
});

describe("validateRawSession", () => {
  it("returns true for a valid session", () => {
    expect(validateRawSession(mockRawSession)).toBe(true);
  });

  it("returns false when id is missing", () => {
    const bad = { ...mockRawSession, id: undefined };
    expect(validateRawSession(bad as any)).toBe(false);
  });

  it("returns false when timestamp is missing", () => {
    const bad = { ...mockRawSession, timestamp: undefined };
    expect(validateRawSession(bad as any)).toBe(false);
  });

  it("returns false when messages is not an array", () => {
    const bad = { ...mockRawSession, messages: "not array" };
    expect(validateRawSession(bad as any)).toBe(false);
  });

  it("returns false for completely invalid input", () => {
    expect(validateRawSession(null as any)).toBe(false);
    expect(validateRawSession(42 as any)).toBe(false);
    expect(validateRawSession("string" as any)).toBe(false);
  });
});
