import { describe, expect, test, beforeEach, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { openDb } from "../src/db/index";
import { migrate } from "../src/db/migrations";
import { saveProduct, searchProducts } from "../src/db/products";
import { createHttpServer } from "../src/server";
import { PRODUCT_CATEGORIES } from "../src/lib/categories";

let db: Database;

beforeEach(() => {
  db = openDb(":memory:");
});

describe("migration 7: product category column", () => {
  test("category column exists on products", () => {
    const columns = db
      .query<{ name: string }, []>("PRAGMA table_info(products)")
      .all()
      .map((c) => c.name);
    expect(columns).toContain("category");
  });

  test("re-running migrations is a no-op", () => {
    const before = db.query<{ user_version: number }, []>("PRAGMA user_version").get()!
      .user_version;
    expect(() => migrate(db)).not.toThrow();
    const after = db.query<{ user_version: number }, []>("PRAGMA user_version").get()!
      .user_version;
    expect(after).toBe(before);
  });
});

describe("saveProduct: category persistence", () => {
  test("saving a product with category persists it", () => {
    const product = saveProduct(db, {
      name: "Chokladboll",
      per_100g: { kcal: 400, protein: 5, fat: 20, carbs: 45 },
      category: "godis",
    });
    expect(product.category).toBe("godis");
  });

  test("update omitting category preserves it", () => {
    const created = saveProduct(db, {
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "kött/fisk",
    });
    const updated = saveProduct(db, {
      id: created.id,
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
    });
    expect(updated.category).toBe("kött/fisk");
  });

  test("update with empty string clears category to NULL", () => {
    const created = saveProduct(db, {
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "kött/fisk",
    });
    const updated = saveProduct(db, {
      id: created.id,
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "",
    });
    expect(updated.category).toBeNull();
  });
});

describe("searchProducts: category filter", () => {
  beforeEach(() => {
    saveProduct(db, {
      name: "Chokladboll",
      per_100g: { kcal: 400, protein: 5, fat: 20, carbs: 45 },
      category: "godis",
    });
    saveProduct(db, {
      name: "Chokladmusli",
      per_100g: { kcal: 380, protein: 8, fat: 10, carbs: 60 },
      category: "frukost",
    });
  });

  test("filter returns only matching category", () => {
    const results = searchProducts(db, "choklad", 8, "godis");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Chokladboll");
  });

  test("filter with no matches returns empty array", () => {
    const results = searchProducts(db, "choklad", 8, "dryck");
    expect(results).toEqual([]);
  });
});

describe("MCP tools layer: category validation + suggestion contract", () => {
  const TOKEN = "test-token-categories";
  let httpServer: Server;
  let toolsDb: Database;
  let baseUrl: string;

  beforeAll(async () => {
    toolsDb = openDb(":memory:");
    httpServer = createHttpServer({ token: TOKEN, db: toolsDb, uiAuth: { mode: "unconfigured" } });
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => httpServer.close(resolve));
  });

  async function connect(): Promise<Client> {
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp/${TOKEN}`)));
    return client;
  }

  function parseResult(result: Awaited<ReturnType<Client["callTool"]>>): any {
    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0]!.text);
  }

  test("save_product with an invalid category returns a Swedish error listing the full vocabulary", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "save_product",
      arguments: {
        name: "Konstig produkt",
        per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 2 },
        category: "nonsense-category",
      },
    });
    expect(result.isError).toBe(true);
    const body = parseResult(result);
    expect(body.error).toContain("Ogiltig kategori");
    for (const cat of PRODUCT_CATEGORIES) {
      expect(body.error).toContain(cat);
    }
    await client.close();
  });

  test("save_product with a valid category round-trips through the tool", async () => {
    const client = await connect();
    const saved = parseResult(
      await client.callTool({
        name: "save_product",
        arguments: {
          name: "Chokladboll MCP",
          per_100g: { kcal: 400, protein: 5, fat: 20, carbs: 45 },
          category: "godis",
        },
      }),
    );
    expect(saved.category).toBe("godis");

    const fetched = parseResult(await client.callTool({ name: "get_product", arguments: { id: saved.id } }));
    expect(fetched.category).toBe("godis");
    await client.close();
  });

  test("save_product with category '' on create yields category null (never persists literal empty string)", async () => {
    const client = await connect();
    const saved = parseResult(
      await client.callTool({
        name: "save_product",
        arguments: {
          name: "Produkt utan kategori",
          per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 2 },
          category: "",
        },
      }),
    );
    expect(saved.category).toBeNull();
    await client.close();
  });

  test("save_product with category '' on update clears it (bypasses vocabulary validation)", async () => {
    const client = await connect();
    const saved = parseResult(
      await client.callTool({
        name: "save_product",
        arguments: {
          name: "Produkt med kategori",
          per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 2 },
          category: "snacks",
        },
      }),
    );
    expect(saved.category).toBe("snacks");

    const cleared = parseResult(
      await client.callTool({
        name: "save_product",
        arguments: { id: saved.id, name: "Produkt med kategori", category: "" },
      }),
    );
    expect(cleared.category).toBeNull();
    await client.close();
  });

  test("search_products passes a valid category filter through to the db layer", async () => {
    const client = await connect();
    await client.callTool({
      name: "save_product",
      arguments: {
        name: "Chipspåse MCP",
        per_100g: { kcal: 500, protein: 5, fat: 30, carbs: 50 },
        category: "snacks",
        aliases: ["mcp-chips"],
      },
    });
    await client.callTool({
      name: "save_product",
      arguments: {
        name: "Chokladkaka MCP",
        per_100g: { kcal: 500, protein: 5, fat: 30, carbs: 50 },
        category: "godis",
        aliases: ["mcp-chips-liknande"],
      },
    });

    const hits = parseResult(
      await client.callTool({
        name: "search_products",
        arguments: { query: "mcp", category: "snacks" },
      }),
    );
    const names = hits.candidates.map((c: any) => c.name);
    expect(names).toContain("Chipspåse MCP");
    expect(names).not.toContain("Chokladkaka MCP");
    await client.close();
  });

  test("search_products with an invalid category filter returns the same Swedish error", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "search_products",
      arguments: { query: "choklad", category: "not-a-real-category" },
    });
    expect(result.isError).toBe(true);
    const body = parseResult(result);
    expect(body.error).toContain("Ogiltig kategori");
    for (const cat of PRODUCT_CATEGORIES) {
      expect(body.error).toContain(cat);
    }
    await client.close();
  });

  test("get_context includes the product-category vocabulary line", async () => {
    const client = await connect();
    const ctx = parseResult(await client.callTool({ name: "get_context", arguments: {} }));
    const flat = JSON.stringify(ctx);
    expect(flat).toContain("Produktkategorier:");
    for (const cat of PRODUCT_CATEGORIES) {
      expect(flat).toContain(cat);
    }
    await client.close();
  });
});
