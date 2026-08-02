import type { Domain } from "../../core/domain";
import { COLLECTIONS_MIGRATIONS } from "./db";
import { registerCollectionsTools } from "./tools";

export const collectionsDomain: Domain = {
  name: "collections",
  description: "Generic ad-hoc collections: named lists of JSON items Claude can create from chat.",
  migrations: COLLECTIONS_MIGRATIONS,
  register: registerCollectionsTools,
};
