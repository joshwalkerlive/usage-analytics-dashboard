# Folder Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "📁 Select Folder" button to the dashboard header that recursively finds and loads Claude Code session JSON files from a chosen folder.

**Architecture:** New standalone `FolderPicker` component using progressive enhancement — `showDirectoryPicker` (Chrome/Edge) with a `<input webkitdirectory>` fallback (all browsers). The component manages its own confirmation dialog state. App.tsx gets a thin `handleReplace` callback.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, @testing-library/react, existing `parseSessionExport` from `@/lib/parser`

---

## Task 1: Exportable `parseFiles` helper + tests

A pure-ish async function that takes `File[]`, runs each through `parseSessionExport`, and returns `{ sessions, fileCount, skipped }`. This is the only logic in the component that's easy to unit-test in isolation.

**Files:**
- Create: `src/lib/folder-picker-utils.ts`
- Create: `src/lib/__tests__/folder-picker-utils.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/__tests__/folder-picker-utils.test.ts
import { describe, it, expect } from "vitest";
import { parseFiles } from "../folder-picker-utils";
import { mockRawSession } from "../../test/fixtures";

function makeJsonFile(name: string, content: unknown): File {
  return new File([JSON.stringify(content)], name, { type: "application/json" });
}

describe("parseFiles", () => {
  it("parses valid session files and returns sessions + counts", async () => {
    const files = [
      makeJsonFile("a.json", [mockRawSession]),
      makeJsonFile("b.json", [{ ...mockRawSession, id: "session-002" }]),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(2);
    expect(result.fileCount).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it("counts files that fail to parse as skipped", async () => {
    const files = [
      makeJsonFile("good.json", [mockRawSession]),
      new File(["not json at all"], "bad.json"),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });

  it("returns zero sessions when all files are invalid", async () => {
    const files = [
      new File(["{}"], "wrong.json"),       // valid JSON, not a session
      new File(["bad"], "corrupt.json"),    // invalid JSON
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(0);
    expect(result.skipped).toBe(2);
  });

  it("handles an empty file list", async () => {
    const result = await parseFiles([]);
    expect(result.sessions).toHaveLength(0);
    expect(result.fileCount).toBe(0);
    expect(result.skipped).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard"
npx vitest run src/lib/__tests__/folder-picker-utils.test.ts
```

Expected: FAIL with "Cannot find module '../folder-picker-utils'"

**Step 3: Implement `parseFiles`**

```typescript
// src/lib/folder-picker-utils.ts
import { parseSessionExport } from "@/lib/parser";
import type { RawSession } from "@/lib/types";

export interface ParseResult {
  sessions: RawSession[];
  fileCount: number;
  skipped: number;
}

/**
 * Reads and parses an array of File objects, returning all valid RawSessions.
 * Invalid / unreadable files are counted as skipped rather than thrown.
 */
export async function parseFiles(files: File[]): Promise<ParseResult> {
  let sessions: RawSession[] = [];
  let skipped = 0;

  for (const file of files) {
    try {
      const text = await file.text();
      const parsed = parseSessionExport(text);
      sessions = sessions.concat(parsed);
    } catch {
      skipped++;
    }
  }

  return { sessions, fileCount: files.length, skipped };
}

/**
 * Recursively collects all .json File objects from a FileSystemDirectoryHandle.
 * Only available in browsers that support the File System Access API.
 */
export async function collectJsonFiles(
  dir: FileSystemDirectoryHandle
): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir) {
    if (handle.kind === "file" && name.endsWith(".json")) {
      files.push(await (handle as FileSystemFileHandle).getFile());
    } else if (handle.kind === "directory") {
      files.push(...(await collectJsonFiles(handle as FileSystemDirectoryHandle)));
    }
  }
  return files;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/folder-picker-utils.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/folder-picker-utils.ts src/lib/__tests__/folder-picker-utils.test.ts
git commit -m "feat: add parseFiles and collectJsonFiles utilities"
```

---

## Task 2: `FolderPicker` component + tests

The full component with button, hidden fallback input, and confirmation dialog.

