import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { parseSessionExport } from "@/lib/parser";
import type { RawSession } from "@/lib/types";

interface FileUploadProps {
  onLoaded: (sessions: RawSession[]) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export function FileUpload({ onLoaded, onError, compact }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const sessions = parseSessionExport(reader.result as string);
            onLoaded(sessions);
          } catch (err) {
            onError(
              err instanceof Error ? err.message : "Failed to parse file"
            );
          }
        };
        reader.onerror = () => onError("Failed to read file");
        reader.readAsText(file);
      });
    },
    [onLoaded, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: true,
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className="cursor-pointer border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? "Drop here" : "+ Add more files"}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`w-full max-w-lg cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragActive
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-gray-700 hover:border-gray-500"
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <p className="text-gray-300 text-lg">
          {isDragActive
            ? "Drop your JSON files here"
            : "Drag & drop session JSON files"}
        </p>
        <p className="text-gray-500 text-sm">or click to browse</p>
      </div>
    </div>
  );
}
