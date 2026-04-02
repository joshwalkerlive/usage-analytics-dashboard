import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTheme } from "@/context/ThemeContext";
import { validatePayload, type ValidationResult } from "@/lib/payload-validator";
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";

interface UploadZoneProps {
  onPayloadLoaded: (payload: AnalyticsPayloadV2) => void;
}

export function UploadZone({ onPayloadLoaded }: UploadZoneProps) {
  const { currentTheme } = useTheme();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parsing, setParsing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        setValidation({
          valid: false,
          errors: ["File is too large (max 25 MB). Analytics payloads are typically under 1 MB."],
          warnings: [],
        });
        setParsing(false);
        return;
      }

      setParsing(true);
      setValidation(null);

      try {
        const text = await file.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          setValidation({
            valid: false,
            errors: ["File is not valid JSON. Make sure you're uploading the analytics-payload.json file."],
            warnings: [],
          });
          setParsing(false);
          return;
        }

        const result = validatePayload(json);
        setValidation(result);

        if (result.valid && result.payload) {
          onPayloadLoaded(result.payload);
        }
      } catch (err) {
        setValidation({
          valid: false,
          errors: [`Failed to read file: ${err instanceof Error ? err.message : "Unknown error"}`],
          warnings: [],
        });
      } finally {
        setParsing(false);
      }
    },
    [onPayloadLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: false,
  });

  const colors = currentTheme.colors;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: colors.bg.primary, color: colors.text.primary }}
    >
      <h1
        className="text-4xl font-bold mb-2"
        style={{ color: colors.accent }}
      >
        Claude Usage Analytics
      </h1>
      <p className="text-lg mb-8 opacity-70">
        Insights into how you work with Claude Code
      </p>

      <div
        {...getRootProps()}
        className={`
          w-full max-w-lg p-12 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200 text-center
          ${isDragActive ? "scale-[1.02]" : "hover:scale-[1.01]"}
        `}
        style={{
          borderColor: isDragActive
            ? colors.accent
            : colors.border,
          background: isDragActive
            ? colors.accent + "10"
            : colors.bg.secondary,
        }}
      >
        <input {...getInputProps()} />
        {parsing ? (
          <p className="text-lg">Validating payload...</p>
        ) : isDragActive ? (
          <p className="text-lg" style={{ color: colors.accent }}>
            Drop your payload here
          </p>
        ) : (
          <>
            <p className="text-lg mb-2">
              Drop your <code className="font-mono font-bold">analytics-payload.json</code> here
            </p>
            <p className="text-sm opacity-60">or click to browse</p>
          </>
        )}
      </div>

      {validation && !validation.valid && (
        <div
          className="w-full max-w-lg mt-6 p-4 rounded-xl"
          style={{
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          <p className="font-bold mb-2">Validation failed:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation?.warnings && validation.warnings.length > 0 && (
        <div
          className="w-full max-w-lg mt-4 p-4 rounded-xl"
          style={{
            background: "#fef3c7",
            color: "#92400e",
          }}
        >
          <p className="font-bold mb-2">Warnings:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 text-center opacity-60">
        <p className="text-sm mb-1">Don't have a payload yet?</p>
        <p className="text-sm">
          Run{" "}
          <code
            className="font-mono px-2 py-1 rounded"
            style={{ background: colors.accent + "20" }}
          >
            /my-analytics
          </code>{" "}
          in Claude Code to generate one.
        </p>
      </div>
    </div>
  );
}
