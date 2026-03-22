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
