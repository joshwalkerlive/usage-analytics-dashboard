/**
 * Vite dev server middleware plugin.
 * Provides GET /api/sessions that scans ~/.claude/projects/ for JSONL session
 * files from the last 30 days, parses them, and returns RawSession[].
 */
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Recursively find all .jsonl files in a directory,
 * excluding subagents/ subdirectories.
 */
function findJsonlFiles(dir: string, cutoffTime: number): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip subagent directories
      if (entry.name === "subagents") continue;
      results.push(...findJsonlFiles(fullPath, cutoffTime));
    } else if (entry.name.endsWith(".jsonl")) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs >= cutoffTime) {
          results.push(fullPath);
        }
      } catch {
        // Skip files we can't stat
      }
    }
  }

  return results;
}

/**
 * Inline JSONL parser for the server side.
 * Mirrors the logic from src/lib/jsonl-parser.ts but runs in Node context.
 */
function parseJsonlToSession(content: string, filename: string) {
  const lines = content.split("\n");
  const entries: Record<string, unknown>[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      // skip bad lines
    }
  }

  if (entries.length === 0) return null;

  let sessionId = "";
  let cwd = "";
  let model = "unknown";
  let firstTimestamp = "";
  let lastTimestamp = "";

  const messages: {
    role: string;
    content: string;
    toolCalls?: { tool: string; args: Record<string, unknown>; error?: boolean }[];
    timestamp: string;
  }[] = [];

  const pendingToolUses = new Map<string, { tool: string; args: Record<string, unknown> }>();
  let currentToolCalls: { tool: string; args: Record<string, unknown>; error?: boolean }[] = [];

  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const type = e.type as string;
    if (e.sessionId && !sessionId) sessionId = e.sessionId as string;
    if (e.cwd && !cwd) cwd = e.cwd as string;
    if (e.timestamp) {
      if (!firstTimestamp) firstTimestamp = e.timestamp as string;
      lastTimestamp = e.timestamp as string;
    }

    const msg = e.message as Record<string, unknown> | undefined;
    if (!msg) continue;

    if (type === "user" && msg.role === "user") {
      const content = msg.content;
      // Process tool_result blocks
      if (Array.isArray(content)) {
        for (const block of content) {
          const b = block as Record<string, unknown>;
          if (b.type === "tool_result" && b.tool_use_id) {
            const pending = pendingToolUses.get(b.tool_use_id as string);
            if (pending) {
              currentToolCalls.push({
                tool: pending.tool,
                args: pending.args,
                error: b.is_error === true,
              });
              pendingToolUses.delete(b.tool_use_id as string);
            }
          }
        }
      }

      // Flush pending
      for (const [, pending] of pendingToolUses) {
        currentToolCalls.push({ tool: pending.tool, args: pending.args, error: false });
      }
      pendingToolUses.clear();

      if (currentToolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: "(tool calls)",
          toolCalls: currentToolCalls,
          timestamp: (e.timestamp as string) ?? lastTimestamp,
        });
        currentToolCalls = [];
      }

      // Extract user text
      let userText = "";
      if (typeof content === "string") {
        userText = content;
      } else if (Array.isArray(content)) {
        userText = content
          .filter((b: Record<string, unknown>) => b.type === "text" && b.text)
          .map((b: Record<string, unknown>) => b.text as string)
          .join("\n");
      }

      if (userText) {
        messages.push({
          role: "user",
          content: userText,
          timestamp: (e.timestamp as string) ?? lastTimestamp,
        });
      }
    } else if (type === "assistant" && msg.role === "assistant") {
      if (msg.model) model = msg.model as string;

      const content = msg.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const b = block as Record<string, unknown>;
          if (b.type === "tool_use" && b.name && b.id) {
            pendingToolUses.set(b.id as string, {
              tool: b.name as string,
              args: (b.input as Record<string, unknown>) ?? {},
            });
          }
        }

        const textContent = content
          .filter((b: Record<string, unknown>) => b.type === "text" && b.text)
          .map((b: Record<string, unknown>) => b.text as string)
          .join("\n");

        const hasToolUse = content.some((b: Record<string, unknown>) => b.type === "tool_use");
        if (textContent && !hasToolUse) {
          messages.push({
            role: "assistant",
            content: textContent,
            timestamp: (e.timestamp as string) ?? lastTimestamp,
          });
        }
      }
    }
  }

  // Flush remaining
  if (pendingToolUses.size > 0 || currentToolCalls.length > 0) {
    for (const [, pending] of pendingToolUses) {
      currentToolCalls.push({ tool: pending.tool, args: pending.args, error: false });
    }
    if (currentToolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: "(tool calls)",
        toolCalls: currentToolCalls,
        timestamp: lastTimestamp,
      });
    }
  }

  if (messages.length === 0) return null;

  let durationMs = 0;
  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp).getTime();
    const end = new Date(lastTimestamp).getTime();
    durationMs = Math.max(0, end - start);
  }

  const id = sessionId || filename.replace(".jsonl", "");

  return {
    id,
    timestamp: firstTimestamp || new Date().toISOString(),
    durationMs,
    messages,
    model,
    cwd,
  };
}

export function sessionsApiPlugin(): Plugin {
  return {
    name: "sessions-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/sessions") return next();

        const cutoffTime = Date.now() - THIRTY_DAYS_MS;

        try {
          const files = findJsonlFiles(CLAUDE_PROJECTS_DIR, cutoffTime);
          const sessions: unknown[] = [];

          for (const filePath of files) {
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              const filename = path.basename(filePath);
              const session = parseJsonlToSession(content, filename);
              if (session) {
                sessions.push(session);
              }
            } catch {
              // Skip unreadable files
            }
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ sessions, count: sessions.length }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Failed to scan sessions",
              message: err instanceof Error ? err.message : String(err),
            })
          );
        }
      });
    },
  };
}
