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
};
