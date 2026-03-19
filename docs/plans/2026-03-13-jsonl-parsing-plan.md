# JSONL Parsing (Approach C) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Normalize all message content to `ContentBlock[]` arrays, rewrite the JSONL parser to preserve native content blocks, and update the metrics layer with helper utilities.

**Architecture:** Replace `RawMessage.content: string` + `RawToolCall[]` with `ContentBlock[]` union type. JSONL parser preserves raw content blocks as-is. JSON parser wraps string content. Metrics layer uses three helper functions to extract text, tool uses, and tool results from content blocks.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add ContentBlock types and update RawMessage/RawSession in types.ts

**Files:**
- Modify: `src/lib/types.ts:1-24`

**Step 1: Write the new content block types and update interfaces**

Replace lines 1-24 of `src/lib/types.ts` with:

```ts
// Content block types (Anthropic API native format)
export interface TextBlock {
  type: "text";
  text: string;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock;

// Raw session data as exported from Claude Code
export interface RawMessage {
  role: "user" | "assistant" | "system";
  content: ContentBlock[];
  timestamp: string;
  model?: string;
}

export interface RawSession {
  id: string;
  timestamp: string;
  durationMs: number;
  messages: RawMessage[];
  model?: string;
  cwd: string;
  source?: "json" | "jsonl";
}
```

This removes `RawToolCall`, changes `RawMessage.content` from `string` to `ContentBlock[]`, removes `toolCalls`, makes `model` optional on both `RawMessage` and `RawSession`, and adds `source` discriminator.

**Step 2: Run the type checker to see all breakages**

Run: `npx tsc --noEmit 2>&1 | head -80`

Expected: Compile errors in `fixtures.ts`, `metrics.ts`, `parser.ts`, `jsonl-parser.ts`, and their tests. This is expected — we fix them in subsequent tasks.

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: replace RawToolCall with ContentBlock types, normalize content to ContentBlock[]"
```

---

### Task 2: Update test fixtures to ContentBlock[] format

**Files:**
- Modify: `src/test/fixtures.ts`

**Step 1: Rewrite fixtures.ts with ContentBlock[] content**

Replace the entire file with:

```ts
import type { RawSession } from "../lib/types";

export const mockRawSession: RawSession = {
  id: "session-001",
  timestamp: "2025-03-01T10:00:00Z",
  durationMs: 300000,
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Fix the bug in the login handler where passwords aren't hashed" },
      ],
      timestamp: "2025-03-01T10:00:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "I'll fix the password hashing bug." },
        {
          type: "tool_use",
          id: "tu_1",
          name: "Read",
          input: { file_path: "/src/auth.ts" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_1",
          content: "file contents...",
        },
        {
          type: "tool_use",
          id: "tu_2",
          name: "Edit",
          input: { file_path: "/src/auth.ts", old_string: "a", new_string: "b" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_2",
          content: "success",
        },
      ],
      timestamp: "2025-03-01T10:01:00Z",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Great, now run the tests" },
      ],
      timestamp: "2025-03-01T10:02:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Running tests..." },
        {
          type: "tool_use",
          id: "tu_3",
          name: "Bash",
          input: { command: "npm test" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_3",
          content: "All tests passed",
        },
      ],
      timestamp: "2025-03-01T10:03:00Z",
    },
  ],
};

export const mockRawSessionFeature: RawSession = {
  id: "session-002",
  timestamp: "2025-03-02T14:00:00Z",
  durationMs: 600000,
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Add a new feature: dark mode toggle for the settings page" },
      ],
      timestamp: "2025-03-02T14:00:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "I'll add dark mode support." },
        {
          type: "tool_use",
          id: "tu_4",
          name: "Read",
          input: { file_path: "/src/settings.tsx" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_4",
          content: "file contents...",
        },
        {
          type: "tool_use",
          id: "tu_5",
          name: "Write",
          input: { file_path: "/src/theme.ts", content: "..." },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_5",
          content: "success",
        },
        {
          type: "tool_use",
          id: "tu_6",
          name: "Edit",
          input: { file_path: "/src/settings.tsx", old_string: "a", new_string: "b" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_6",
          content: "success",
        },
      ],
      timestamp: "2025-03-02T14:05:00Z",
    },
  ],
};

