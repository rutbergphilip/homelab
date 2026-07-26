# KCAL·DB — produktgrid med automatiska bilder, och bredare layout

**Datum:** 2026-07-26
**Status:** godkänd, under implementation
**Rör:** `kcal-assistant/src/ui/`, `src/db/`, `src/services/`, `src/tools/`

## Problem

Två saker, båda synliga på `/ui#/produkter`:

1. **Produkter är en lodrät lista med 121 `<details>`-rader.** Att hitta en
   produkt kräver att man läser namn efter namn. Det finns inget visuellt
   ankare — allt ser likadant ut.
2. **Hela UI:t är klämt till `max-width: 680px`.** På en skrivbordsskärm
   används en dryg tredjedel av bredden. Begränsningen är rätt tanke (långa
   radlängder är svårlästa) men för hårt satt, och den gäller lika för en
   hero-siffra som för en 121-posters katalog.

## Beslut

### 1. Bredd per vy, inte per app

`resolveRoute` returnerar ett tredje fält, `width: "narrow" | "wide"`. `App`
lägger klassen på en yttre wrapper; CSS gör resten:

```css
.app--narrow { --view-max: 720px; }
.app--wide   { --view-max: 1240px; }
.masthead, .view { max-width: var(--view-max); }
```

| smal (720px) | bred (1240px) |
|---|---|
| Idag, Vikt, Regler, DagDetalj, ReceptDetalj | Produkter, Recept, Dagar, Vecka |

Mastheaden följer vyns bredd så `KCAL·DB`-linjalen alltid ligger i linje med
innehållet under. Inget imperativt DOM-pillande: `resolveRoute` är en ren
funktion som redan har tester.

**Sidofix:** tabbaren är `repeat(6, 1fr)` med sju flikar, så `REGLER` hamnar
ensam på rad två. Blir `repeat(4, 1fr)` under 560px (balanserad 4+3) och
`repeat(7, 1fr)` däröver.

### 2. Produkter som rutnät

- Filterraden kapas vid 640px. Ett sökfält på 1240px vore samma misstag åt
  andra hållet.
- Rutnät: `repeat(auto-fill, minmax(clamp(150px, 16vw, 200px), 1fr))` — sex
  kolumner vid 1240px, två på telefon, inga media queries.
- Brickan är en `<button>` så tangentbord och skärmläsare fungerar utan extra
  arbete.

**Brickans anatomi**

- **Plåt** — kvadratisk, `object-fit: contain` med luft runt, hårfin ram.
  ICA:s packshots ligger på vitt, vilket skulle glösa som 121 vita rutor mot
  det nästan svarta mörka temat. Plåten har därför en varm dämpad ton och
  bilden en `brightness/saturate`-dämpning **bara i mörkt läge**. Det kan inte
  komma från `light-dark()` (bara färger), så det är en `--photo-filter`-variabel
  satt av `prefers-color-scheme` **och** överskriven av `[data-theme]` åt båda
  håll — annars slåss temaknappen mot OS-inställningen.
- **Kropp** — namn klippt till två rader, sedan `75 kcal · P 9,5` i samma
  tabulära mono som idag.
- **Overifierad** produkt får ett litet mono-`?` i plåtens övre högra hörn.
  Idag syns det tillståndet först när man fällt ut raden.
- **Ingen bild** → plåten visar ett stort monogram i `--ink-3` innanför en
  prickad innerram. Läses som en medvetet tom plåt, inte en trasig.

### 3. Låda i stället för utfällning

En utfällning på plats fungerar inte i ett rutnät. Klick öppnar en panel:

- `role="dialog"`, fokusfälla, Esc och klick-utanför stänger,
  `translateX`-övergång som `prefers-reduced-motion` slår av.
- 420px till höger på skrivbord; bottenark vid ≤720px.
- Innehållet är dagens utfällda kropp oförändrad i sak — märke, per 100 g,
  portioner, alias, anteckningar, chips — men satt som `.k-row`-kvittorader
  med prickade ledare.
- Pilnavigering mellan produkter är **utanför scope**.

### 4. Bildpipeline

**Källa: ICA.** Appen pratar redan med `handlaprivatkund.ica.se` för näringsdata,
och sökträffarna bär med sig `imagePaths` + `availableFormats`. Vi hämtar
`300x300.webp` och lagrar bytes ordagrant — ingen omkodning, alltså inget
bildbibliotek och inga native-beroenden i containern.

**Matchning måste vara konfidensgrindad.** ICA:s sökning är luddig och
personaliserad; träff nr 1 kan vara rent brus. Mätt mot den riktiga
produktlistan 2026-07-26:

| vår produkt | ICA träff #1 | ska |
|---|---|---|
| Arla Mild Kvarg Blåbär | Kvarg Mild Blåbär Laktosfri 0,2% 1000g Arla® | tas |
| Avokado | Ätmogen Avokado 3-pack Klass 1 ICA | tas |
| Baby plommontomater | Röda babyplommontomater 250g Klass 1 ICA | tas |
| Knäckebröd | Svart & vit knäckesticks Ekologisk 120g Vilmas | **avvisas** |
| Gin & Tonic | (inga träffar) | ingen bild |

`src/lib/image-match.ts`, ren och enhetstestad:

1. Normalisera: gemener, bort med `®™`, `,`→`.`, bort med förpackningsstorlekar
   (`\d+(g|kg|ml|cl|l|p|pack)`), kollapsa blanksteg.
2. Tokenisera båda namnen.
3. `score = |våra tokens som återfinns| / |våra tokens|` (containment, inte
   Jaccard — ICA:s namn är längre och bär extra ord).
4. En token räknas som återfunnen om den är en exakt token hos dem, **eller**
   (vid längd ≥ 4) förekommer som delsträng i deras mellanslagsfria namn. Det
   sista är vad som gör svenska sammansättningar rätt: `baby` + `plommontomater`
   ⊂ `rödababyplommontomater250gklass1ica`. `knäckebröd` finns fortfarande inte
   i `svartvitknäckesticks…`, så bruset avvisas ändå.
5. Märkesbonus +0.15 om vårt `brand` återfinns hos dem.
6. Tröskel 0.6. Alla topp-5-träffar poängsätts; bästa vinner, inte första.

**Körning.** `src/services/product-images.ts` har en kö över produkter som
saknar rad. Seriell, 1 req/s (ICA:s WAF är känd sedan tidigare), en körning i
taget, startas fördröjt vid uppstart och efter `save_product`. Payload över
300 KB avvisas.

**Lagring.** Ny tabell, ny migration:

```sql
CREATE TABLE product_images (
  product_id   INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  bytes        BLOB,            -- NULL = uppslag gjort, inget dugligt hittat
  content_type TEXT,
  source       TEXT NOT NULL,   -- 'ica'
  source_ref   TEXT,            -- retailerProductId
  matched_name TEXT,            -- vad vi matchade mot, för granskning
  score        REAL,
  fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
  locked       INTEGER NOT NULL DEFAULT 0  -- 1 = satt för hand, backfill rör den aldrig
);
```

En rad med `bytes IS NULL` är en negativ cache — annars söker vi ICA efter
"Gin & Tonic" vid varje omstart. Negativa rader görs om efter 30 dagar.
121 produkter × ~20 KB ≈ 2,5 MB, och den befintliga backup-cronjobben täcker
databasen redan, så ingen ny volym.

**Servering.** `GET /ui/api/products/:id/image` returnerar bytes.
Ruttmönstret i `server.ts` är idag två segment efter `/ui/api/`, så den här
rutten matchas separat före `API_ROUTE` och svarar binärt i stället för JSON.
`ETag` + `304`, `Cache-Control: private, max-age=3600, must-revalidate`.
CSP:ns `img-src 'self'` tillåter den redan; hotlänkning till ICA vore blockerad,
vilket är precis varför bytes ligger hos oss.

**Rättning sker i chatten**, inte i UI:t. Nytt MCP-verktyg `set_product_image`:
anropat med bara `product` returnerar topp-5-kandidater med poäng; anropat med
`retailer_product_id` hämtar och sparar med `locked = 1`; `clear: true` nollar.

### 5. Invarianten som styr allt ovan

README: *"the UI has zero mutation endpoints"*. Därför är bildhämtningen en
serverprocess, aldrig en sidoeffekt av en GET, och rättningen ett MCP-verktyg.
`/ui` läser bytes, punkt.

## Tester

Rena enhetstester:

- `image-match.ts` — poängsättning med tabellen ovan som fixtur, inklusive
  Knäckebröd-avvisningen och sammansättningsfallet.
- `resolveRoute` — rätt `width` per rutt.

Integration, utan nätverk (ICA-sökningen injiceras):

- `/ui/api/products/:id/image` → 404 utan bytes, 200 + rätt content-type med,
  304 på `If-None-Match`.
- Backfill hoppar över `locked`-rader och negativa cacherader inom TTL.

## Utanför scope

- Bilder på Recept (recept har ingen ICA-motsvarighet).
- Pilnavigering mellan produkter i lådan.
- Omkodning/beskärning av bilder.
