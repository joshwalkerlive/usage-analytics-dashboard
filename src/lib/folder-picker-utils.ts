import { parseSessionExport } from "@/lib/parser";
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
      const parsed = parseSessionExport(text);
      sessions = sessions.concat(parsed);
    } catch {
      skipped++;
    }
  }
  return { sessions, fileCount: files.length, skipped };
}

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
