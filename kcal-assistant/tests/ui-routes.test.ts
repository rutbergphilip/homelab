import { describe, expect, test } from "bun:test";
import { matchRoute } from "../src/ui/app/lib/routes";

describe("matchRoute", () => {
  test("catalogue views go wide", () => {
    for (const hash of ["#/produkter", "#/recept", "#/vecka", "#/traning"]) {
      expect(matchRoute(hash)?.width).toBe("wide");
    }
  });

  test("single-subject views stay narrow", () => {
    for (const hash of ["#/idag", "#/vikt", "#/regler", "#/dagar"]) {
      expect(matchRoute(hash)?.width).toBe("narrow");
    }
  });

  test("a detail route is narrow even though its tab is wide", () => {
    const recipe = matchRoute("#/recept/12")!;
    expect(recipe.tab).toBe("recept");
    expect(recipe.width).toBe("narrow");
    expect(recipe.param).toBe("12");

    const day = matchRoute("#/dagar/2026-07-26")!;
    expect(day.tab).toBe("dagar");
    expect(day.width).toBe("narrow");
    expect(day.param).toBe("2026-07-26");
  });

  test("every route names a view and a tab", () => {
    for (const hash of ["#/idag", "#/vecka", "#/dagar", "#/dagar/2026-07-26", "#/produkter", "#/recept", "#/recept/3", "#/vikt", "#/traning", "#/regler"]) {
      const match = matchRoute(hash)!;
      expect(match.view).toBeTruthy();
      expect(match.tab).toBeTruthy();
    }
  });

  test("unknown and malformed hashes do not match", () => {
    expect(matchRoute("#/nonsense")).toBeNull();
    expect(matchRoute("#/recept/abc")).toBeNull();
    expect(matchRoute("#/dagar/2026-7-26")).toBeNull();
    expect(matchRoute("")).toBeNull();
  });
});
