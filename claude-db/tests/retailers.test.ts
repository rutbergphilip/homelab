import { describe, expect, test } from "bun:test";
import {
  parseDelooxProductLd,
  parseDelooxSuggest,
  parseKicks,
  parsePriceSek,
  parseSizeMl,
} from "../src/domains/fragrance/retailers";

describe("price/size parsing", () => {
  test("swedish price formats", () => {
    expect(parsePriceSek("2 625 kr")).toBe(2625);
    expect(parsePriceSek("2213.00")).toBe(2213);
    expect(parsePriceSek("1 299,50 kr")).toBe(1299.5);
    expect(parsePriceSek("")).toBeNull();
    expect(parsePriceSek(null)).toBeNull();
  });

  test("size from names and urls", () => {
    expect(parseSizeMl("Aventus Eau de Parfum 50 ml")).toBe(50);
    expect(parseSizeMl("Le Male Elixir 125ml")).toBe(125);
    expect(parseSizeMl("https://www.deloox.se/produkt/1/creed-aventus-eau-de-parfum-50-ml.html")).toBe(50);
    expect(parseSizeMl("bara en parfym")).toBeNull();
  });
});

describe("kicks parser", () => {
  const FIXTURE = JSON.stringify({
    products: {
      items: [
        {
          id: 94101806,
          name: "Aventus Eau de Parfum 50 ml",
          brandName: "Creed",
          price: { priceText: "2 625 kr" },
          linkAction: { url: "/creed-aventus-edp-50-ml?search-query=aventus" },
        },
        { name: "Aventus Cologne 100 ml", brandName: "Creed", price: { priceText: "3 095 kr" }, linkAction: { url: "/x" } },
      ],
    },
  });

  test("extracts name/brand/price/size/url", () => {
    const hits = parseKicks(FIXTURE, 5);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toEqual({
      retailer: "kicks",
      name: "Aventus Eau de Parfum 50 ml",
      brand: "Creed",
      price_sek: 2625,
      size_ml: 50,
      url: "https://www.kicks.se/creed-aventus-edp-50-ml?search-query=aventus",
    });
  });

  test("respects limit and empty payloads", () => {
    expect(parseKicks(FIXTURE, 1)).toHaveLength(1);
    expect(parseKicks("{}", 5)).toHaveLength(0);
  });
});

describe("deloox parsers", () => {
  const SUGGEST = `
    <a data-title="aventus" href="https://www.deloox.se/produkt/1148490/creed-aventus-eau-de-parfum-50-ml.html" class="c-option suggested-product">
      <div class="c-imagethumb"><img src="x.jpg"></div>
      <span class="c-name">Creed Aventus Eau de Parfum</span>
    </a>
    <a data-title="aventus" href="https://www.deloox.se/produkt/1309497/creed-absolu-aventus-eau-de-parfum-limited-edition-75-ml.html" class="c-option suggested-product">
      <span class="c-name">Creed Absolu Aventus Eau de Parfum Limited edition</span>
    </a>`;

  test("suggest decodes html entities in names", () => {
    const html = `<a href="https://www.deloox.se/produkt/1/x.html"><span class="c-name">Kilian Angels&#039; Share &amp; Co</span></a>`;
    expect(parseDelooxSuggest(html, 5)[0]!.name).toBe("Kilian Angels' Share & Co");
  });

  test("suggest extracts product urls + names", () => {
    const hits = parseDelooxSuggest(SUGGEST, 5);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.name).toBe("Creed Aventus Eau de Parfum");
    expect(hits[1]!.url).toContain("absolu-aventus");
    expect(parseDelooxSuggest(SUGGEST, 1)).toHaveLength(1);
  });

  test("product JSON-LD price + brand", () => {
    const page = `{"@type":"Product","brand":{"@type":"Brand","name":"Creed"},"offers":{"@type":"Offer","priceCurrency":"SEK","price":"2213.00","itemCondition":"http:\\/\\/schema.org\\/NewCondition"}}`;
    expect(parseDelooxProductLd(page)).toEqual({ price_sek: 2213, brand: "Creed" });
    expect(parseDelooxProductLd("<html>nope</html>")).toEqual({ price_sek: null, brand: null });
  });
});
