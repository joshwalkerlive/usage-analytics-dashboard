import { describe, it, expect, vi } from "vitest";
import { parseFiles } from "../folder-picker-utils";

/**
 * Create a mock File object for testing.
 * Uses Blob under the hood (available in Node via vitest).
 */
function makeFile(name: string, content: string): File {
  return new File([content], name, { type: "application/octet-stream" });
}

/** Helper: build a minimal valid JSON session export */
function makeJsonSession(id = "json-session-1"): string {
  return JSON.stringify({
    id,
    timestamp: "2025-03-01T10:00:00Z",
    durationMs: 60000,
    model: "claude-sonnet-4-20250514",
    cwd: "/home/dev",
    messages: [
      {
        role: "user",
        content: "hello",
        timestamp: "2025-03-01T10:00:00Z",
      },
    ],
  });
}

/** Helper: build a minimal valid JSONL session */
function makeJsonlSession(sessionId = "jsonl-session-1"): string {
  const lines = [
    {
      type: "user",
      sessionId,
      timestamp: "2025-06-01T09:00:00Z",
      cwd: "/home/dev/project",
      message: { role: "user", content: "Fix the bug" },
    },
    {
      type: "assistant",
      timestamp: "2025-06-01T09:01:00Z",
      message: {
        role: "assistant",
        model: "claude-sonnet-4-20250514",
        content: [{ type: "text", text: "On it." }],
      },
    },
  ];
  return lines.map((l) => JSON.stringify(l)).join("\n");
}

describe("parseFiles", () => {
  it("parses .jsonl files via the JSONL parser", async () => {
    const files = [makeFile("session.jsonl", makeJsonlSession())];
    const result = await parseFiles(files);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe("jsonl-session-1");
    expect(result.sessions[0].source).toBe("jsonl");
    expect(result.skipped).toBe(0);
    expect(result.fileCount).toBe(1);
  });

  it("handles mixed .json and .jsonl files", async () => {
    const files = [
      makeFile("export.json", makeJsonSession("from-json")),
      makeFile("session.jsonl", makeJsonlSession("from-jsonl")),
    ];
    const result = await parseFiles(files);

    expect(result.sessions).toHaveLength(2);

    const ids = result.sessions.map((s) => s.id);
    expect(ids).toContain("from-json");
    expect(ids).toContain("from-jsonl");

    const jsonSession = result.sessions.find((s) => s.id === "from-json");
    const jsonlSession = result.sessions.find((s) => s.id === "from-jsonl");
    expect(jsonSession!.source).toBe("json");
    expect(jsonlSession!.source).toBe("jsonl");
  });

  it("counts empty .jsonl files as skipped", async () => {
    const files = [
      makeFile("empty.jsonl", ""),
      makeFile("valid.jsonl", makeJsonlSession()),
    ];
    const result = await parseFiles(files);

    expect(result.sessions).toHaveLength(1);
    expect(result.skipped).toBe(1);
    expect(result.fileCount).toBe(2);
  });

  it("counts unparseable .json files as skipped", async () => {
    const files = [makeFile("bad.json", "not valid json {{{")];
    const result = await parseFiles(files);

    expect(result.sessions).toHaveLength(0);
    expect(result.skipped).toBe(1);
  });
});
