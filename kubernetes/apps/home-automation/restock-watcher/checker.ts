// Polls a Shopify product .js endpoint and posts to a Discord webhook when any
// variant is in stock. Zero dependencies. Runs under `bun run checker.ts`.

import { readFile, writeFile } from "node:fs/promises";

const STORE_BASE = process.env.STORE_BASE ?? "https://escentica.se";
const PRODUCT_HANDLE = process.env.PRODUCT_HANDLE ?? "blonde-amber";
const WEBHOOK = requireEnv("DISCORD_WEBHOOK_URL");
const STATE_FILE = process.env.STATE_FILE; // unset => stateless (ping every run)
const RENOTIFY_MINUTES = Number(process.env.RENOTIFY_MINUTES ?? "60");
const FORCE_NOTIFY = process.env.FORCE_NOTIFY === "true"; // for testing the webhook
const MENTION_USER_ID = process.env.DISCORD_MENTION_USER_ID; // ping this user on notify
const USER_AGENT =
  process.env.USER_AGENT ?? "homelab-restock-watcher/1.0 (personal use)";

type Variant = {
  id: number;
  title: string;
  available: boolean;
  price: number; // minor units (öre)
};
type ProductJs = { title: string; variants: Variant[] };
type State = { availableIds: number[]; lastNotifiedAt: number };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function fetchProduct(): Promise<ProductJs> {
  const url = `${STORE_BASE}/products/${PRODUCT_HANDLE}.js`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Shopify fetch failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as ProductJs;
}

async function readState(): Promise<State> {
  if (!STATE_FILE) return { availableIds: [], lastNotifiedAt: 0 };
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8")) as State;
  } catch {
    return { availableIds: [], lastNotifiedAt: 0 }; // first run or no volume
  }
}

async function writeState(state: State): Promise<void> {
  if (!STATE_FILE) return;
  try {
    await writeFile(STATE_FILE, JSON.stringify(state), "utf8");
  } catch (err) {
    console.warn(`Could not persist state (running effectively stateless): ${err}`);
  }
}

async function notifyDiscord(product: ProductJs, available: Variant[]): Promise<void> {
  const productUrl = `${STORE_BASE}/products/${PRODUCT_HANDLE}`;
  const lines = available
    .map((v) => `• **${v.title}** — ${Math.round(v.price / 100)} kr`)
    .join("\n");

  const body = {
    username: "Restock Watcher",
    // Mentions only ping when placed in `content`, not inside an embed.
    content: MENTION_USER_ID ? `<@${MENTION_USER_ID}>` : undefined,
    allowed_mentions: MENTION_USER_ID ? { users: [MENTION_USER_ID] } : undefined,
    embeds: [
      {
        title: `🟢 ${product.title} is back in stock`,
        url: productUrl,
        description: `In stock now:\n${lines}\n\n[Go grab it →](${productUrl})`,
        color: 0x2ecc71,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  // Discord returns 204 No Content on success.
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const product = await fetchProduct();
  const available = product.variants.filter((v) => v.available);

  // Always log the full variant summary so you can confirm coverage in CronJob logs.
  console.log(
    `[${new Date().toISOString()}] ${product.title}: ` +
      product.variants
        .map((v) => `${v.title}=${v.available ? "IN" : "out"}`)
        .join(", "),
  );

  if (available.length === 0 && !FORCE_NOTIFY) {
    await writeState({ availableIds: [], lastNotifiedAt: (await readState()).lastNotifiedAt });
    return;
  }

  const prev = await readState();
  const prevSet = new Set(prev.availableIds);
  const newlyAvailable = available.filter((v) => !prevSet.has(v.id));
  const renotifyDue =
    available.length > 0 &&
    Date.now() - prev.lastNotifiedAt > RENOTIFY_MINUTES * 60_000;

  if (FORCE_NOTIFY || newlyAvailable.length > 0 || renotifyDue) {
    await notifyDiscord(product, available.length ? available : product.variants.slice(0, 1));
    await writeState({
      availableIds: available.map((v) => v.id),
      lastNotifiedAt: Date.now(),
    });
    console.log(`Notified Discord (${available.length} variant(s) in stock).`);
  } else {
    await writeState({ availableIds: available.map((v) => v.id), lastNotifiedAt: prev.lastNotifiedAt });
    console.log("In stock but already notified — skipping (within re-notify window).");
  }
}

main().catch((err) => {
  console.error(`Run failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
