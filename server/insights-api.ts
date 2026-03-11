/**
 * Vite dev server middleware plugin.
 * Provides GET /api/insights that looks for a pre-generated insights.json
 * file and returns its contents as an InsightsReport.
 */
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

/**
 * Candidate paths where an insights.json file might live,
 * checked in order of priority.
 */
function getInsightsCandidatePaths(projectRoot: string): string[] {
  return [
    path.join(projectRoot, "insights.json"),
    path.join(projectRoot, "standard_insights_report", "insights.json"),
    path.join(projectRoot, "data", "insights.json"),
  ];
}

export function insightsApiPlugin(): Plugin {
  return {
    name: "insights-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/insights") {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        const projectRoot = server.config.root;
        const candidates = getInsightsCandidatePaths(projectRoot);

        for (const candidate of candidates) {
          try {
            if (fs.existsSync(candidate)) {
              const raw = fs.readFileSync(candidate, "utf-8");
              const parsed = JSON.parse(raw);
              res.end(JSON.stringify({ insights: parsed }));
              return;
            }
          } catch (err) {
            console.warn(
              `[insights-api] Failed to read ${candidate}:`,
              err instanceof Error ? err.message : err
            );
          }
        }

        // No insights file found — return null so the client can handle gracefully
        res.end(JSON.stringify({ insights: null }));
      });
    },
  };
}
