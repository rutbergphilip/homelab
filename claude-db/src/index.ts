import { config } from "./config";
import { openDb } from "./core/db";
import { DOMAINS } from "./core/registry";
import { createHttpServer } from "./server";
import { createInternalServer } from "./internal";
import { defaultLyftaClient } from "./domains/lyfta";
import { makeAutoSync } from "./domains/lyfta/sync";

const db = openDb(config.dbPath, DOMAINS); // opens + migrates before we accept traffic
const server = createHttpServer({ token: config.token, db });
const internal = createInternalServer({ db });

server.listen(config.port, () => {
  console.log(
    `claude-db listening on :${config.port} (db: ${config.dbPath}, domains: ${DOMAINS.map((d) => d.name).join(", ")})`,
  );
});
internal.listen(config.internalPort, () => {
  console.log(`claude-db internal listening on :${config.internalPort}`);
});

// Hourly Lyfta pull keeps kcal's Träning view fresh without kcal ever being
// able to trigger a sync. No key → no timers; the domain still serves what
// was synced before (or nothing, cleanly).
const lyftaClient = defaultLyftaClient();
const timers: Array<ReturnType<typeof setTimeout>> = [];
if (lyftaClient && config.lyftaSyncIntervalMin > 0) {
  const run = makeAutoSync(db, lyftaClient);
  timers.push(setTimeout(run, 5_000));
  timers.push(setInterval(run, config.lyftaSyncIntervalMin * 60_000));
}

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down`);
  for (const t of timers) clearTimeout(t as ReturnType<typeof setTimeout>);
  internal.close();
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // NFS or a stuck client shouldn't block pod termination.
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
