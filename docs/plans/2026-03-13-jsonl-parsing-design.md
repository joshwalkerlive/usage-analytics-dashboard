# JSONL Transcript Parsing — Design

**Date:** 2026-03-13
**Approach:** Normalize to content blocks (Option 3 + Approach C)

## Goal

Parse raw Claude Code `.jsonl` session transcripts from `~/.claude/projects/` and display analytics in the dashboard. Preserve the native Anthropic API content block format and normalize all message content to `ContentBlock[]`.

## Type Changes (`types.ts`)

### New: Content block types

```ts
interface TextBlock { type: "text"; text: string }
interface ThinkingBlock { type: "thinking"; thinking: string }
interface ToolUseBlock { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
interface ToolResultBlock { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock
```

### Modified: `RawMessage`

- `content: string` → `content: ContentBlock[]`
- Remove `toolCalls?: RawToolCall[]` (tool use now lives in content blocks)
- Add optional `model?: string`, `usage?: object`, `stopReason?: string`

### Modified: `RawSession`

- `model` becomes optional (derived from first assistant message in JSONL)
- Add `source: "json" | "jsonl"` discriminator

### Removed

- `RawToolCall` interface (replaced by `ToolUseBlock` + `ToolResultBlock`)

## New File: `jsonl-parser.ts`

Parses a single `.jsonl` file into one `RawSession`.

1. Split file text on `\n`, parse each non-empty line as JSON
2. Filter to lines where `type === "user" | "assistant"`
3. For each line, build a `RawMessage`:
   - `role` from `message.role`
   - `content`: if `message.content` is a string, wrap as `[{type: "text", text}]`; if array, pass through
   - `timestamp` from line's `timestamp`
   - `model` from `message.model` (assistant lines only)
4. Build `RawSession`:
   - `id` = `sessionId` from first line
   - `timestamp` = earliest timestamp
   - `durationMs` = last timestamp - first timestamp
   - `messages` = collected messages
   - `model` = first assistant message's model, or `"unknown"`
   - `cwd` = `cwd` from first line that has it
   - `source` = `"jsonl"`

## Changes: `folder-picker-utils.ts`

- Rename `collectJsonFiles` → `collectSessionFiles`
- Accept both `.json` and `.jsonl` extensions
- In `parseFiles`, route by extension:
  - `.json` → existing `parseSessionExport` (updated to wrap string content)
  - `.jsonl` → new `parseJsonlSession`

## Changes: `parser.ts`

- Update `parseSessionExport` to wrap plain string `content` fields into `[{type: "text", text: content}]` before returning
- This maintains backward compatibility for any JSON export files

## Changes: `metrics.ts`

Helper utilities added at top of file:

```ts
function getTextContent(msg: RawMessage): string {
  return msg.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

function getToolUses(msg: RawMessage): ToolUseBlock[] {
  return msg.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
}

function getToolResults(msg: RawMessage): ToolResultBlock[] {
  return msg.content.filter((b): b is ToolResultBlock => b.type === "tool_result");
}
```

All metric functions updated to use these helpers instead of directly accessing `m.content` as string or `m.toolCalls`.

### Function-by-function changes:

| Function | Current access | New access |
|---|---|---|
| `classifyGoal` | `msg.content.toLowerCase()` | `getTextContent(msg).toLowerCase()` |
| `analyzeSession` | `m.toolCalls ?? []` | `getToolUses(m)` |
| `computeFrictionScore` | `m.toolCalls ?? []` | `getToolUses(m)` + `getToolResults(m)` for errors |
| `computeSatisfactionScore` | `m.toolCalls ?? []` | `getToolUses(m)` + `getToolResults(m)` |
| `computeLanguageStats` | `toolCalls[].args` | `getToolUses(m)[].input` |
| `computeToolErrorStats` | `toolCall.error` | `getToolResults(m).filter(r => r.is_error)` |
| `computeResponseTimeBuckets` | unchanged (timestamp-based) | unchanged |
| `computeTimeOfDayBuckets` | unchanged (timestamp-based) | unchanged |

## Performance

- Sequential file parsing (no Web Workers needed)
- 546 files at ~5-50KB each = <25MB total, well within browser memory
- Progress callback passed through for UI feedback during large scans

## Scope

- No UI changes beyond what already exists (folder picker + dashboard)
- No new dependencies