export const mockRawSessionWithErrors: RawSession = {
  id: "session-003",
  timestamp: "2025-03-03T09:00:00Z",
  durationMs: 900000,
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Refactor the database module to use connection pooling" },
      ],
      timestamp: "2025-03-03T09:00:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "I'll refactor the database module." },
        {
          type: "tool_use",
          id: "tu_7",
          name: "Read",
          input: { file_path: "/src/db.ts" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_7",
          content: "file contents...",
        },
        {
          type: "tool_use",
          id: "tu_8",
          name: "Bash",
          input: { command: "npm install pg-pool" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_8",
          content: "",
          is_error: true,
        },
        {
          type: "tool_use",
          id: "tu_9",
          name: "Bash",
          input: { command: "npm install pg-pool --legacy-peer-deps" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_9",
          content: "installed",
        },
        {
          type: "tool_use",
          id: "tu_10",
          name: "Edit",
          input: { file_path: "/src/db.ts", old_string: "a", new_string: "b" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_10",
          content: "",
          is_error: true,
        },
        {
          type: "tool_use",
          id: "tu_11",
          name: "Edit",
          input: { file_path: "/src/db.ts", old_string: "c", new_string: "d" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_11",
          content: "success",
        },
      ],
      timestamp: "2025-03-03T09:10:00Z",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "That failed, try again" },
      ],
      timestamp: "2025-03-03T09:11:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Let me retry." },
        {
          type: "tool_use",
          id: "tu_12",
          name: "Bash",
          input: { command: "npm test" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_12",
          content: "",
          is_error: true,
        },
      ],
      timestamp: "2025-03-03T09:14:00Z",
    },
  ],
};

export const mockRawSessionExplore: RawSession = {
  id: "session-004",
  timestamp: "2025-03-05T16:00:00Z",
  durationMs: 120000,
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What does the auth middleware do? Explain the flow" },
      ],
      timestamp: "2025-03-05T16:00:00Z",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Let me look at the auth middleware." },
        {
          type: "tool_use",
          id: "tu_13",
          name: "Read",
          input: { file_path: "/src/middleware/auth.ts" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_13",
          content: "file contents...",
        },
        {
          type: "tool_use",
          id: "tu_14",
          name: "Grep",
          input: { pattern: "authenticate", path: "/src" },
        },
        {
          type: "tool_result",
          tool_use_id: "tu_14",
          content: "matches...",
        },
      ],
      timestamp: "2025-03-05T16:01:00Z",
    },
  ],
};

export const allMockSessions: RawSession[] = [
  mockRawSession,
  mockRawSessionFeature,
  mockRawSessionWithErrors,
  mockRawSessionExplore,
];
```

**Important counts preserved:**
- `mockRawSession`: 4 messages, 3 tool_use blocks (Read, Edit, Bash)
- `mockRawSessionFeature`: 2 messages, 3 tool_use blocks (Read, Write, Edit)
- `mockRawSessionWithErrors`: 4 messages, 6 tool_use blocks, 3 with `is_error: true` on their tool_result (Bash tu_8, Edit tu_10, Bash tu_12)
- `mockRawSessionExplore`: 2 messages, 2 tool_use blocks (Read, Grep)
- Total: 12 messages, 14 tool_use blocks

**Step 2: Commit**

```bash
git add src/test/fixtures.ts
git commit -m "feat: convert test fixtures to ContentBlock[] format"
```

---

### Task 3: Add content block helpers and update metrics.ts

**Files:**
- Modify: `src/lib/metrics.ts`

**Step 1: Add helper imports and utility functions**

Add the `ContentBlock` type imports at the top of `metrics.ts`. Change the import line to also import `ToolUseBlock` and `ToolResultBlock`:

```ts
import type {
  RawSession,
  AnalyzedSession,
  SessionMetrics,
  ToolUsageStat,
  GoalDistribution,
  GoalCategory,
  LanguageStat,
  SessionTypeStat,
  ResponseTimeBucket,
  TimeOfDayBucket,
  ToolErrorStat,
  HelpfulFactorStat,
  OutcomeStat,
  FrictionTypeStat,
  InferredSatisfaction,
  RawMessage,
  ToolUseBlock,
  ToolResultBlock,
} from "./types";
```

Add the three helper functions immediately after the import block (before `GOAL_KEYWORDS`):

```ts
// --- Content block helpers ---

