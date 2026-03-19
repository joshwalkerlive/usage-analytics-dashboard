/**
 * Vite dev server middleware plugin.
 * Provides GET /api/facets that reads all per-session qualitative
 * analysis JSON files from standard_insights_report/facets/.
 */
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

export function facetsApiPlugin(): Plugin {
  return {
    name: "facets-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/facets") {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        const dir = path.join(
          server.config.root,
          "standard_insights_report",
          "facets"
        );

        try {
          if (!fs.existsSync(dir)) {
            res.end(JSON.stringify({ facets: [] }));
            return;
          }

          const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
          const facets: unknown[] = [];

          for (const file of files) {
            try {
              const raw = fs.readFileSync(path.join(dir, file), "utf-8");
              facets.push(JSON.parse(raw));
            } catch {
              // Skip unreadable files
            }
          }

          res.end(JSON.stringify({ facets }));
        } catch (err) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "Failed to read facets",
              message: err instanceof Error ? err.message : String(err),
            })
          );
        }
      });
    },
  };
}
