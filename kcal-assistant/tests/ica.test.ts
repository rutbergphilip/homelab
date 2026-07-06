import { describe, expect, test } from "bun:test";
import { parseNutritionTable } from "../src/services/ica";

const realTable = await Bun.file(new URL("./fixtures/ica-nutrition-table.html", import.meta.url)).text();

describe("parseNutritionTable", () => {
  test("parses the real ProPud table from ICA", () => {
    const n = parseNutritionTable(realTable);
    expect(n.basis).toBe("100 Milliliter");
    expect(n.kcal).toBe(58);
    expect(n.fat).toBe(1.5);
    expect(n.carbs).toBe(4.9);
    expect(n.protein).toBe(6.1);
  });

  test("does not confuse 'Varav mättat fett' with fat or 'Varav sockerarter' with carbs", () => {
    const n = parseNutritionTable(realTable);
    expect(n.fat).not.toBe(0.9); // mättat fett
    expect(n.carbs).toBe(4.9); // sockerarter happens to equal carbs here, but label must match Kolhydrat row
  });

  test("handles comma decimals and gram basis", () => {
    const html =
      "<table><tbody><tr><th>Näringsvärde</th><th>100 Gram</th></tr>" +
      "<tr><td>Energi (kcal)</td><td>115 kcal</td></tr>" +
      "<tr><td>Fett</td><td>2,5 g</td></tr>" +
      "<tr><td>Kolhydrat</td><td>1,8 g</td></tr>" +
      "<tr><td>Protein</td><td>22 g</td></tr></tbody></table>";
    const n = parseNutritionTable(html);
    expect(n.basis).toBe("100 Gram");
    expect(n.kcal).toBe(115);
    expect(n.fat).toBe(2.5);
    expect(n.carbs).toBe(1.8);
    expect(n.protein).toBe(22);
  });

  test("returns nulls for missing rows and garbage input", () => {
    const n = parseNutritionTable("<p>ingen tabell här</p>");
    expect(n.kcal).toBeNull();
    expect(n.protein).toBeNull();
    expect(n.fat).toBeNull();
    expect(n.carbs).toBeNull();
  });
});
