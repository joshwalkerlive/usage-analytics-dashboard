import type { AnalyticsPayloadV2 } from "@/types/payload-v2";

export interface ValidationResult {
  valid: boolean;
  payload?: AnalyticsPayloadV2;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that an unknown JSON value conforms to the AnalyticsPayloadV2 schema.
 * Returns structured errors/warnings for UI display.
 */
export function validatePayload(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must be a non-null object
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Payload must be a JSON object"], warnings };
  }

  const obj = input as Record<string, unknown>;

  // Version check
  if (!obj.version) {
    errors.push('Missing required field: "version"');
  } else if (obj.version !== "2.0") {
    errors.push(
      `Unsupported payload version: "${obj.version}". Expected "2.0".`
    );
  }

  // Required top-level fields
  const requiredTopLevel = [
    "generatedAt",
    "dateRange",
    "platform",
    "source",
    "dataQuality",
    "counts",
    "quantitative",
    "qualitative",
  ];

  for (const field of requiredTopLevel) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // If we're already missing critical fields, bail early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const quant = obj.quantitative as Record<string, unknown>;
  const qual = obj.qualitative as Record<string, unknown>;
  const counts = obj.counts as Record<string, unknown>;

  // Quantitative sub-fields
  const requiredQuantFields = [
    "overview",
    "sessions",
    "dailyActivity",
    "goalDistribution",
    "toolUsage",
    "timeOfDay",
    "responseTiming",
    "topProjects",
    "outcomes",
    "helpfulFactors",
    "frictionAndSatisfaction",
  ];

  for (const field of requiredQuantFields) {
    if (quant[field] === undefined || quant[field] === null) {
      errors.push(`Missing required field: "quantitative.${field}"`);
    }
  }

  // Sessions must be an array
  if (quant.sessions !== undefined && !Array.isArray(quant.sessions)) {
    errors.push('"quantitative.sessions" must be an array');
  }

  // Qualitative sub-fields
  const requiredQualFields = [
    "atAGlance",
    "bigWins",
    "frictionDeepDive",
    "usagePatterns",
    "recommendations",
  ];

  for (const field of requiredQualFields) {
    if (qual[field] === undefined || qual[field] === null) {
      errors.push(`Missing required field: "qualitative.${field}"`);
    }
  }

  // Recommended quantitative sub-fields (warnings, not errors — null guards exist downstream)
  const recommendedQuantFields = [
    "languageStats",
    "sessionTypes",
    "toolErrors",
    "projectAreas",
    "concurrency",
  ];

  for (const field of recommendedQuantFields) {
    if (quant[field] === undefined || quant[field] === null) {
      warnings.push(`Missing recommended field: "quantitative.${field}"`);
    }
  }

  // Type validation for quantitative.overview numeric fields
  const overview = quant.overview as Record<string, unknown>;
  const numericOverviewFields = [
    "totalSessions",
    "totalMessages",
    "totalToolCalls",
    "totalDurationMinutes",
    "avgSessionDurationMinutes",
    "avgMessagesPerSession",
    "avgToolCallsPerSession",
  ];
  for (const field of numericOverviewFields) {
    if (overview[field] !== undefined && typeof overview[field] !== "number") {
      errors.push(
        `"quantitative.overview.${field}" must be a number, got ${typeof overview[field]}`
      );
    }
  }

  // Session array item spot-checks (first session only)
  if (Array.isArray(quant.sessions) && quant.sessions.length > 0) {
    const firstSession = quant.sessions[0] as Record<string, unknown>;
    if (typeof firstSession.frictionScore !== "number") {
      warnings.push("Session frictionScore should be a number (0-100)");
    }
    if (typeof firstSession.satisfactionScore !== "number") {
      warnings.push("Session satisfactionScore should be a number (0-100)");
    }
  }

  // Consistency warnings (not hard failures)
  if (
    Array.isArray(quant.sessions) &&
    typeof counts.sessionCount === "number" &&
    quant.sessions.length !== counts.sessionCount
  ) {
    warnings.push(
      `Session count mismatch: counts.sessionCount is ${counts.sessionCount} but quantitative.sessions has ${quant.sessions.length} entries`
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    payload: input as AnalyticsPayloadV2,
    errors,
    warnings,
  };
}
