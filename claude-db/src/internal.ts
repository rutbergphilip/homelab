import { createServer, type Server } from "node:http";
import type { Database } from "bun:sqlite";
import { config } from "./config";
import { buildLyftaProgress, buildLyftaSummary } from "./domains/lyfta/stats";

// Separate, cluster-internal-only listener (default :3001 — see config.ts),
// same pattern as kcal-assistant's: the :3000 server is ingress-reachable so
// everything on it must stay token-gated; these unauthenticated read-only
// projections get their own port, gated by a CiliumNetworkPolicy that admits
// only the kcal-assistant pod (plus /healthz for probes).
export function createInternalServer(opts: { db: Database }): Server {
  return createServer((req, res) => {
    try {
      const raw = req.url ?? "/";
      if (raw.includes("..") || raw.includes("%") || raw.includes("\\") || raw.includes("//")) {
        res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
        return;
      }
      const url = new URL(raw, "http://internal");
      const pathname = url.pathname;

      if (req.method !== "GET") {
        res.writeHead(405, { allow: "GET" }).end();
        return;
      }

      if (pathname === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
        return;
      }

      if (pathname === "/internal/lyfta/summary") {
        res
          .writeHead(200, { "content-type": "application/json", "cache-control": "no-store" })
          .end(JSON.stringify(buildLyftaSummary(opts.db, config.lyftaApiKey !== undefined)));
        return;
      }

      if (pathname === "/internal/lyfta/progress") {
        const exerciseId = Number(url.searchParams.get("exercise_id"));
        if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
          res.writeHead(400, { "content-type": "application/json" }).end('{"error":"exercise_id required"}');
          return;
        }
        const daysRaw = Number(url.searchParams.get("days") ?? 365);
        const days = Number.isInteger(daysRaw) ? Math.min(Math.max(daysRaw, 7), 3650) : 365;
        res
          .writeHead(200, { "content-type": "application/json", "cache-control": "no-store" })
          .end(JSON.stringify(buildLyftaProgress(opts.db, exerciseId, days)));
        return;
      }

      res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
    } catch (error) {
      console.error("internal request failed:", error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" }).end('{"error":"internal"}');
      } else {
        res.end();
      }
    }
  });
}
