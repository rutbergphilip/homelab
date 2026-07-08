import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { saveRecipe, getRecipe, findRecipes, deleteRecipe } from "../src/db/recipes";

// Synthetic fixtures only — public repo.
let db: Database;
let chickenId: number;
let shakeId: number;

beforeEach(() => {
  db = openDb(":memory:");
  chickenId = saveProduct(db, {
    name: "Testkyckling",
    per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
  }).id;
  shakeId = saveProduct(db, {
    name: "Testshake",
    per_100g: { kcal: 60, protein: 11, fat: 0.4, carbs: 3.1 },
    portions: [{ name: "flaska", grams: 330 }],
  }).id;
});

function makeRecipe() {
  return saveRecipe(db, {
    name: "Testgryta",
    instructions: "Blanda allt. Airfryer 12 min.",
    tags: "mealprep,test",
    servings: 4,
    ingredients: [
      { product_id: chickenId, grams: 500 },
      { product_id: shakeId, portion_name: "flaska", quantity: 2 },
      { description: "Kryddmix", macros: { kcal: 10, protein: 0, fat: 0, carbs: 2 } },
    ],
  });
}

describe("saveRecipe / getRecipe", () => {
  test("creates with mixed ingredients and returns live totals + per_serving", () => {
    const recipe = makeRecipe();
    expect(recipe.id).toBeGreaterThan(0);
    expect(recipe.ingredients).toHaveLength(3);
    // chicken 500g: 530/115/7.5/0; shake 2 flaskor (660g): 396/72.6/2.7/20.5; krydda 10/0/0/2
    expect(recipe.totals.kcal).toBe(936);
    expect(recipe.totals.protein).toBe(187.6);
    expect(recipe.per_serving!.kcal).toBe(234);
    expect(recipe.per_serving!.protein).toBe(46.9);
    expect(recipe.totals_incomplete).toBeUndefined();
  });

  test("HEADLINE: correcting a product updates recipe totals at next read", () => {
    const recipe = makeRecipe();
    saveProduct(db, {
      id: chickenId,
      name: "Testkyckling",
      per_100g: { kcal: 200, protein: 23, fat: 1.5, carbs: 0 },
    });
    const after = getRecipe(db, recipe.id)!;
    expect(after.totals.kcal).toBe(936 + 470); // chicken 500g: 530 -> 1000
  });

  test("HEADLINE: changing a portion's grams re-resolves portion ingredients (verbatim input)", () => {
    const recipe = makeRecipe();
    saveProduct(db, {
      id: shakeId,
      name: "Testshake",
      portions: [{ name: "flaska", grams: 400 }], // 330 -> 400
    });
    const after = getRecipe(db, recipe.id)!;
    // shake 2 flaskor now 800g: 480 kcal (was 396)
    expect(after.totals.kcal).toBe(936 - 396 + 480);
  });

  test("HEADLINE: renaming a product shows the new name (description not fed back)", () => {
    const recipe = makeRecipe();
    saveProduct(db, { id: chickenId, name: "Ny Kycklingprodukt" });
    const after = getRecipe(db, recipe.id)!;
    expect(after.ingredients[0]!.description).toBe("Ny Kycklingprodukt");
  });

  test("partial update preserves omitted fields; empty string clears notes", () => {
    const recipe = saveRecipe(db, { ...recipeInputBase(), notes: "gammal anteckning" });
    const updated = saveRecipe(db, { id: recipe.id, name: "Testgryta", notes: "" });
    expect(updated.notes).toBeNull();
    expect(updated.instructions).toBe("Blanda allt. Airfryer 12 min.");
    expect(updated.tags).toBe("mealprep,test");
    expect(updated.servings).toBe(4);
    expect(updated.ingredients).toHaveLength(3);
  });

  test("servings: null clears; product_id links and null unlinks", () => {
    const recipe = makeRecipe();
    const linked = saveRecipe(db, { id: recipe.id, name: "Testgryta", product_id: chickenId });
    expect(linked.product_id).toBe(chickenId);
    const cleared = saveRecipe(db, { id: recipe.id, name: "Testgryta", servings: null, product_id: null });
    expect(cleared.servings).toBeNull();
    expect(cleared.product_id).toBeNull();
    expect(cleared.per_serving).toBeNull();
  });

  test("ingredients replace wholesale; empty array rejected; create without ingredients rejected", () => {
    const recipe = makeRecipe();
    const replaced = saveRecipe(db, {
      id: recipe.id,
      name: "Testgryta",
      ingredients: [{ product_id: chickenId, grams: 100 }],
    });
    expect(replaced.ingredients).toHaveLength(1);
    expect(replaced.totals.kcal).toBe(106);
    expect(() => saveRecipe(db, { id: recipe.id, name: "Testgryta", ingredients: [] })).toThrow();
    expect(() => saveRecipe(db, { name: "Utan ingredienser" })).toThrow(/ingredien/i);
  });

  test("unresolvable ingredient at save fails early", () => {
    expect(() =>
      saveRecipe(db, { name: "Trasig", ingredients: [{ product_id: 99999, grams: 100 }] }),
    ).toThrow(/not found/);
  });

  test("product deleted after save: unresolved with reason, totals_incomplete, no throw", () => {
    const recipe = makeRecipe();
    db.run("DELETE FROM products WHERE id = ?", [chickenId]);
    const after = getRecipe(db, recipe.id)!;
    const broken = after.ingredients.find((i) => i.unresolved);
    expect(broken!.reason).toContain("tagits bort");
    expect(after.totals_incomplete).toBe(true);
    expect(after.totals.kcal).toBe(936 - 530); // chicken excluded
  });

  test("ingredient order follows insertion position", () => {
    const recipe = makeRecipe();
    expect(getRecipe(db, recipe.id)!.ingredients.map((i) => i.description)).toEqual([
      "Testkyckling",
      "Testshake",
      "Kryddmix",
    ]);
  });

  test("unknown ids error cleanly", () => {
    expect(getRecipe(db, 999)).toBeNull();
    expect(() => saveRecipe(db, { id: 999, name: "X" })).toThrow(/not found/);
    expect(() => deleteRecipe(db, 999)).toThrow(/not found/);
  });
});

