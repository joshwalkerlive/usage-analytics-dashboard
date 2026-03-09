import type { RawSession } from "../lib/types";

export const mockRawSession: RawSession = {
  id: "session-001",
  timestamp: "2025-03-01T10:00:00Z",
  durationMs: 300000, // 5 minutes
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: "Fix the bug in the login handler where passwords aren't hashed",
      timestamp: "2025-03-01T10:00:00Z",
    },
    {
      role: "assistant",
      content: "I'll fix the password hashing bug.",
      toolCalls: [
        {
          tool: "Read",
          args: { file_path: "/src/auth.ts" },
          result: "file contents...",
          durationMs: 50,
        },
        {
          tool: "Edit",
          args: { file_path: "/src/auth.ts", old_string: "a", new_string: "b" },
          result: "success",
          durationMs: 30,
        },
      ],
      timestamp: "2025-03-01T10:01:00Z",
    },
    {
      role: "user",
      content: "Great, now run the tests",
      timestamp: "2025-03-01T10:02:00Z",
    },
    {
      role: "assistant",
      content: "Running tests...",
      toolCalls: [
        {
          tool: "Bash",
          args: { command: "npm test" },
          result: "All tests passed",
          durationMs: 5000,
        },
      ],
      timestamp: "2025-03-01T10:03:00Z",
    },
  ],
};

export const mockRawSessionFeature: RawSession = {
  id: "session-002",
  timestamp: "2025-03-02T14:00:00Z",
  durationMs: 600000, // 10 minutes
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: "Add a new feature: dark mode toggle for the settings page",
      timestamp: "2025-03-02T14:00:00Z",
    },
    {
      role: "assistant",
      content: "I'll add dark mode support.",
      toolCalls: [
        {
          tool: "Read",
          args: { file_path: "/src/settings.tsx" },
          result: "file contents...",
          durationMs: 40,
        },
        {
          tool: "Write",
          args: { file_path: "/src/theme.ts", content: "..." },
          result: "success",
          durationMs: 25,
        },
        {
          tool: "Edit",
          args: { file_path: "/src/settings.tsx", old_string: "a", new_string: "b" },
          result: "success",
          durationMs: 35,
        },
      ],
      timestamp: "2025-03-02T14:05:00Z",
    },
  ],
};

export const mockRawSessionWithErrors: RawSession = {
  id: "session-003",
  timestamp: "2025-03-03T09:00:00Z",
  durationMs: 900000, // 15 minutes
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: "Refactor the database module to use connection pooling",
      timestamp: "2025-03-03T09:00:00Z",
    },
    {
      role: "assistant",
      content: "I'll refactor the database module.",
      toolCalls: [
        {
          tool: "Read",
          args: { file_path: "/src/db.ts" },
          result: "file contents...",
          durationMs: 45,
        },
        {
          tool: "Bash",
          args: { command: "npm install pg-pool" },
          error: true,
          durationMs: 8000,
        },
        {
          tool: "Bash",
          args: { command: "npm install pg-pool --legacy-peer-deps" },
          result: "installed",
          durationMs: 6000,
        },
        {
          tool: "Edit",
          args: { file_path: "/src/db.ts", old_string: "a", new_string: "b" },
          error: true,
          durationMs: 20,
        },
        {
          tool: "Edit",
          args: { file_path: "/src/db.ts", old_string: "c", new_string: "d" },
          result: "success",
          durationMs: 22,
        },
      ],
      timestamp: "2025-03-03T09:10:00Z",
    },
    {
      role: "user",
      content: "That failed, try again",
      timestamp: "2025-03-03T09:11:00Z",
    },
    {
      role: "assistant",
      content: "Let me retry.",
      toolCalls: [
        {
          tool: "Bash",
          args: { command: "npm test" },
          error: true,
          durationMs: 4000,
        },
      ],
      timestamp: "2025-03-03T09:14:00Z",
    },
  ],
};

export const mockRawSessionExplore: RawSession = {
  id: "session-004",
  timestamp: "2025-03-05T16:00:00Z",
  durationMs: 120000, // 2 minutes
  model: "claude-sonnet-4-20250514",
  cwd: "/Users/test/project",
  messages: [
    {
      role: "user",
      content: "What does the auth middleware do? Explain the flow",
      timestamp: "2025-03-05T16:00:00Z",
    },
    {
      role: "assistant",
      content: "Let me look at the auth middleware.",
      toolCalls: [
        {
          tool: "Read",
          args: { file_path: "/src/middleware/auth.ts" },
          result: "file contents...",
          durationMs: 35,
        },
        {
          tool: "Grep",
          args: { pattern: "authenticate", path: "/src" },
          result: "matches...",
          durationMs: 100,
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
