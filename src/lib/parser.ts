import type { RawSession, ContentBlock } from "./types";

export function validateRawSession(session: unknown): session is RawSession {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.timestamp === "string" &&
    Array.isArray(s.messages)
  );
}

/**
 * Normalize message content to ContentBlock[] format.
 * Existing JSON exports may have string content — wrap those as TextBlock.
 * Also stamps source as "json".
 */
function normalizeMessageContent(session: RawSession): RawSession {
  return {
    ...session,
    source: "json" as const,
    messages: session.messages.map((msg) => ({
      ...msg,
      content: (typeof msg.content === "string"
        ? [{ type: "text" as const, text: msg.content }]
        : Array.isArray(msg.content)
          ? msg.content
          : [{ type: "text" as const, text: String(msg.content) }]) as ContentBlock[],
    })),
  };
}

export function parseSessionExport(json: string): RawSession[] {
  const parsed = JSON.parse(json);

  if (parsed === null || parsed === undefined) {
    throw new Error("Invalid input: null or undefined");
  }

  // Handle { sessions: [...] } wrapper
  if (
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Array.isArray(parsed.sessions)
  ) {
    if (parsed.sessions.length === 0) {
      throw new Error("No sessions found");
    }
    return parsed.sessions.map(normalizeMessageContent);
  }

  // Handle array of sessions
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("No sessions found");
    }
    return parsed.map(normalizeMessageContent);
  }

  // Handle single session object
  if (typeof parsed === "object" && validateRawSession(parsed)) {
    return [parsed].map(normalizeMessageContent);
  }

  throw new Error("Unrecognized session format");
}