function getTextContent(msg: RawMessage): string {
  return msg.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function getToolUses(msg: RawMessage): ToolUseBlock[] {
  return msg.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
}

function getToolResults(msg: RawMessage): ToolResultBlock[] {
  return msg.content.filter((b): b is ToolResultBlock => b.type === "tool_result");
}
```

**Step 2: Update classifyGoal (line 33)**

Change:
```ts
  const text = firstUserMessage.content.toLowerCase();
```
To:
```ts
  const text = getTextContent(firstUserMessage).toLowerCase();
```

**Step 3: Update computeFrictionScore (lines 45-50)**

Change:
```ts
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const totalCalls = toolCalls.length;
  if (totalCalls === 0) return 0;

  const errorCount = toolCalls.filter((tc) => tc.error).length;
```
To:
```ts
  const toolUses = session.messages.flatMap((m) => getToolUses(m));
  const totalCalls = toolUses.length;
  if (totalCalls === 0) return 0;

  const toolResults = session.messages.flatMap((m) => getToolResults(m));
  const errorCount = toolResults.filter((r) => r.is_error).length;
```

**Step 4: Update computeSatisfactionScore (lines 67-72)**

Change:
```ts
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const totalCalls = toolCalls.length;
  if (totalCalls === 0) return 75; // neutral for no-tool sessions

  const errorCount = toolCalls.filter((tc) => tc.error).length;
```
To:
```ts
  const toolUses = session.messages.flatMap((m) => getToolUses(m));
  const totalCalls = toolUses.length;
  if (totalCalls === 0) return 75; // neutral for no-tool sessions

  const toolResults = session.messages.flatMap((m) => getToolResults(m));
  const errorCount = toolResults.filter((r) => r.is_error).length;
```

**Step 5: Update analyzeSession (lines 85-97)**

Change:
```ts
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const messageCount = session.messages.length;
  const toolCallCount = toolCalls.length;
  const toolErrorCount = toolCalls.filter((tc) => tc.error).length;

  const toolUsage: Record<string, { count: number; errors: number }> = {};
  for (const tc of toolCalls) {
    if (!toolUsage[tc.tool]) {
      toolUsage[tc.tool] = { count: 0, errors: 0 };
    }
    toolUsage[tc.tool].count++;
    if (tc.error) toolUsage[tc.tool].errors++;
  }
```
To:
```ts
  const allToolUses = session.messages.flatMap((m) => getToolUses(m));
  const allToolResults = session.messages.flatMap((m) => getToolResults(m));
  const messageCount = session.messages.length;
  const toolCallCount = allToolUses.length;

  // Build a set of tool_use IDs that had errors
  const errorIds = new Set(
    allToolResults.filter((r) => r.is_error).map((r) => r.tool_use_id)
  );
  const toolErrorCount = errorIds.size;

  const toolUsage: Record<string, { count: number; errors: number }> = {};
  for (const tu of allToolUses) {
    if (!toolUsage[tu.name]) {
      toolUsage[tu.name] = { count: 0, errors: 0 };
    }
    toolUsage[tu.name].count++;
    if (errorIds.has(tu.id)) toolUsage[tu.name].errors++;
  }
```

Also update the `model` field in the return statement (line 111):
```ts
    model: session.model ?? "unknown",
```

**Step 6: Update computeLanguageStats (lines 217-229)**

Change:
```ts
      if (!msg.toolCalls) continue;
      for (const tc of msg.toolCalls) {
        // Extract file paths from tool args
        const args = tc.args as Record<string, unknown>;
        const filePath = (args.file_path ?? args.path ?? args.command ?? "") as string;
```
To:
```ts
      const toolUses = getToolUses(msg);
      if (toolUses.length === 0) continue;
      for (const tu of toolUses) {
        // Extract file paths from tool input
        const input = tu.input as Record<string, unknown>;
        const filePath = (input.file_path ?? input.path ?? input.command ?? "") as string;
```

**Step 7: Update computeToolErrorStats (lines 329-344)**

Change:
```ts
      if (!msg.toolCalls) continue;
      for (const tc of msg.toolCalls) {
        if (!tc.error) continue;
        const tool = tc.tool.toLowerCase();
```
To:
```ts
      const toolUses = getToolUses(msg);
      const toolResults = getToolResults(msg);
      // Build map from tool_use_id -> tool name
      const nameById = new Map(toolUses.map((tu) => [tu.id, tu.name]));
      for (const tr of toolResults) {
        if (!tr.is_error) continue;
        const tool = (nameById.get(tr.tool_use_id) ?? "unknown").toLowerCase();
```

**Step 8: Run tests**

Run: `npx vitest run src/lib/__tests__/metrics.test.ts`

Expected: All 19 tests PASS (no assertion counts changed because fixture tool_use/tool_result counts are identical to old toolCalls counts).

**Step 9: Commit**

```bash
git add src/lib/metrics.ts
git commit -m "feat: add content block helpers, update all metric functions for ContentBlock[]"
```

---

### Task 4: Update parser.ts — wrap string content and relax model validation

**Files:**
- Modify: `src/lib/parser.ts`

**Step 1: Update validateRawSession for optional model**

Change:
```ts
    typeof s.durationMs === "number" &&
    typeof s.model === "string" &&
    typeof s.cwd === "string"
```
To:
```ts
    typeof s.durationMs === "number" &&
    (typeof s.model === "string" || s.model === undefined) &&
    typeof s.cwd === "string"
```

**Step 2: Add content normalization to parseSessionExport**

Add a helper function at the top of the file (after the import) and call it before returning sessions:

```ts
import type { RawSession, ContentBlock } from "./types";

function normalizeMessageContent(session: RawSession): RawSession {
  return {
    ...session,
    source: "json" as const,
    messages: session.messages.map((msg) => ({
      ...msg,
      content: typeof msg.content === "string"
        ? [{ type: "text" as const, text: msg.content }]
        : msg.content,
    })),
  };
}
```

Then wrap each return site:

In the `{ sessions: [...] }` branch:
```ts
    return valid.map(normalizeMessageContent);
```

In the array branch:
```ts
    return valid.map(normalizeMessageContent);
```

In the single-session branch:
```ts
    return [normalizeMessageContent(parsed)];
```

**Step 3: Run parser tests**

Run: `npx vitest run src/lib/__tests__/parser.test.ts`

Expected: All 7 tests PASS. The fixtures already use `ContentBlock[]`, and `validateRawSession` still validates them. The `normalizeMessageContent` handles any legacy JSON exports with string content.

**Step 4: Commit**

```bash
git add src/lib/parser.ts
git commit -m "feat: wrap string content to ContentBlock[], relax model validation"
```

---

### Task 5: Rewrite jsonl-parser.ts for Approach C

**Files:**
- Rewrite: `src/lib/jsonl-parser.ts`

**Step 1: Replace the entire file**

```ts
import type { RawSession, RawMessage, ContentBlock } from "./types";

interface JsonlEntry {
  type: string;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  message?: {
    role?: string;
    content?: string | ContentBlock[];
    model?: string;
  };
}

function parseLine(line: string): JsonlEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as JsonlEntry;
  } catch {
    return null;
  }
}

function normalizeContent(content: string | ContentBlock[] | undefined): ContentBlock[] {
  if (!content) return [{ type: "text", text: "" }];
  if (typeof content === "string") return [{ type: "text", text: content }];
  return content;
}

/**
 * Parse a JSONL session file into a RawSession.
 * Preserves native content blocks as-is — no tool_use/tool_result correlation needed.
 */
export function parseJsonlSession(content: string, filename?: string): RawSession | null {
  const lines = content.split("\n");
  const entries = lines.map(parseLine).filter((e): e is JsonlEntry => e !== null);

  if (entries.length === 0) return null;

  let sessionId = "";
  let cwd = "";
  let model: string | undefined;
  let firstTimestamp = "";
  let lastTimestamp = "";
  const messages: RawMessage[] = [];

  for (const entry of entries) {
    if (entry.sessionId && !sessionId) sessionId = entry.sessionId;
    if (entry.cwd && !cwd) cwd = entry.cwd;
    if (entry.timestamp) {
      if (!firstTimestamp) firstTimestamp = entry.timestamp;
      lastTimestamp = entry.timestamp;
    }

    if (
      (entry.type === "user" || entry.type === "assistant") &&
      entry.message?.role
    ) {
      if (entry.type === "assistant" && entry.message.model && !model) {
        model = entry.message.model;
      }

      messages.push({
        role: entry.message.role as "user" | "assistant",
        content: normalizeContent(entry.message.content),
        timestamp: entry.timestamp ?? lastTimestamp,
        ...(entry.message.model ? { model: entry.message.model } : {}),
      });
    }
  }

  if (messages.length === 0) return null;

  let durationMs = 0;
  if (firstTimestamp && lastTimestamp) {
    durationMs = Math.max(
      0,
      new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime()
    );
  }

  const id = sessionId || filename?.replace(".jsonl", "") || "unknown";

  return {
    id,
    timestamp: firstTimestamp || new Date().toISOString(),
    durationMs,
    messages,
    model,
    cwd,
    source: "jsonl",
  };
}

/**
 * Parse multiple JSONL files into RawSession[].
 */
export function parseMultipleJsonlSessions(
  files: { content: string; filename: string }[]
): RawSession[] {
  return files
    .map((f) => parseJsonlSession(f.content, f.filename))
    .filter((s): s is RawSession => s !== null);
}
```

**Step 2: Commit**

```bash
git add src/lib/jsonl-parser.ts
git commit -m "feat: rewrite jsonl-parser to preserve native ContentBlock[] arrays"
```

---

### Task 6: Write JSONL parser tests

**Files:**
- Create: `src/lib/__tests__/jsonl-parser.test.ts`

**Step 1: Write the test file**

```ts
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
```

**Step 2: Run the new tests**

Run: `npx vitest run src/lib/__tests__/jsonl-parser.test.ts`

Expected: All 11 tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/jsonl-parser.test.ts
git commit -m "test: add comprehensive jsonl-parser tests for ContentBlock[] approach"
```

---

### Task 7: Update folder-picker-utils.ts — accept .jsonl, route by extension

**Files:**
- Modify: `src/lib/folder-picker-utils.ts`

**Step 1: Update the file**

```ts
import { parseSessionExport } from "@/lib/parser";
import { parseJsonlSession } from "@/lib/jsonl-parser";
import type { RawSession } from "@/lib/types";

export interface ParseResult {
  sessions: RawSession[];
  fileCount: number;
  skipped: number;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function parseFiles(files: File[]): Promise<ParseResult> {
  let sessions: RawSession[] = [];
  let skipped = 0;
  for (const file of files) {
    try {
      const text = await readFileAsText(file);
      if (file.name.endsWith(".jsonl")) {
        const session = parseJsonlSession(text, file.name);
        if (session) {
          sessions.push(session);
        } else {
          skipped++;
        }
      } else {
        const parsed = parseSessionExport(text);
        sessions = sessions.concat(parsed);
      }
    } catch {
      skipped++;
    }
  }
  return { sessions, fileCount: files.length, skipped };
}

export async function collectSessionFiles(
  dir: FileSystemDirectoryHandle
): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir) {
    if (handle.kind === "file" && (name.endsWith(".json") || name.endsWith(".jsonl"))) {
      files.push(await (handle as FileSystemFileHandle).getFile());
    } else if (handle.kind === "directory") {
      files.push(...(await collectSessionFiles(handle as FileSystemDirectoryHandle)));
    }
  }
  return files;
}
```

**Step 2: Run folder-picker-utils tests**

Run: `npx vitest run src/lib/__tests__/folder-picker-utils.test.ts`

Expected: All 4 tests PASS (they use `.json` files which still route to `parseSessionExport`).

**Step 3: Commit**

```bash
git add src/lib/folder-picker-utils.ts
git commit -m "feat: rename collectJsonFiles to collectSessionFiles, route .jsonl to new parser"
```

---

### Task 8: Update folder-picker-utils tests for .jsonl routing

**Files:**
- Modify: `src/lib/__tests__/folder-picker-utils.test.ts`

**Step 1: Add JSONL test cases**

Add to the existing test file, after the existing `describe("parseFiles")` block, these new test cases inside the same describe:

```ts
  it("parses .jsonl files via the JSONL parser", async () => {
    const jsonlContent = [
      JSON.stringify({ type: "user", sessionId: "jsonl-001", timestamp: "2025-03-01T10:00:00Z", cwd: "/test", message: { role: "user", content: "hello" } }),
      JSON.stringify({ type: "assistant", timestamp: "2025-03-01T10:01:00Z", message: { role: "assistant", model: "claude-sonnet-4-20250514", content: [{ type: "text", text: "hi" }] } }),
    ].join("\n");
    const files = [
      new File([jsonlContent], "session.jsonl", { type: "text/plain" }),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe("jsonl-001");
    expect(result.sessions[0].source).toBe("jsonl");
    expect(result.skipped).toBe(0);
  });

  it("handles mixed .json and .jsonl files", async () => {
    const jsonlContent = [
      JSON.stringify({ type: "user", sessionId: "jsonl-002", timestamp: "2025-03-01T10:00:00Z", cwd: "/test", message: { role: "user", content: "hi" } }),
    ].join("\n");
    const files = [
      makeJsonFile("a.json", [mockRawSession]),
      new File([jsonlContent], "b.jsonl", { type: "text/plain" }),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(2);
    expect(result.skipped).toBe(0);
  });

  it("counts empty .jsonl files as skipped", async () => {
    const files = [
      new File([""], "empty.jsonl", { type: "text/plain" }),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(0);
    expect(result.skipped).toBe(1);
  });
```

**Step 2: Run the tests**

Run: `npx vitest run src/lib/__tests__/folder-picker-utils.test.ts`

Expected: All 7 tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/folder-picker-utils.test.ts
git commit -m "test: add .jsonl routing tests for parseFiles"
```

---

### Task 9: Update any UI references to collectJsonFiles

**Files:**
- Search: `src/` for `collectJsonFiles`

**Step 1: Find all references**

Run: `grep -rn "collectJsonFiles" src/`

**Step 2: Replace each occurrence with `collectSessionFiles`**

Every import and call site of `collectJsonFiles` should become `collectSessionFiles`. The exact files will depend on grep output.

**Step 3: Run the full test suite**

Run: `npx vitest run`

Expected: All tests PASS.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename collectJsonFiles to collectSessionFiles across codebase"
```

---

### Task 10: Run full test suite and verify

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `npx vitest run`

Expected: All tests PASS. Key assertions still hold:
- `metrics.totalSessions` = 4
- `metrics.totalMessages` = 12
- `metrics.totalToolCalls` = 14
- `result.toolCallCount` = 3 (mockRawSession)
- `result.toolErrorCount` = 3 (mockRawSessionWithErrors)
- `result.toolUsage["Read"].count` = 1
- `result.toolUsage["Edit"].count` = 1
- Goal classifications: bug-fix, feature, refactor, explore

**Step 2: Run the type checker**

Run: `npx tsc --noEmit`

Expected: No errors.

**Step 3: Run the dev server**

Run: `npx vite build`

Expected: Build succeeds with no errors.
