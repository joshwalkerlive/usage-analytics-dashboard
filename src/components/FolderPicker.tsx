import { useState, useRef, useCallback } from "react";
import { parseFiles, collectJsonFiles } from "@/lib/folder-picker-utils";
import type { RawSession } from "@/lib/types";
import type { ParseResult } from "@/lib/folder-picker-utils";

export interface FolderPickerProps {
  onLoaded: (sessions: RawSession[]) => void;
  onError: (message: string) => void;
  onReplace?: (sessions: RawSession[]) => void;
}

export function FolderPicker({ onLoaded, onError, onReplace }: FolderPickerProps) {
  const supportsModernAPI =
    typeof window !== "undefined" && "showDirectoryPicker" in window;
  const [pending, setPending] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));
    if (jsonFiles.length === 0) {
      onError("No JSON files found in that folder");
      return;
    }
    setLoading(true);
    try {
      const result = await parseFiles(jsonFiles);
      if (result.sessions.length === 0) {
        onError(`No valid Claude sessions found (${jsonFiles.length} files checked)`);
        return;
      }
      setMode("merge");
      setPending(result);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const handleModernPick = useCallback(async () => {
    try {
      const dir = await window.showDirectoryPicker();
      const files = await collectJsonFiles(dir);
      await handleFiles(files);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        onError(`Failed to read folder: ${err.message}`);
      }
    }
  }, [handleFiles, onError]);

  const handleFallbackChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await handleFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFiles]);

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    if (pending.skipped > 0) {
      onError(`Loaded ${pending.sessions.length} sessions (${pending.skipped} files skipped)`);
    }
    if (mode === "replace") {
      onReplace?.(pending.sessions);
    } else {
      onLoaded(pending.sessions);
    }
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
        onClick={supportsModernAPI ? handleModernPick : () => inputRef.current?.click()}
        disabled={loading}
        className="cursor-pointer border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Reading…" : "📁 Select Folder"}
      </button>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 w-80 space-y-4 shadow-2xl">
            <p className="text-sm text-gray-200">
              Found <span className="font-semibold text-white">{pending.sessions.length} sessions</span>{" "}
              across <span className="font-semibold text-white">{pending.fileCount} files</span>
              {pending.skipped > 0 && <span className="text-gray-500"> ({pending.skipped} skipped)</span>}
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input type="radio" name="folder-mode" value="merge" checked={mode === "merge"} onChange={() => setMode("merge")} className="accent-indigo-500" />
                Merge with existing data
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input type="radio" name="folder-mode" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} className="accent-indigo-500" />
                Replace existing data
              </label>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              <button onClick={handleConfirm} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-1.5 transition-colors">Load Sessions</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