function recipeInputBase() {
  return {
    name: "Testgryta",
    instructions: "Blanda allt. Airfryer 12 min.",
    tags: "mealprep,test",
    servings: 4,
    ingredients: [
      { product_id: chickenId, grams: 500 },
      { product_id: shakeId, portion_name: "flaska", quantity: 2 },
      { description: "Kryddmix", macros: { kcal: 10, protein: 0, fat: 0, carbs: 2 } },
    ],
  };
}

describe("findRecipes / deleteRecipe", () => {
  test("finds by name and by tag, returns kcal_per_serving", () => {
    makeRecipe();
    saveRecipe(db, {
      name: "Kvällsdipp",
      tags: "filmkväll",
      ingredients: [{ description: "Dipp", macros: { kcal: 300, protein: 20, fat: 5, carbs: 40 } }],
    });
    expect(findRecipes(db, "gryta").map((r) => r.name)).toEqual(["Testgryta"]);
    expect(findRecipes(db, "filmkväll").map((r) => r.name)).toEqual(["Kvällsdipp"]);
    expect(findRecipes(db).length).toBe(2);
    const gryta = findRecipes(db, "gryta")[0]!;
    expect(gryta.kcal_per_serving).toBe(234);
  });

  test("a broken recipe still lists, marked incomplete", () => {
    const recipe = makeRecipe();
    db.run("DELETE FROM products WHERE id = ?", [chickenId]);
    const summary = findRecipes(db).find((r) => r.id === recipe.id)!;
    expect(summary.incomplete).toBe(true);
  });

  test("delete cascades ingredients", () => {
    const recipe = makeRecipe();
    deleteRecipe(db, recipe.id);
    expect(getRecipe(db, recipe.id)).toBeNull();
    const rows = db.query<{ n: number }, []>("SELECT count(*) AS n FROM recipe_ingredients").get()!;
    expect(rows.n).toBe(0);
  });
});
