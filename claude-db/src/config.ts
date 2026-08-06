function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  get token(): string {
    return requireEnv("MCP_TOKEN");
  },
  dbPath: process.env.DB_PATH ?? "./claude.db",
  port: Number(process.env.PORT ?? 3000),
  // Cluster-internal-only listener (kcal-assistant's Träning view) — never
  // routed through the ingress, gated by a CiliumNetworkPolicy instead.
  internalPort: Number(process.env.INTERNAL_PORT ?? 3001),
  // Optional: without it the lyfta domain serves synced data but can't reach
  // the Lyfta API. Empty string counts as unset (SOPS placeholder safety).
  lyftaApiKey: process.env.LYFTA_API_KEY || undefined,
  lyftaBaseUrl: process.env.LYFTA_BASE_URL ?? "https://my.lyfta.app",
  lyftaSyncIntervalMin: Number(process.env.LYFTA_SYNC_INTERVAL_MIN ?? 60),
};
