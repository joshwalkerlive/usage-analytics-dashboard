import type { InsightsReport } from "./insights-types";

/**
 * Fetch the pre-generated insights report from the server API.
 * Returns null if no insights file is available.
 */
export async function fetchInsights(): Promise<InsightsReport | null> {
  try {
    const response = await fetch("/api/insights");
    if (!response.ok) {
      console.warn(`[insights-loader] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.insights ?? null;
  } catch (err) {
    console.warn(
      "[insights-loader] Failed to fetch insights:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Parse an InsightsReport from a raw JSON string (e.g. from file upload).
 * Returns null if the JSON is invalid or doesn't match the expected shape.
 */
export function parseInsightsJson(raw: string): InsightsReport | null {
  try {
    const parsed = JSON.parse(raw);

    // Basic shape validation — check for required top-level keys
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "atAGlance" in parsed &&
      "generatedAt" in parsed
    ) {
      return parsed as InsightsReport;
    }

    console.warn("[insights-loader] JSON does not match InsightsReport shape");
    return null;
  } catch {
    console.warn("[insights-loader] Invalid JSON");
    return null;
  }
}
