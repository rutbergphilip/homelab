import type { Domain } from "../../core/domain";
import { JOKES_MIGRATIONS } from "./db";
import { registerJokesTools } from "./tools";

export const jokesDomain: Domain = {
  name: "jokes",
  description:
    "Philip's personal joke repertoire: delivery notes, risk + per-context verdicts, trigger situations, and a telling log.",
  migrations: JOKES_MIGRATIONS,
  register: registerJokesTools,
};