**Files:**
- Create: `src/components/FolderPicker.tsx`
- Create: `src/components/__tests__/FolderPicker.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/__tests__/FolderPicker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderPicker } from "../FolderPicker";
import { mockRawSession } from "../../test/fixtures";

// jsdom has no showDirectoryPicker — component uses fallback path automatically

function makeJsonFile(name: string, content: unknown): File {
  return new File([JSON.stringify(content)], name, { type: "application/json" });
}

describe("FolderPicker", () => {
  const onLoaded = vi.fn();
  const onError = vi.fn();
  const onReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Select Folder button", () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);
    expect(screen.getByRole("button", { name: /select folder/i })).toBeInTheDocument();
  });

  it("shows confirmation dialog after loading valid files", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);

    const input = screen.getByTestId("folder-input") as HTMLInputElement;
    const files = [makeJsonFile("a.json", [mockRawSession])];
    await fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/1 sessions/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /load sessions/i })).toBeInTheDocument();
  });

  it("defaults to merge mode", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;
    await fireEvent.change(input, {
      target: { files: [makeJsonFile("a.json", [mockRawSession])] },
    });

    await waitFor(() => screen.getByText(/merge/i));
    const mergeRadio = screen.getByRole("radio", { name: /merge/i });
    expect(mergeRadio).toBeChecked();
  });

  it("cancel dismisses the dialog without calling onLoaded", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;
    await fireEvent.change(input, {
      target: { files: [makeJsonFile("a.json", [mockRawSession])] },
    });

    await waitFor(() => screen.getByRole("button", { name: /cancel/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onLoaded).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /load sessions/i })).not.toBeInTheDocument();
  });

  it("confirm in merge mode calls onLoaded without onReplace", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} onReplace={onReplace} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;
    await fireEvent.change(input, {
      target: { files: [makeJsonFile("a.json", [mockRawSession])] },
    });

    await waitFor(() => screen.getByRole("button", { name: /load sessions/i }));
    await userEvent.click(screen.getByRole("button", { name: /load sessions/i }));

    expect(onReplace).not.toHaveBeenCalled();
    expect(onLoaded).toHaveBeenCalledWith([mockRawSession]);
  });

  it("confirm in replace mode calls onReplace then onLoaded", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} onReplace={onReplace} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;
    await fireEvent.change(input, {
      target: { files: [makeJsonFile("a.json", [mockRawSession])] },
    });

    await waitFor(() => screen.getByRole("radio", { name: /replace/i }));
    await userEvent.click(screen.getByRole("radio", { name: /replace/i }));
    await userEvent.click(screen.getByRole("button", { name: /load sessions/i }));

    expect(onReplace).toHaveBeenCalledOnce();
    expect(onLoaded).toHaveBeenCalledWith([mockRawSession]);
  });

  it("calls onError when no JSON files are found", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;

    // No files at all — simulate an empty folder
    await fireEvent.change(input, { target: { files: [] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(/no json files/i));
    });
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it("calls onError when all files are invalid sessions", async () => {
    render(<FolderPicker onLoaded={onLoaded} onError={onError} />);
    const input = screen.getByTestId("folder-input") as HTMLInputElement;

    await fireEvent.change(input, {
      target: { files: [new File(["{}"], "empty.json")] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(/no valid claude sessions/i));
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/FolderPicker.test.tsx
```

Expected: FAIL with "Cannot find module '../FolderPicker'"

**Step 3: Implement `FolderPicker`**

```tsx
// src/components/FolderPicker.tsx
import { useState, useRef, useCallback } from "react";
import { parseFiles, collectJsonFiles } from "@/lib/folder-picker-utils";
import type { RawSession } from "@/lib/types";
import type { ParseResult } from "@/lib/folder-picker-utils";

export interface FolderPickerProps {
  onLoaded: (sessions: RawSession[]) => void;
  onError: (message: string) => void;
  onReplace?: () => void;
}

const supportsModernAPI =
  typeof window !== "undefined" && "showDirectoryPicker" in window;

export function FolderPicker({ onLoaded, onError, onReplace }: FolderPickerProps) {
  const [pending, setPending] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const jsonFiles = files.filter((f) => f.name.endsWith(".json"));
      if (jsonFiles.length === 0) {
        onError("No JSON files found in that folder");
        return;
      }
      setLoading(true);
      try {
        const result = await parseFiles(jsonFiles);
        if (result.sessions.length === 0) {
          onError(
            `No valid Claude sessions found (${jsonFiles.length} files checked)`
          );
          return;
        }
        setMode("merge"); // reset to default each time
        setPending(result);
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  const handleModernPick = useCallback(async () => {
    try {
      const dir = await window.showDirectoryPicker();
      const files = await collectJsonFiles(dir);
      await handleFiles(files);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        onError(`Failed to read folder: ${err.message}`);
      }
      // AbortError = user cancelled — silent no-op
    }
  }, [handleFiles, onError]);

  const handleFallbackChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      await handleFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    if (mode === "replace") onReplace?.();
    if (pending.skipped > 0) {
      onError(
        `Loaded ${pending.sessions.length} sessions (${pending.skipped} files skipped)`
      );
    }
    onLoaded(pending.sessions);
    setPending(null);
  }, [pending, mode, onReplace, onLoaded, onError]);

  const handleCancel = useCallback(() => setPending(null), []);

  return (
    <>
      {!supportsModernAPI && (
        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error — webkitdirectory is not in React's HTMLInputElement types
          webkitdirectory=""
          multiple
          accept=".json"
          className="hidden"
          onChange={handleFallbackChange}
          data-testid="folder-input"
        />
      )}

      <button
        onClick={
          supportsModernAPI ? handleModernPick : () => inputRef.current?.click()
        }
        disabled={loading}
        className="cursor-pointer border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Reading…" : "📁 Select Folder"}
      </button>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 w-80 space-y-4 shadow-2xl">
            <p className="text-sm text-gray-200">
              Found{" "}
              <span className="font-semibold text-white">
                {pending.sessions.length} sessions
              </span>{" "}
              across{" "}
              <span className="font-semibold text-white">
                {pending.fileCount} files
              </span>
              {pending.skipped > 0 && (
                <span className="text-gray-500">
                  {" "}
                  ({pending.skipped} skipped)
                </span>
              )}
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="radio"
                  name="folder-mode"
                  value="merge"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                  className="accent-indigo-500"
                />
                Merge with existing data
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="radio"
                  name="folder-mode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="accent-indigo-500"
                />
                Replace existing data
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={handleCancel}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-1.5 transition-colors"
              >
                Load Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/__tests__/FolderPicker.test.tsx
```

