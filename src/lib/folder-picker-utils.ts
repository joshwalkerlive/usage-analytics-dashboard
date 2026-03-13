import { parseSessionExport } from "@/lib/parser";
import { parseJsonlSession } from "@/lib/jsonl-parser";
import type { RawSession } from "@/lib/types";

export interface ParseResult {
  sessions: RawSession[];
  fileCount: number;
  skipped: number;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function parseFiles(files: File[]): Promise<ParseResult> {
  let sessions: RawSession[] = [];
  let skipped = 0;
  for (const file of files) {
    try {
      const text = await readFileAsText(file);
      if (file.name.endsWith(".jsonl")) {
        const session = parseJsonlSession(text, file.name);
        if (session) {
          sessions.push(session);
        } else {
          skipped++;
        }
      } else {
        const parsed = parseSessionExport(text);
        sessions = sessions.concat(parsed);
      }
    } catch {
      skipped++;
    }
  }
  return { sessions, fileCount: files.length, skipped };
}

export async function collectSessionFiles(
  dir: FileSystemDirectoryHandle
): Promise<File[]> {
  const files: File[] = [];
  // Use entries() which has better TypeScript support than direct iteration
  const entries = (dir as unknown as { entries(): AsyncIterable<[string, FileSystemHandle]> }).entries();
  for await (const [name, handle] of entries) {
    if (handle.kind === "file" && (name.endsWith(".json") || name.endsWith(".jsonl"))) {
      files.push(await (handle as FileSystemFileHandle).getFile());
    } else if (handle.kind === "directory") {
      files.push(...(await collectSessionFiles(handle as FileSystemDirectoryHandle)));
    }
  }
  return files;
}
