import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { createHttpServer } from "../src/server";
import { saveProduct } from "../src/db/products";
import {
  clearProductImage,
  getImageStatus,
  getProductImage,
  productIdsWithImage,
  productsNeedingImage,
  saveProductImage,
} from "../src/db/product-images";
import { runBackfill, type ImageDeps } from "../src/services/product-images";
import type { IcaSearchHit } from "../src/services/ica";

const TOKEN = "test-token";
let httpServer: Server;
let db: Database;
let base: string;
let withPhoto: number;
let withoutPhoto: number;

const BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x57, 0x45, 0x42, 0x50]);

beforeAll(async () => {
  db = openDb(":memory:");
  withPhoto = saveProduct(db, { name: "Bildprodukt", per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 } }).id;
  withoutPhoto = saveProduct(db, { name: "Bildlös produkt" }).id;
  saveProductImage(db, {
    product_id: withPhoto,
    bytes: BYTES,
    content_type: "image/webp",
    source_ref: "2080622",
    matched_name: "Bildprodukt 500g ICA",
    score: 0.92,
  });
  httpServer = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "dev-bypass" } });
  await new Promise<void>((r) => httpServer.listen(0, r));
  base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => httpServer.close(r));
});

describe("GET /ui/api/products/:id/image", () => {
  test("serves the stored bytes with the stored content type", async () => {
    const res = await fetch(`${base}/ui/api/products/${withPhoto}/image`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(BYTES);
  });

  test("caches privately and offers an ETag", async () => {
    const res = await fetch(`${base}/ui/api/products/${withPhoto}/image`);
    expect(res.headers.get("cache-control")).toContain("max-age=3600");
    expect(res.headers.get("etag")).toBeTruthy();
  });

  test("revalidates to 304", async () => {
    const first = await fetch(`${base}/ui/api/products/${withPhoto}/image`);
    const etag = first.headers.get("etag")!;
    const second = await fetch(`${base}/ui/api/products/${withPhoto}/image`, {
      headers: { "if-none-match": etag },
    });
    expect(second.status).toBe(304);
  });

  test("404s for a product with no photo", async () => {
    const res = await fetch(`${base}/ui/api/products/${withoutPhoto}/image`);
    expect(res.status).toBe(404);
  });

  test("404s for a product that does not exist", async () => {
    const res = await fetch(`${base}/ui/api/products/999999/image`);
    expect(res.status).toBe(404);
  });

  test("stays read-only: PUT is rejected", async () => {
    const res = await fetch(`${base}/ui/api/products/${withPhoto}/image`, { method: "PUT" });
    expect(res.status).toBe(405);
  });
});

describe("products list", () => {
  test("flags which products have a photo", async () => {
    const body = (await (await fetch(`${base}/ui/api/products`)).json()) as {
      products: Array<{ id: number; has_image: boolean }>;
    };
    expect(body.products.find((p) => p.id === withPhoto)!.has_image).toBe(true);
    expect(body.products.find((p) => p.id === withoutPhoto)!.has_image).toBe(false);
  });
});

describe("storage layer", () => {
  test("productIdsWithImage excludes negative rows", () => {
    const scratch = openDb(":memory:");
    const a = saveProduct(scratch, { name: "Har bild" }).id;
    const b = saveProduct(scratch, { name: "Har ingen" }).id;
    saveProductImage(scratch, { product_id: a, bytes: BYTES, content_type: "image/webp" });
    saveProductImage(scratch, { product_id: b, bytes: null });
    expect(productIdsWithImage(scratch)).toEqual(new Set([a]));
    scratch.close();
  });

  test("a negative row still counts as looked-at, so it is not retried", () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Gin & Tonic" }).id;
    expect(productsNeedingImage(scratch).map((p) => p.id)).toContain(id);
    saveProductImage(scratch, { product_id: id, bytes: null });
    expect(productsNeedingImage(scratch).map((p) => p.id)).not.toContain(id);
    scratch.close();
  });

  test("locked photos are never queued for the backfill", () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Handplockad" }).id;
    saveProductImage(scratch, { product_id: id, bytes: BYTES, content_type: "image/webp", locked: true });
    expect(productsNeedingImage(scratch).map((p) => p.id)).not.toContain(id);
    expect(getImageStatus(scratch, id)!.locked).toBe(true);
    scratch.close();
  });

  test("clearing removes the row so matching can start over", () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Rensa mig" }).id;
    saveProductImage(scratch, { product_id: id, bytes: BYTES, content_type: "image/webp" });
    clearProductImage(scratch, id);
    expect(getProductImage(scratch, id)).toBeNull();
    expect(productsNeedingImage(scratch).map((p) => p.id)).toContain(id);
    scratch.close();
  });
});

// Deps are injected, so nothing here touches ICA.
function stubDeps(hits: Record<string, IcaSearchHit[]>, fetched = BYTES): ImageDeps {
  return {
    search: async (query) => hits[query] ?? [],
    fetchImage: async () => (fetched.length > 0 ? { bytes: fetched, contentType: "image/webp" } : null),
    delay: async () => {},
  };
}

