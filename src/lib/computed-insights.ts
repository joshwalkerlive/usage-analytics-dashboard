/**
 * Computed insights engine.
 * Produces a project-filtered InsightsReport from structured per-session data
 * (session-meta + facets), merged with global pre-generated narrative content.
 */
import type { InsightsReport } from "./insights-types";
import type { SessionMetaEntry, FacetEntry } from "./session-meta-types";

// ---------------------------------------------------------------------------
// Friction key → human-readable title
// ---------------------------------------------------------------------------
const FRICTION_TITLES: Record<string, string> = {
  wrong_approach: "Wrong Approach Taken",
  misunderstood_request: "Misunderstood Request",
  buggy_code: "Buggy Code Generated",
  environment_issue: "Environment Issues",
  auth_error: "Authentication Errors",
  excessive_changes: "Excessive or Unrequested Changes",
  tool_limitations: "Tool Limitations",
  tool_limitation: "Tool Limitations",
  external_limitation: "External Limitations",
  user_rejected_action: "User Rejected Action",
  response_delivery_failure: "Response Delivery Failure",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Last two path segments for display, e.g. "/Users/josh/myproject" → "josh/myproject" */
function shortPath(p: string): string {
  const segments = p.replace(/\/+$/, "").split("/").filter(Boolean);
  return segments.length <= 2
    ? segments.join("/")
    : segments.slice(-2).join("/");
}

/** Title-case a snake_case string as fallback */
function titleCase(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Top N entries from a Record<string, number>, sorted descending */
function topN(
  record: Record<string, number>,
  n: number
): [string, number][] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** Format a percentage */
function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ---------------------------------------------------------------------------
// Per-section computation functions (exported for testing)
// ---------------------------------------------------------------------------

export function computeDateRange(meta: SessionMetaEntry[]): {
  start: string;
  end: string;
} {
  if (meta.length === 0)
    return { start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) };

  const times = meta.map((m) => new Date(m.start_time).getTime());
  const min = new Date(Math.min(...times)).toISOString().slice(0, 10);
  const max = new Date(Math.max(...times)).toISOString().slice(0, 10);
  return { start: min, end: max };
}

export function computeProjectAreas(
  meta: SessionMetaEntry[],
  facets: FacetEntry[]
): InsightsReport["projectAreas"] {
  const facetMap = new Map<string, FacetEntry>();
  for (const f of facets) facetMap.set(f.session_id, f);

  // Group by project_path
  const groups = new Map<string, SessionMetaEntry[]>();
  for (const m of meta) {
    const key = m.project_path || "/";
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([projectPath, sessions]) => {
      // Aggregate goal categories for this project
      const goalCounts: Record<string, number> = {};
      for (const s of sessions) {
        const f = facetMap.get(s.session_id);
        if (f) {
          for (const [cat, count] of Object.entries(f.goal_categories)) {
            goalCounts[cat] = (goalCounts[cat] ?? 0) + count;
          }
        }
      }
      const topGoals = topN(goalCounts, 3)
        .map(([k]) => titleCase(k))
        .join(", ");

      const description = topGoals
        ? `${sessions.length} session(s) focused on ${topGoals}.`
        : `${sessions.length} session(s) in this project.`;

      return {
        name: shortPath(projectPath),
        sessionCount: sessions.length,
        description,
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 7);
}

export function computeFrictionCategories(
  facets: FacetEntry[]
): InsightsReport["frictionCategories"] {
  // Aggregate friction counts
  const totals: Record<string, number> = {};
  const details: Record<string, string[]> = {};

  for (const f of facets) {
    for (const [key, count] of Object.entries(f.friction_counts)) {
      // Normalize tool_limitation → tool_limitations
      const normalizedKey = key === "tool_limitation" ? "tool_limitations" : key;
      totals[normalizedKey] = (totals[normalizedKey] ?? 0) + count;
      if (f.friction_detail) {
        const arr = details[normalizedKey] ?? [];
        arr.push(f.friction_detail);
        details[normalizedKey] = arr;
      }
    }
  }

  return topN(totals, 4)
    .filter(([, count]) => count >= 1)
    .map(([key, count]) => {
      const title = FRICTION_TITLES[key] ?? titleCase(key);
      const exampleTexts = details[key] ?? [];
      // Take up to 2 unique examples
      const uniqueExamples = [...new Set(exampleTexts)].slice(0, 2);
      const examples =
        uniqueExamples.length > 0
          ? uniqueExamples
          : [`Occurred ${count} time(s) across sessions.`];

      return {
        title,
        description: `${title} friction occurred ${count} time(s) across the selected sessions.`,
        examples,
      };
    });
}

export function computeBigWins(
  facets: FacetEntry[]
): InsightsReport["bigWins"] {
  const winners = facets.filter(
    (f) =>
      (f.outcome === "fully_achieved" || f.outcome === "mostly_achieved") &&
      (f.claude_helpfulness === "essential" ||
        f.claude_helpfulness === "very_helpful")
  );

  return winners
    .slice(0, 4)
    .map((f) => ({
      title:
        f.underlying_goal.length > 60
          ? f.underlying_goal.slice(0, 57) + "..."
          : f.underlying_goal,
      description: f.brief_summary || f.underlying_goal,
    }));
}

export function computeMultiClauding(
  meta: SessionMetaEntry[]
): InsightsReport["multiClauding"] {
  // Check for overlapping session time windows
  const windows = meta
    .filter((m) => m.start_time && m.duration_minutes > 0)
    .map((m) => {
      const start = new Date(m.start_time).getTime();
      const end = start + m.duration_minutes * 60 * 1000;
      return { start, end, id: m.session_id };
    })
    .sort((a, b) => a.start - b.start);

  let overlapCount = 0;
  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      if (windows[j].start < windows[i].end) {
        overlapCount++;
      } else {
        break;
      }
    }
  }

  if (overlapCount > 0) {
    return {
      detected: true,
      details: `Detected ${overlapCount} overlapping session pair(s), suggesting parallel Claude usage across multiple projects or tasks.`,
    };
  }

  return {
    detected: false,
    details: "No overlapping sessions detected in the selected projects.",
  };
}

export function computeAtAGlance(
  meta: SessionMetaEntry[],
  facets: FacetEntry[]
): InsightsReport["atAGlance"] {
  const totalSessions = meta.length;

  // Outcome stats
  const fullyAchieved = facets.filter(
    (f) => f.outcome === "fully_achieved"
  ).length;
  const mostlyAchieved = facets.filter(
    (f) => f.outcome === "mostly_achieved"
  ).length;
  const successRate = pct(fullyAchieved + mostlyAchieved, facets.length);

  // Helpfulness stats
  const highHelp = facets.filter(
    (f) =>
      f.claude_helpfulness === "essential" ||
      f.claude_helpfulness === "very_helpful"
  ).length;
  const helpRate = pct(highHelp, facets.length);

  // Top tools
  const toolTotals: Record<string, number> = {};
  for (const m of meta) {
    for (const [tool, count] of Object.entries(m.tool_counts)) {
      toolTotals[tool] = (toolTotals[tool] ?? 0) + count;
    }
  }
  const topTools = topN(toolTotals, 3).map(([t]) => t);

  // Friction
  const frictionTotals: Record<string, number> = {};
  for (const f of facets) {
    for (const [key, count] of Object.entries(f.friction_counts)) {
      frictionTotals[key] = (frictionTotals[key] ?? 0) + count;
    }
  }
  const topFriction = topN(frictionTotals, 2);
  const sessionsWithFriction = facets.filter(
    (f) => Object.keys(f.friction_counts).length > 0
  ).length;

  // Success patterns
  const successCounts: Record<string, number> = {};
  for (const f of facets) {
    if (f.primary_success && f.primary_success !== "none") {
      successCounts[f.primary_success] =
        (successCounts[f.primary_success] ?? 0) + 1;
    }
  }
  const topSuccess = topN(successCounts, 2).map(([k]) => titleCase(k));

  // Build arrays
  const working: string[] = [];
  if (successRate > 0) {
    working.push(
      `You achieved your goals in ${successRate}% of sessions (${fullyAchieved + mostlyAchieved} of ${facets.length}).`
    );
  }
  if (helpRate > 0) {
    working.push(
      `Claude was rated essential or very helpful in ${helpRate}% of sessions.`
    );
  }
  if (topSuccess.length > 0) {
    working.push(
      `Your strongest outcomes come from ${topSuccess.join(" and ").toLowerCase()}.`
    );
  }
  if (topTools.length > 0) {
    working.push(`Most-used tools: ${topTools.join(", ")}.`);
  }
  // Ensure 2-4 items
  while (working.length < 2) working.push(`${totalSessions} sessions analyzed across the selected projects.`);
  if (working.length > 4) working.length = 4;

  const hindering: string[] = [];
  for (const [key, count] of topFriction) {
    const title = FRICTION_TITLES[key] ?? titleCase(key);
    hindering.push(
      `${title} occurred ${count} time(s) across sessions.`
    );
  }
  if (sessionsWithFriction > 0 && hindering.length < 2) {
    hindering.push(
      `${sessionsWithFriction} of ${facets.length} sessions experienced some friction.`
    );
  }
  while (hindering.length < 2) hindering.push("No significant friction patterns detected.");
  if (hindering.length > 3) hindering.length = 3;

  const quickWins: string[] = [];
  if (topFriction.length > 0) {
    const topFrictionKey = topFriction[0][0];
    if (topFrictionKey === "wrong_approach") {
      quickWins.push(
        "Add a CLAUDE.md rule to confirm approach before implementing."
      );
    } else if (topFrictionKey === "misunderstood_request") {
      quickWins.push(
        "Add a CLAUDE.md rule to ask clarifying questions before starting work."
      );
    } else if (topFrictionKey === "buggy_code") {
      quickWins.push(
        "Add a CLAUDE.md rule to run tests after every code change."
      );
    } else {
      quickWins.push(
        `Address ${FRICTION_TITLES[topFrictionKey] ?? titleCase(topFrictionKey)} with targeted CLAUDE.md rules.`
      );
    }
  }
  quickWins.push("Use project-specific CLAUDE.md files for recurring workflows.");
  while (quickWins.length < 2) quickWins.push("Review friction patterns for optimization opportunities.");
  if (quickWins.length > 3) quickWins.length = 3;

  const ambitious: string[] = [];
  const usesMcp = meta.some((m) => m.uses_mcp);
  const usesTaskAgent = meta.some((m) => m.uses_task_agent);
  if (!usesTaskAgent) {
    ambitious.push(
      "Explore Task Agents for parallelizing complex multi-step workflows."
    );
  }
  if (!usesMcp) {
    ambitious.push(
      "Set up MCP servers to connect Claude to your external tools and data sources."
    );
  }
  ambitious.push(
    "Build custom skills to automate your most frequent session patterns."
  );
  if (ambitious.length > 3) ambitious.length = 3;

  return { working, hindering, quickWins, ambitious };
}

// ---------------------------------------------------------------------------
// Main computation + merge
// ---------------------------------------------------------------------------

/**
 * Compute project-specific insights from filtered session-meta + facets,
 * merging with global pre-generated narratives.
 */
export function computeProjectInsights(
  meta: SessionMetaEntry[],
  facets: FacetEntry[],
  globalInsights: InsightsReport | null
): InsightsReport {
  const dateRange = computeDateRange(meta);
  const projectAreas = computeProjectAreas(meta, facets);
  const frictionCategories = computeFrictionCategories(facets);
  const bigWins = computeBigWins(facets);
  const multiClauding = computeMultiClauding(meta);
  const atAGlance = computeAtAGlance(meta, facets);

  // For narrative sections, use global insights if available
  const fallbackNarrative = globalInsights?.usageNarrative ?? {
    paragraphs: [
      `Across ${meta.length} sessions, you worked on ${projectAreas.length} project area(s).`,
    ],
    keyInsight:
      bigWins.length > 0
        ? `Your biggest wins came from ${bigWins[0].title.toLowerCase()}.`
        : `${meta.length} sessions analyzed.`,
  };

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    sessionCount: meta.length,
    atAGlance,
    projectAreas,
    usageNarrative: fallbackNarrative,
    multiClauding,
    bigWins:
      bigWins.length >= 2
        ? bigWins
        : globalInsights?.bigWins ?? bigWins,
    frictionCategories:
      frictionCategories.length >= 2
        ? frictionCategories
        : globalInsights?.frictionCategories ?? frictionCategories,
    claudeMdSuggestions: globalInsights?.claudeMdSuggestions ?? [],
    featureRecommendations: globalInsights?.featureRecommendations ?? [],
    usagePatterns: globalInsights?.usagePatterns ?? [],
    horizonIdeas: globalInsights?.horizonIdeas ?? [],
    funEnding: globalInsights?.funEnding ?? {
      headline: "Keep building.",
      detail: `You've completed ${meta.length} sessions — that's a lot of building.`,
    },
  };
}
