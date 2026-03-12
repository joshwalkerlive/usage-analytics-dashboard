# Folder Picker Feature Design

**Date:** 2026-03-12
**Status:** Approved

## Overview

Add a "Select Folder" button to the dashboard header that recursively searches a chosen folder (and all subfolders) for Claude Code session JSON files, parses them, and loads the results into the dashboard.

## Component Interface

New standalone component: `src/components/FolderPicker.tsx`

```typescript
interface FolderPickerProps {
  onLoaded: (sessions: RawSession[]) => void;
  onError: (message: string) => void;
  onReplace?: () => void; // called before loading when user picks "Replace"
}
```

- Renders a single "📁 Select Folder" button
- Placed in the `App.tsx` header alongside the existing compact `FileUpload` button
- No changes to the existing `FileUpload` component
- Hidden entirely if neither `showDirectoryPicker` nor `webkitdirectory` is supported

## Browser Support Strategy

Progressive enhancement — try modern API first, fall back to cross-browser input:

1. **Primary:** `window.showDirectoryPicker()` (File System Access API — Chrome/Edge)
2. **Fallback:** `<input type="file" webkitdirectory multiple accept=".json">` (Safari, Firefox, all modern browsers)

Detection happens at runtime. The button always renders the same UI regardless of which path is taken internally.

## Data Flow

1. User clicks "Select Folder" → appropriate picker opens
2. Recursively collect all `.json` files from the selected directory tree
3. Parse each file using existing `parseSessionExport` (no new parser logic)
4. Aggregate valid `RawSession[]`; track skipped/invalid file count
5. Show confirmation dialog with session count and merge/replace choice
6. On confirm:
   - If "Replace": call `onReplace()` to clear existing sessions, then `onLoaded(sessions)`
   - If "Merge": call `onLoaded(sessions)` directly (existing merge logic in `App.tsx`)

## Confirmation Dialog

Inline modal (not `window.confirm()`):

```
┌─────────────────────────────────────────┐
│ Found 42 sessions across 18 files       │
│                                         │
│  ● Merge with existing data             │
│  ○ Replace existing data                │
│                                         │
│  [Cancel]              [Load Sessions]  │
└─────────────────────────────────────────┘
```

- "Merge" is the default selection
- "Replace" clears existing state before loading
- "Cancel" dismisses with no side effects

## Error Handling

| Scenario | Behavior |
|---|---|
| User cancels picker | Silent no-op |
| No `.json` files found | `onError("No JSON files found in that folder")` |
| All files fail validation | `onError("No valid Claude sessions found (N files checked)")` |
| Some files fail validation | Load valid ones; call `onError("Loaded N sessions (M files skipped)")` as a warning |
| File read error | Skip that file; count toward skipped total |
| Neither API supported | Component returns `null` — button not rendered |

## Files Touched

- `src/components/FolderPicker.tsx` — new component (create)
- `src/App.tsx` — add `FolderPicker` to header, add `handleClear`-style `onReplace` handler
