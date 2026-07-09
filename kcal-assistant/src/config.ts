function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  get token(): string {
    return requireEnv("MCP_TOKEN");
  },
  dbPath: process.env.DB_PATH ?? "./kcal.db",
  port: Number(process.env.PORT ?? 3000),
  icaStoreId: process.env.ICA_STORE_ID ?? "1003421", // Maxi ICA Stormarknad Nynäshamn
  authentikAllowedEmail: process.env.AUTHENTIK_ALLOWED_EMAIL,
  cfAccessTeamDomain: process.env.CF_ACCESS_TEAM_DOMAIN,
  cfAccessAud: process.env.CF_ACCESS_AUD,
  cfAccessEmail: process.env.CF_ACCESS_EMAIL,
  uiDevNoAuth: process.env.UI_DEV_NO_AUTH === "1",
  nodeEnv: process.env.NODE_ENV,
};
