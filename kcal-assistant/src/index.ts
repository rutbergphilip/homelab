import { config } from "./config";
import { getDb } from "./db/index";
import { createHttpServer } from "./server";

const db = getDb(); // opens + migrates before we accept traffic
const server = createHttpServer({ token: config.token, db });

server.listen(config.port, () => {
  console.log(`kcal-assistant listening on :${config.port} (db: ${config.dbPath})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // NFS or a stuck client shouldn't block pod termination.
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
