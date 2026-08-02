// Seeds the live MCP endpoint from seed/fragrances/*.json — doubles as the
// end-to-end smoke test after a deploy. Idempotent-ish: a fragrance that
// already exists (UNIQUE house+name) gets its snapshot refreshed instead.
//
// Usage: MCP_URL=https://claude.rutberg.dev/mcp/<token> bun run scripts/seed.ts
import { readdirSync } from "node:fs";

const MCP_URL = process.env.MCP_URL;
if (!MCP_URL) throw new Error("Set MCP_URL to the full endpoint incl. token");

let rpcId = 0;
async function call(name: string, args: unknown): Promise<{ ok: boolean; body: string }> {
  const res = await fetch(MCP_URL!, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "tools/call", params: { name, arguments: args } }),
  });
  const json = (await res.json()) as {
    result?: { content: Array<{ text: string }>; isError?: boolean };
    error?: { message: string };
  };
  if (json.error) return { ok: false, body: json.error.message };
  const text = json.result?.content[0]?.text ?? "";
  return { ok: !json.result?.isError, body: text };
}

const dir = new URL("../seed/fragrances/", import.meta.url);
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { meta, fragrantica } = (await Bun.file(new URL(file, dir)).json()) as {
    meta: Record<string, unknown>;
    fragrantica: Record<string, unknown>;
  };
  const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== null));
  const added = await call("fragrance_add", { ...cleanMeta, fragrantica });
  if (added.ok) {
    console.log(`added: ${meta["house"]} ${meta["name"]}`);
    continue;
  }
  if (/UNIQUE/i.test(added.body)) {
    const refreshed = await call("fragrance_save_snapshot", { name: String(meta["name"]), fragrantica });
    console.log(refreshed.ok ? `refreshed: ${meta["house"]} ${meta["name"]}` : `FAILED refresh ${file}: ${refreshed.body}`);
  } else {
    console.error(`FAILED ${file}: ${added.body}`);
    process.exitCode = 1;
  }
}
