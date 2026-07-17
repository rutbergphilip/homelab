import { config } from "./config";
import { getDb } from "./db/index";
import { createHttpServer, createInternalServer } from "./server";
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
const internalServer = createInternalServer({ db });

server.listen(config.port, () => {
  console.log(`kcal-assistant listening on :${config.port} (db: ${config.dbPath})`);
});
internalServer.listen(config.internalPort, () => {
  console.log(`kcal-assistant internal API listening on :${config.internalPort}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down`);
  let pending = 2;
  const closed = (): void => {
    pending -= 1;
    if (pending === 0) {
      db.close();
      process.exit(0);
    }
  };
  server.close(closed);
  internalServer.close(closed);
  // NFS or a stuck client shouldn't block pod termination.
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
