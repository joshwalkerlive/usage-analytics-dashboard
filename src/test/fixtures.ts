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
