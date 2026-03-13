import { describe, it, expect } from "vitest";
import { parseJsonlSession, parseMultipleJsonlSessions } from "../jsonl-parser";

function makeLine(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

function makeSession(lines: Record<string, unknown>[]): string {
  return lines.map(makeLine).join("\n");
}

const baseLines = [
  {
    type: "user",
    sessionId: "sess-abc",
    timestamp: "2025-03-01T10:00:00Z",
    cwd: "/home/dev/project",
    message: {
      role: "user",
      content: "Fix the bug",
    },
  },
  {
    type: "assistant",
    timestamp: "2025-03-01T10:01:00Z",
    message: {
      role: "assistant",
      model: "claude-sonnet-4-20250514",
      content: [
        { type: "text", text: "I'll fix that." },
        { type: "tool_use", id: "tu_1", name: "Read", input: { file_path: "/src/app.ts" } },
      ],
    },
  },
  {
    type: "user",
    timestamp: "2025-03-01T10:01:30Z",
    message: {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "tu_1", content: "file contents..." },
        { type: "text", text: "thanks" },
      ],
    },
  },
];

describe("parseJsonlSession", () => {
  it("parses a basic JSONL session into RawSession", () => {
    const result = parseJsonlSession(makeSession(baseLines), "test.jsonl");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("sess-abc");
    expect(result!.cwd).toBe("/home/dev/project");
    expect(result!.model).toBe("claude-sonnet-4-20250514");
    expect(result!.source).toBe("jsonl");
    expect(result!.messages).toHaveLength(3);
  });

  it("preserves content blocks as-is on assistant messages", () => {
    const result = parseJsonlSession(makeSession(baseLines))!;
    const assistant = result.messages[1];
    expect(assistant.content).toHaveLength(2);
    expect(assistant.content[0]).toEqual({ type: "text", text: "I'll fix that." });
    expect(assistant.content[1]).toEqual({
      type: "tool_use",
      id: "tu_1",
      name: "Read",
      input: { file_path: "/src/app.ts" },
    });
  });

  it("preserves tool_result blocks on user messages", () => {
    const result = parseJsonlSession(makeSession(baseLines))!;
    const userMsg = result.messages[2];
    expect(userMsg.content).toHaveLength(2);
    expect(userMsg.content[0]).toEqual({
      type: "tool_result",
      tool_use_id: "tu_1",
      content: "file contents...",
    });
  });

  it("wraps string content into TextBlock", () => {
    const result = parseJsonlSession(makeSession(baseLines))!;
    const firstUser = result.messages[0];
    expect(firstUser.content).toEqual([{ type: "text", text: "Fix the bug" }]);
  });

  it("computes duration from first to last timestamp", () => {
    const result = parseJsonlSession(makeSession(baseLines))!;
    expect(result.durationMs).toBe(90000); // 1.5 minutes
  });

  it("returns null for empty content", () => {
    expect(parseJsonlSession("")).toBeNull();
  });

  it("returns null for content with no user/assistant messages", () => {
    const lines = [
      { type: "progress", timestamp: "2025-03-01T10:00:00Z" },
      { type: "queue-operation", timestamp: "2025-03-01T10:00:01Z" },
    ];
    expect(parseJsonlSession(makeSession(lines))).toBeNull();
  });

  it("skips unparseable lines without failing", () => {
    const content = "not json\n" + makeLine(baseLines[0]) + "\nmore garbage\n" + makeLine(baseLines[1]);
    const result = parseJsonlSession(content);
    expect(result).not.toBeNull();
    expect(result!.messages).toHaveLength(2);
  });

  it("uses filename as fallback ID when no sessionId present", () => {
    const lines = [
      {
        type: "user",
        timestamp: "2025-03-01T10:00:00Z",
        message: { role: "user", content: "hello" },
      },
    ];
    const result = parseJsonlSession(makeSession(lines), "my-session.jsonl");
    expect(result!.id).toBe("my-session");
  });

  it("handles is_error on tool_result blocks", () => {
    const lines = [
      {
        type: "assistant",
        timestamp: "2025-03-01T10:00:00Z",
        message: {
          role: "assistant",
          model: "claude-sonnet-4-20250514",
          content: [
            { type: "tool_use", id: "tu_err", name: "Bash", input: { command: "npm test" } },
          ],
        },
      },
      {
        type: "user",
        timestamp: "2025-03-01T10:00:30Z",
        message: {
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: "tu_err", content: "error output", is_error: true },
          ],
        },
      },
    ];
    const result = parseJsonlSession(makeSession(lines))!;
    const toolResult = result.messages[1].content[0];
    expect(toolResult.type).toBe("tool_result");
    if (toolResult.type === "tool_result") {
      expect(toolResult.is_error).toBe(true);
    }
  });
});

describe("parseMultipleJsonlSessions", () => {
  it("parses multiple files and filters nulls", () => {
    const files = [
      { content: makeSession(baseLines), filename: "a.jsonl" },
      { content: "", filename: "empty.jsonl" },
      { content: makeSession(baseLines), filename: "b.jsonl" },
    ];
    const results = parseMultipleJsonlSessions(files);
    expect(results).toHaveLength(2);
  });
});
