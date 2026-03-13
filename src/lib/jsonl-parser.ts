import type { RawSession, RawMessage, ContentBlock } from "./types";

/**
 * Represents a single line/event from a Claude Code JSONL session file.
 */
interface JsonlEntry {
  type: string;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  version?: string;
  uuid?: string;
  message?: {
    role?: string;
    content?: string | ContentBlock[];
    model?: string;
  };
}

/**
 * Parse a single JSONL line into a typed entry.
 * Returns null for unparseable lines.
 */
function parseLine(line: string): JsonlEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as JsonlEntry;
  } catch {
    return null;
  }
}

/**
 * Normalize content to ContentBlock[] format.
 * Handles string, array, and undefined content.
 */
function normalizeContent(
  content: string | ContentBlock[] | undefined
): ContentBlock[] {
  if (!content) return [{ type: "text", text: "" }];
  if (typeof content === "string")
    return [{ type: "text", text: content }];
  return content;
}

/**
 * Parse a complete JSONL session file content into a RawSession.
 * Transforms the event-based JSONL format into the flat RawSession structure
 * expected by the metrics engine, preserving native ContentBlock[] arrays.
 */
export function parseJsonlSession(
  content: string,
  filename?: string
): RawSession | null {
  const lines = content.split("\n");
  const entries = lines
    .map(parseLine)
    .filter((e): e is JsonlEntry => e !== null);

  if (entries.length === 0) return null;

  // Collect metadata from the first entry that has it
  let sessionId = "";
  let cwd = "";
  let model: string | undefined;
  let firstTimestamp = "";
  let lastTimestamp = "";

  // Collect messages
  const messages: RawMessage[] = [];

  for (const entry of entries) {
    // Extract session metadata
    if (entry.sessionId && !sessionId) sessionId = entry.sessionId;
    if (entry.cwd && !cwd) cwd = entry.cwd;
    if (entry.timestamp) {
      if (!firstTimestamp) firstTimestamp = entry.timestamp;
      lastTimestamp = entry.timestamp;
    }

    // Only process user and assistant message entries
    if (
      (entry.type === "user" || entry.type === "assistant") &&
      entry.message?.role
    ) {
      // Extract model from assistant messages
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

  // Skip sessions with no meaningful content
  if (messages.length === 0) return null;

  // Calculate duration from first to last timestamp
  let durationMs = 0;
  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp).getTime();
    const end = new Date(lastTimestamp).getTime();
    durationMs = Math.max(0, end - start);
  }

  // Use filename-derived ID or sessionId
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
 * Parse multiple JSONL file contents into RawSession array.
 * Filters out null results (empty/invalid sessions).
 */
export function parseMultipleJsonlSessions(
  files: { content: string; filename: string }[]
): RawSession[] {
  return files
    .map((f) => parseJsonlSession(f.content, f.filename))
    .filter((s): s is RawSession => s !== null);
}
