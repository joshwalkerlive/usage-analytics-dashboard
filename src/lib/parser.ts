import type { RawSession } from "./types";

export function validateRawSession(session: unknown): session is RawSession {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.timestamp === "string" &&
    Array.isArray(s.messages)
  );
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
    return parsed.sessions;
  }

  // Handle array of sessions
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("No sessions found");
    }
    return parsed;
  }

  // Handle single session object
  if (typeof parsed === "object" && validateRawSession(parsed)) {
    return [parsed];
  }

  throw new Error("Unrecognized session format");
}
