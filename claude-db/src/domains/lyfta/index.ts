import type { Domain } from "../../core/domain";
import { config } from "../../config";
import { createLyftaClient, type LyftaClient } from "./client";
import { LYFTA_MIGRATIONS } from "./db";
import { registerLyftaTools } from "./tools";

// Null until the key is applied: local (synced-data) tools keep working,
// live tools explain what's missing instead of failing opaquely.
export function defaultLyftaClient(): LyftaClient | null {
  return config.lyftaApiKey
    ? createLyftaClient({ apiKey: config.lyftaApiKey, baseUrl: config.lyftaBaseUrl })
    : null;
}

export const lyftaDomain: Domain = {
  name: "lyfta",
  description: "Philip's Lyfta gym log: synced workouts and sets, strength progression, program pushes into the app.",
  migrations: LYFTA_MIGRATIONS,
  register: (server, db) => registerLyftaTools(server, db, defaultLyftaClient()),
};
