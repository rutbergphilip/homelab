# Kcal: Receptbetyg (decimalbetyg 1–10)

**Datum:** 2026-07-28
**Status:** Godkänd (Philip förhandsgodkände autonom design + deploy)
**Version:** v0.15.0 (migration 11, verktyg 29)

## Varför

Philip vill kunna betygsätta recept han lagat — med decimaler — så att han kan
filtrera på betyg, minnas vad som var bra och låta assistenten föreslå därefter.

## Skala: 1,0–10,0 med en decimal

Vald för konsekvens: stilregeln i databasen ger redan varje loggad måltid
"betyg 1-10". Recepten talar samma språk. Servern avrundar till en decimal och
validerar 1 ≤ betyg ≤ 10. `null` = obetygsatt (rensat).

## Lagring

Migration 11:

```sql
ALTER TABLE recipes ADD COLUMN rating REAL;
```

Ingen egen tabell, ingen historik, ingen `rated_at` — en användare, ett betyg
per recept, `updated_at` finns redan. Valideringen bor i koden (delas av MCP-
och UI-vägen), inte i en CHECK — samma mönster som övriga kolumner.

## MCP-yta (28 → 29 verktyg)

- **Nytt verktyg `rate_recipe`**: `{ id, rating: number | null }`. `null`
  rensar. Svarar minimalt med `{ id, name, rating }` — det räcker för att
  bekräfta det SPARADE (avrundade) betyget, och hela receptvyn vore
  tokenslöseri. Beskrivningen säger åt Claude att bekräfta med det sparade
  värdet.
- **`find_recipes`**: nytt valfritt `min_rating` (obetygsatta filtreras bort
  när det anges); sammanfattningar får `rating`.
- **`get_recipe`**: returnerar `rating`.
- **`save_recipe` ändras INTE** — betyget har exakt en skrivväg per kanal,
  och ett partial-update-fält vore en rensningsfälla.

Philip behöver NY CHATT efteråt (connectorn cachar verktygslistan per
konversation).

## UI (KCAL·DB)

- **Receptlistan** (`Recept.tsx`): betygsbricka på kortet ("★ 8,5"), och en
  sorteringsväxel Namn/Betyg (betyg fallande, obetygsatta sist). Sökfältet
  ändras inte.
- **Receptdetalj** (`ReceptDetalj.tsx`): Betyg-tile + inline-redigering:
  slider 1,0–10,0 (steg 0,1) med värdesiffra, Spara och Rensa. Skrivningen
  går till `PUT /ui/api/recipes/:id` med strikt body `{ rating: number|null }`
  (enda tillåtna fältet) genom befintliga `writeGate` (Sec-Fetch-Site
  same-origin + JSON-typ) — tredje UI-skrivningen, samma mönster som profil
  och plan. (Ursprungligt förslag `/recipes/:id/rating` föll på API_ROUTE-
  regexen som bara tillåter två segment.)
- README-invarianten uppdateras: UI:t är läs-bart utom profil, plan och
  receptbetyg.

## Felhantering

- MCP: ogiltigt betyg → svenskt felmeddelande ("betyg måste vara 1–10");
  okänt id → "Recipe X not found" (befintligt mönster).
- UI: 400 vid ogiltigt värde/okänt fält (strikt shape-koll som profil), 404
  vid okänt recept, 403 via writeGate.

## Tester

- `recipes.test.ts` (eller ny `recipe-rating.test.ts`): sätt/uppdatera/rensa,
  avrundning (8,55 → 8,6 — SQLite/JS-avrundning en gång, serverns sanning),
  validering (0,9 / 10,1 / NaN avvisas), `find_recipes` min_rating +
  rating i sammanfattningar, obetygsatta exkluderas vid filter.
- `ui-api.test.ts`-mönstret: PUT-matris (fel Sec-Fetch-Site 403, fel
  content-type 403, ogiltig body 400, okänt fält 400, okänt id 404, ok 200,
  rensning 200), GET-svar innehåller rating.

## Utrullning

Samma release-flöde som alltid: bumpa `package.json` till 0.15.0 OCH
`deployment.yaml`-taggen till v0.15.0 i samma PR → merge → CI bygger →
Flux rullar → verifiera pod, healthz, tools/list = 29, UI visuellt.
