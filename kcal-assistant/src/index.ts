import { config } from "./config";
import { getDb } from "./db/index";
import { createHttpServer } from "./server";
import { resolveUiAuthState } from "./ui/auth";

const db = getDb(); // opens + migrates before we accept traffic
const uiAuth = resolveUiAuthState({
  authentikEmail: config.authentikAllowedEmail,
  teamDomain: config.cfAccessTeamDomain,
  aud: config.cfAccessAud,
  email: config.cfAccessEmail,
  devNoAuth: config.uiDevNoAuth,
  nodeEnv: config.nodeEnv,
});
console.log(`ui auth mode: ${uiAuth.mode}`);
const server = createHttpServer({ token: config.token, db, uiAuth });

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
