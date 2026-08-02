import type { Domain } from "../../core/domain";
import { FRAGRANCE_MIGRATIONS } from "./db";
import { registerFragranceTools } from "./tools";

export const fragranceDomain: Domain = {
  name: "fragrance",
  description: "Philip's fragrance collection: bottles, Fragrantica knowledge snapshots, wear journal.",
  migrations: FRAGRANCE_MIGRATIONS,
  register: registerFragranceTools,
};