const hit = (name: string, brand: string | null, id: string): IcaSearchHit => ({
  retailer_product_id: id,
  name,
  brand,
  pack_size: null,
  price_sek: null,
  available: true,
  image_path: `https://handlaprivatkund.ica.se/images-v3/x/${id}`,
});

describe("backfill", () => {
  test("saves a confident match and skips ICA's noise", async () => {
    const scratch = openDb(":memory:");
    const good = saveProduct(scratch, { name: "Kungsörnen Idealmakaroner", brand: "Kungsörnen" }).id;
    const noisy = saveProduct(scratch, { name: "Knäckebröd" }).id;

    const result = await runBackfill(
      scratch,
      stubDeps({
        "Kungsörnen Idealmakaroner": [hit("Gammaldags Idealmakaroner 750g Kungsörnen", "Kungsörnen", "a")],
        "Knäckebröd": [hit("Svart & vit knäckesticks Ekologisk 120g Vilmas", "Vilmas", "b")],
      }),
    );

    expect(result.saved).toBe(1);
    expect(result.rejected).toBe(1);
    expect(getProductImage(scratch, good)).not.toBeNull();
    expect(getProductImage(scratch, noisy)).toBeNull();
    // The rejection is recorded, not forgotten.
    expect(getImageStatus(scratch, noisy)!.has_image).toBe(false);
    scratch.close();
  });

  test("records what it matched, for later review", async () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Avokado" }).id;
    await runBackfill(scratch, stubDeps({ Avokado: [hit("Ätmogen Avokado 3-pack Klass 1 ICA", "ICA", "c")] }));
    const status = getImageStatus(scratch, id)!;
    expect(status.matched_name).toBe("Ätmogen Avokado 3-pack Klass 1 ICA");
    expect(status.source_ref).toBe("c");
    expect(status.score).toBeGreaterThanOrEqual(0.6);
    expect(status.locked).toBe(false);
    scratch.close();
  });

  test("a transient search failure is not cached as a negative", async () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Nätverket nere" }).id;
    const failing: ImageDeps = {
      search: async () => {
        throw new Error("ICA returned HTTP 503");
      },
      fetchImage: async () => null,
      delay: async () => {},
    };
    await runBackfill(scratch, failing);
    expect(getImageStatus(scratch, id)).toBeNull();
    expect(productsNeedingImage(scratch).map((p) => p.id)).toContain(id);
    scratch.close();
  });

  test("retries with a shortened query when the full name finds nothing", async () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Findus Oxpytt Originalet", brand: "Findus" }).id;
    const queried: string[] = [];
    const deps: ImageDeps = {
      search: async (query) => {
        queried.push(query);
        // Mirrors ICA: the full name ANDs to nothing, two tokens hit.
        return query === "findus oxpytt" ? [hit("Oxpytt Fryst 1,5kg Findus", "Findus", "e")] : [];
      },
      fetchImage: async () => ({ bytes: BYTES, contentType: "image/webp" }),
      delay: async () => {},
    };
    await runBackfill(scratch, deps);
    expect(queried).toEqual(["Findus Oxpytt Originalet", "findus oxpytt"]);
    expect(getProductImage(scratch, id)).not.toBeNull();
    scratch.close();
  });

  test("the retry widens the search but not the threshold", async () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "FAGE Total 0%", brand: "FAGE" }).id;
    const deps: ImageDeps = {
      search: async (query) =>
        // What ICA actually returns for the shortened "fage total".
        query === "fage total" ? [hit("Munskölj Total care 500ml Listerine", "Listerine", "f")] : [],
      fetchImage: async () => ({ bytes: BYTES, contentType: "image/webp" }),
      delay: async () => {},
    };
    await runBackfill(scratch, deps);
    expect(getProductImage(scratch, id)).toBeNull();
    scratch.close();
  });

  test("does not retry when the name is already short", async () => {
    const scratch = openDb(":memory:");
    saveProduct(scratch, { name: "Avokado" });
    const queried: string[] = [];
    const deps: ImageDeps = {
      search: async (query) => {
        queried.push(query);
        return [];
      },
      fetchImage: async () => null,
      delay: async () => {},
    };
    await runBackfill(scratch, deps);
    expect(queried).toEqual(["Avokado"]);
    scratch.close();
  });

  test("a hit whose image cannot be downloaded becomes a negative row", async () => {
    const scratch = openDb(":memory:");
    const id = saveProduct(scratch, { name: "Trasig bild" }).id;
    const deps: ImageDeps = {
      search: async () => [hit("Trasig bild 500g ICA", "ICA", "d")],
      fetchImage: async () => null,
      delay: async () => {},
    };
    await runBackfill(scratch, deps);
    expect(getImageStatus(scratch, id)!.has_image).toBe(false);
    scratch.close();
  });
});
