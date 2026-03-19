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
const CLAUDE_DESKTOP_DIR = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "Claude"
);
const COWORK_SESSIONS_DIR = path.join(CLAUDE_DESKTOP_DIR, "local-agent-mode-sessions");
const DESKTOP_CC_SESSIONS_DIR = path.join(CLAUDE_DESKTOP_DIR, "claude-code-sessions");
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

/**
 * Find Desktop session metadata JSON files (local_*.json) in a directory.
 * Scans 2-3 levels deep (account/org/session structure).
 */
function findDesktopSessionFiles(dir: string, cutoffTime: number): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  try {
    // Walk up to 3 levels to find local_*.json files
    const walk = (d: string, depth: number) => {
      if (depth > 3) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "skills-plugin" || entry.name === ".claude") continue;
          walk(fullPath, depth + 1);
        } else if (entry.name.startsWith("local_") && entry.name.endsWith(".json")) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs >= cutoffTime) {
              results.push(fullPath);
            }
          } catch { /* skip */ }
        }
      }
    };
    walk(dir, 0);
  } catch { /* skip */ }

  return results;
}

/**
 * Parse a Desktop/Cowork session metadata JSON file into a RawSession-like object.
 */
function parseDesktopMetaToSession(
  filePath: string,
  source: "desktop" | "cowork"
) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const meta = JSON.parse(raw);

  const sessionId = meta.sessionId || path.basename(filePath, ".json");
  const createdAt = meta.createdAt as number | undefined;
  const lastActivityAt = meta.lastActivityAt as number | undefined;

  if (!createdAt) return null;

  const timestamp = new Date(createdAt).toISOString();
  const durationMs = lastActivityAt ? Math.max(0, lastActivityAt - createdAt) : 0;
  const model = (meta.model as string) || "unknown";

  // For cwd: Cowork uses userSelectedFolders, Desktop uses cwd
  let cwd = (meta.cwd as string) || "";
  if (source === "cowork" && Array.isArray(meta.userSelectedFolders) && meta.userSelectedFolders.length > 0) {
    cwd = meta.userSelectedFolders[0] as string;
  }

  // Build a minimal message from initialMessage or title
  const initialMessage = (meta.initialMessage as string) || (meta.title as string) || "";
  const messages: {
    role: string;
    content: string;
    timestamp: string;
  }[] = [];

  if (initialMessage) {
    messages.push({
      role: "user",
      content: initialMessage,
      timestamp,
    });
  }

  // Try to find and parse a nested JSONL transcript for richer data
  const sessionDir = path.dirname(filePath);
  const nestedJsonl = findJsonlFiles(sessionDir, 0);
  if (nestedJsonl.length > 0) {
    // Use the first (usually only) non-subagent JSONL
    const mainJsonl = nestedJsonl.find((f) => !f.includes("subagents"));
    if (mainJsonl) {
      try {
        const content = fs.readFileSync(mainJsonl, "utf-8");
        const parsed = parseJsonlToSession(content, path.basename(mainJsonl));
        if (parsed && parsed.messages.length > 0) {
          // Return the full parsed session with metadata enrichment
          return {
            ...parsed,
            id: sessionId,
            timestamp,
            durationMs: parsed.durationMs || durationMs,
            model: parsed.model !== "unknown" ? parsed.model : model,
            cwd: parsed.cwd || cwd,
            source,
          };
        }
      } catch { /* fall through to metadata-only */ }
    }
  }

  if (messages.length === 0) return null;

  return {
    id: sessionId,
    timestamp,
    durationMs,
    messages,
    model,
    cwd,
    source,
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
          const seenIds = new Set<string>();
          const sessions: unknown[] = [];

          // 1. Claude Code CLI sessions (JSONL from ~/.claude/projects/)
          const cliFiles = findJsonlFiles(CLAUDE_PROJECTS_DIR, cutoffTime);
          for (const filePath of cliFiles) {
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              const filename = path.basename(filePath);
              const session = parseJsonlToSession(content, filename);
              if (session) {
                seenIds.add(session.id);
                sessions.push({ ...session, source: "cli" });
              }
            } catch {
              // Skip unreadable files
            }
          }

          // 2. Desktop Claude Code sessions
          const desktopFiles = findDesktopSessionFiles(DESKTOP_CC_SESSIONS_DIR, cutoffTime);
          for (const filePath of desktopFiles) {
            try {
              const session = parseDesktopMetaToSession(filePath, "desktop");
              if (session && !seenIds.has(session.id)) {
                seenIds.add(session.id);
                sessions.push(session);
              }
            } catch {
              // Skip unreadable files
            }
          }

          // 3. Cowork sessions
          const coworkFiles = findDesktopSessionFiles(COWORK_SESSIONS_DIR, cutoffTime);
          for (const filePath of coworkFiles) {
            try {
              const session = parseDesktopMetaToSession(filePath, "cowork");
              if (session && !seenIds.has(session.id)) {
                seenIds.add(session.id);
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