Expected: PASS (8 tests)

**Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: All existing tests still pass.

**Step 6: Commit**

```bash
git add src/components/FolderPicker.tsx src/components/__tests__/FolderPicker.test.tsx
git commit -m "feat: add FolderPicker component with confirmation dialog"
```

---

## Task 3: Wire `FolderPicker` into `App.tsx`

Add the component into the header's `filterControls` block alongside the existing compact `FileUpload`.

**Files:**
- Modify: `src/App.tsx` — add import, `handleReplace` callback, and `<FolderPicker>` in `filterControls`

**Step 1: Add the import at the top of `App.tsx`**

Find the existing controls import block (around line 50):
```typescript
import { FileUpload } from "@/components/FileUpload";
```

Add immediately after:
```typescript
import { FolderPicker } from "@/components/FolderPicker";
```

**Step 2: Add `handleReplace` callback**

Find the `handleClear` callback (around line 136):
```typescript
const handleClear = useCallback(() => {
  setRawSessions([]);
  setDateRange({ start: null, end: null });
  setError(null);
}, []);
```

Add immediately after:
```typescript
const handleReplace = useCallback(() => {
  setRawSessions([]);
}, []);
```

**Step 3: Add `<FolderPicker>` to `filterControls`**

Find the `filterControls` JSX (around line 207–219):
```tsx
const filterControls = (
  <>
    <DateRangeFilter value={dateRange} onChange={setDateRange} />
    <FileUpload
      onLoaded={handleFilesLoaded}
      onError={handleParseError}
      compact
    />
  </>
);
```

Replace with:
```tsx
const filterControls = (
  <>
    <DateRangeFilter value={dateRange} onChange={setDateRange} />
    <FileUpload
      onLoaded={handleFilesLoaded}
      onError={handleParseError}
      compact
    />
    <FolderPicker
      onLoaded={handleFilesLoaded}
      onError={handleParseError}
      onReplace={handleReplace}
    />
  </>
);
```

**Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass (no regressions in App or other components).

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire FolderPicker into App header"
```

---

## Task 4: Manual smoke test + deploy

**Step 1: Start the dev server**

```bash
cd "/Users/josh/Documents/Ren Projects/Usage Analytics Dashboard"
npm run dev
```

**Step 2: Verify the button appears**

Open http://localhost:5173 in Chrome. Once sessions load, confirm the "📁 Select Folder" button appears in the header row alongside the "+ Add more files" button.

**Step 3: Test folder selection**

Click "📁 Select Folder", choose a folder containing Claude session JSON files. Verify:
- Confirmation dialog appears with correct session/file counts
- Merge/replace radio buttons work
- "Load Sessions" button loads data and updates the dashboard
- "Cancel" dismisses without loading
- Picking a folder with no JSON files shows an error message

**Step 4: Test fallback in Firefox or Safari**

If available, verify the button still works (opens file picker via `<input webkitdirectory>`).

**Step 5: Deploy**

```bash
npx vercel --prod
```

Wait for deployment URL. Verify "📁 Select Folder" button is live.

**Step 6: Final commit if any fixups were needed**

```bash
git add -A
git commit -m "fix: folder picker smoke test adjustments"
```
