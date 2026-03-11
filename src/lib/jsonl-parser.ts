import type { RawSession, RawMessage, RawToolCall } from "./types";

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
    content?: string | JsonlContentBlock[];
    model?: string;
  };
}

interface JsonlContentBlock {
  type: string;
  text?: string;
  name?: string;
  id?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | JsonlContentBlock[];
  is_error?: boolean;
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
 * Extract plain text from a user message's content field.
 * Content can be a string or an array of content blocks.
 */
function extractUserText(content: string | JsonlContentBlock[] | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text!)
    .join("\n");
}

/**
 * Extract tool_use blocks from an assistant message's content array.
 */
function extractToolUses(
  content: string | JsonlContentBlock[] | undefined
): { name: string; id: string; input: Record<string, unknown> }[] {
  if (!content || typeof content === "string") return [];
  return content
    .filter((b) => b.type === "tool_use" && b.name && b.id)
    .map((b) => ({
      name: b.name!,
      id: b.id!,
      input: b.input ?? {},
    }));
}

/**
 * Extract tool_result blocks from a user message's content array.
 * These correlate with prior tool_use blocks via tool_use_id.
 */
function extractToolResults(
  content: string | JsonlContentBlock[] | undefined
): { toolUseId: string; isError: boolean }[] {
  if (!content || typeof content === "string") return [];
  return content
    .filter((b) => b.type === "tool_result" && b.tool_use_id)
    .map((b) => ({
      toolUseId: b.tool_use_id!,
      isError: b.is_error === true,
    }));
}

/**
 * Parse a complete JSONL session file content into a RawSession.
 * Transforms the event-based JSONL format into the flat RawSession structure
 * expected by the metrics engine.
 */
export function parseJsonlSession(content: string, filename?: string): RawSession | null {
  const lines = content.split("\n");
  const entries = lines.map(parseLine).filter((e): e is JsonlEntry => e !== null);

  if (entries.length === 0) return null;

  // Collect metadata from the first entry that has it
  let sessionId = "";
  let cwd = "";
  let model = "unknown";
  let firstTimestamp = "";
  let lastTimestamp = "";

  // Collect messages and tool data
  const messages: RawMessage[] = [];
  // Map from tool_use id -> tool name & args, so we can correlate with results
  const pendingToolUses = new Map<
    string,
    { tool: string; args: Record<string, unknown> }
  >();
  // Accumulate tool calls per assistant turn
  let currentAssistantToolCalls: RawToolCall[] = [];

  for (const entry of entries) {
    // Extract session metadata
    if (entry.sessionId && !sessionId) sessionId = entry.sessionId;
    if (entry.cwd && !cwd) cwd = entry.cwd;
    if (entry.timestamp) {
      if (!firstTimestamp) firstTimestamp = entry.timestamp;
      lastTimestamp = entry.timestamp;
    }

    if (entry.type === "user" && entry.message?.role === "user") {
      const content = entry.message.content;

      // Check for tool_result blocks in this user entry
      const toolResults = extractToolResults(content);
      for (const result of toolResults) {
        const pending = pendingToolUses.get(result.toolUseId);
        if (pending) {
          currentAssistantToolCalls.push({
            tool: pending.tool,
            args: pending.args,
            error: result.isError,
          });
          pendingToolUses.delete(result.toolUseId);
        }
      }

      // If we accumulated tool calls from previous assistant turn(s),
      // flush any remaining pending tool_uses that never got results
      for (const [id, pending] of pendingToolUses) {
        currentAssistantToolCalls.push({
          tool: pending.tool,
          args: pending.args,
          error: false,
        });
      }
      pendingToolUses.clear();

      // If there are accumulated tool calls, attach them to a synthetic assistant message
      if (currentAssistantToolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: "(tool calls)",
          toolCalls: currentAssistantToolCalls,
          timestamp: entry.timestamp ?? lastTimestamp,
        });
        currentAssistantToolCalls = [];
      }

      // Add user message (only if there's actual text, not just tool results)
      const userText = extractUserText(content);
      if (userText) {
        messages.push({
          role: "user",
          content: userText,
          timestamp: entry.timestamp ?? lastTimestamp,
        });
      }
    } else if (entry.type === "assistant" && entry.message?.role === "assistant") {
      // Extract model from assistant messages
      if (entry.message.model) model = entry.message.model;

      const content = entry.message.content;

      // Extract tool_use blocks and register them as pending
      const toolUses = extractToolUses(content);
      for (const tu of toolUses) {
        pendingToolUses.set(tu.id, { tool: tu.name, args: tu.input });
      }

      // Extract text content for the message
      const textContent =
        typeof content === "string"
          ? content
          : (content ?? [])
              .filter((b) => b.type === "text" && b.text)
              .map((b) => b.text!)
              .join("\n");

      // Don't add empty assistant messages that only contain tool_use blocks
      if (textContent && toolUses.length === 0) {
        messages.push({
          role: "assistant",
          content: textContent,
          timestamp: entry.timestamp ?? lastTimestamp,
        });
      }
    }
  }

  // Flush any remaining pending tool calls at end of session
  if (pendingToolUses.size > 0 || currentAssistantToolCalls.length > 0) {
    for (const [, pending] of pendingToolUses) {
      currentAssistantToolCalls.push({
        tool: pending.tool,
        args: pending.args,
        error: false,
      });
    }
    if (currentAssistantToolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: "(tool calls)",
        toolCalls: currentAssistantToolCalls,
        timestamp: lastTimestamp,
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
