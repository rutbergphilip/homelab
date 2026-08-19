import type { IncomingMessage, ServerResponse } from "node:http";
import type { Database } from "bun:sqlite";
import { findJokes, getTellings, knownAudienceTags, listContexts, logTelling } from "../domains/jokes/db";
import { todayStockholm } from "../core/tool-util";

// The /ui + /api paths are reachable only through the Authentik-gated ingress
// (ingress-ui.yaml). nginx's auth-response-headers SETS X-authentik-* on the
// proxied request after a successful forward-auth, replacing anything the
// client sent — so requiring the header here is defense in depth: a request
// that somehow bypassed the gate (in-cluster, misrouted location) carries none.
function authenticated(req: IncomingMessage): boolean {
  const user = req.headers["x-authentik-username"];
  return typeof user === "string" && user.length > 0;
}

const HTML_URL = new URL("./jokes.html", import.meta.url);

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf-8");
  const parsed: unknown = text.trim() === "" ? {} : JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("expected an object");
  return parsed as Record<string, unknown>;
}

// Returns true when the path belongs to the UI/API surface (even on errors),
// false when the caller should keep dispatching.
export async function handleUiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  db: Database,
  pathname: string,
): Promise<boolean> {
  const isUi = pathname === "/ui/jokes";
  const isApi = pathname.startsWith("/api/");
  if (!isUi && !isApi) return false;

  if (!authenticated(req)) {
    json(res, 403, { error: "forbidden" });
    return true;
  }

  if (isUi) {
    if (req.method !== "GET") {
      res.writeHead(405, { allow: "GET" }).end();
      return true;
    }
    const html = await Bun.file(HTML_URL).text();
    res
      .writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" })
      .end(html);
    return true;
  }

  if (pathname === "/api/jokes" && req.method === "GET") {
    const jokes = findJokes(db, { include_retired: true }).map((j) => ({
      ...j,
      tellings: getTellings(db, j.id),
    }));
    json(res, 200, { jokes, contexts: listContexts(db), audience_tags: knownAudienceTags(db) });
    return true;
  }

  const tellingMatch = pathname.match(/^\/api\/jokes\/(\d+)\/tellings$/);
  if (tellingMatch && req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      json(res, 400, { error: "invalid JSON body" });
      return true;
    }
    try {
      const telling = logTelling(db, {
        joke_id: Number(tellingMatch[1]),
        told_on: typeof body["told_on"] === "string" ? body["told_on"] : todayStockholm(),
        context: typeof body["context"] === "string" ? body["context"] : undefined,
        audience: Array.isArray(body["audience"]) ? body["audience"].map(String) : undefined,
        rating: typeof body["rating"] === "number" ? body["rating"] : undefined,
        note: typeof body["note"] === "string" ? body["note"] : undefined,
      });
      json(res, 201, telling);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      json(res, /not found/.test(message) ? 404 : 400, { error: message });
    }
    return true;
  }

  json(res, 404, { error: "not found" });
  return true;
}
