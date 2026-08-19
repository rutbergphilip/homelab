// Seeds the MCP endpoint from seed/jokes/*.json — doubles as the end-to-end
// smoke test after a deploy. Idempotent: a joke whose exact text already
// exists is skipped.
//
// Usage: MCP_URL=https://claude.rutberg.dev/mcp/<token> bun run scripts/seed-jokes.ts
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

const existing = await call("joke_find", { include_retired: true });
if (!existing.ok) throw new Error(`joke_find failed: ${existing.body}`);
const texts = new Set(
  (JSON.parse(existing.body) as { jokes: Array<{ text: string }> }).jokes.map((j) => j.text),
);

const dir = new URL("../seed/jokes/", import.meta.url);
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const joke = (await Bun.file(new URL(file, dir)).json()) as { text: string };
  if (texts.has(joke.text)) {
    console.log(`skipped (exists): ${joke.text}`);
    continue;
  }
  const added = await call("joke_add", joke);
  console.log(added.ok ? `added: ${joke.text}` : `FAILED ${file}: ${added.body}`);
  if (!added.ok) process.exitCode = 1;
}
