// Bulk-import products via the MCP API itself:
//   bun scripts/seed.ts --url https://kcal.rutberg.dev/mcp/<token> --file seed/products.json
// The file is a JSON array shaped like seed/products.example.json.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function arg(name: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) {
    console.error(`Usage: bun scripts/seed.ts --url <mcp-url> --file <products.json>`);
    process.exit(1);
  }
  return value;
}

const url = arg("url");
const file = arg("file");

const products: unknown[] = await Bun.file(file).json();
if (!Array.isArray(products)) throw new Error("Seed file must be a JSON array");

const client = new Client({ name: "kcal-seed", version: "0.1.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(url)));

let ok = 0;
let failed = 0;
for (const product of products) {
  const name = (product as { name?: string }).name ?? "<namnlös>";
  const result = await client.callTool({ name: "save_product", arguments: product as Record<string, unknown> });
  if (result.isError) {
    failed++;
    const detail = (result.content as Array<{ text?: string }>)[0]?.text;
    console.error(`FAIL  ${name}: ${detail}`);
  } else {
    ok++;
    console.log(`ok    ${name}`);
  }
}

await client.close();
console.log(`\nDone: ${ok} saved, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
