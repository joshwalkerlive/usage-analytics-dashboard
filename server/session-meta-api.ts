/**
 * Vite dev server middleware plugin.
 * Provides GET /api/session-meta that reads all per-session metadata
 * JSON files from standard_insights_report/session-meta/.
 */
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

export function sessionMetaApiPlugin(): Plugin {
  return {
    name: "session-meta-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/session-meta") {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        const dir = path.join(
          server.config.root,
          "standard_insights_report",
          "session-meta"
        );

        try {
          if (!fs.existsSync(dir)) {
            res.end(JSON.stringify({ sessionMeta: [] }));
            return;
          }

          const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
          const sessionMeta: unknown[] = [];

          for (const file of files) {
            try {
              const raw = fs.readFileSync(path.join(dir, file), "utf-8");
              sessionMeta.push(JSON.parse(raw));
            } catch {
              // Skip unreadable files
            }
          }

          res.end(JSON.stringify({ sessionMeta }));
        } catch (err) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "Failed to read session-meta",
              message: err instanceof Error ? err.message : String(err),
            })
          );
        }
      });
    },
  };
}
