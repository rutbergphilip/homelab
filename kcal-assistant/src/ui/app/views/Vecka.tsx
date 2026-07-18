import { useState } from "react";
import {
  putJson,
  sv,
  useApi,
  type PlanDay,
  type PlanItem,
  type PlanMeal,
  type PlanSlot,
  type PlanWeek,
  type Product,
  type RecipeSummary,
} from "../api";
import { EmptyState, ErrorNote, macroLine } from "../components/Bits";
import { KvittoSelect } from "../components/ui/Select";

const SLOTS: readonly PlanSlot[] = ["frukost", "lunch", "middag", "mellis"];
const SLOT_LABEL: Record<PlanSlot, string> = { frukost: "Frukost", lunch: "Lunch", middag: "Middag", mellis: "Mellis" };
const DAY_TYPES = [
  { value: "vilodag", label: "vilodag" },
  { value: "gymdag", label: "gymdag" },
  { value: "flexdag", label: "flexdag" },
];

function addDaysStr(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Server-side raw input reconstruction: PUT /ui/api/plan replaces whole slots,
// so edits rebuild the slot from the round-tripped raw item input.
function itemToInput(it: PlanItem): Record<string, unknown> {
  if (it.macros) {
    return {
      description: it.description,
      ...(it.grams !== null && { grams: it.grams }),
      ...(it.quantity !== null && { quantity: it.quantity }),
      macros: it.macros,
    };
  }
  const out: Record<string, unknown> = { product_id: it.product_id };
  if (it.portion_name !== null) {
    out.portion_name = it.portion_name;
    if (it.quantity !== null) out.quantity = it.quantity;
  } else if (it.grams !== null) {
    out.grams = it.grams;
  }
  return out;
}

function mealToInput(meal: PlanMeal, overrides: { slot?: PlanSlot; recipe_servings?: number } = {}): Record<string, unknown> {
  const base = {
    slot: overrides.slot ?? meal.slot,
    name: meal.name,
    ...(meal.post_gym_shake && { post_gym_shake: true }),
    ...(meal.note !== null && { note: meal.note }),
  };
  if (meal.recipe_id !== null) {
    return { ...base, recipe_id: meal.recipe_id, recipe_servings: overrides.recipe_servings ?? meal.recipe_servings ?? 1 };
  }
  return { ...base, items: (meal.items ?? []).map(itemToInput) };
}

interface WriteApi {
  run: (fn: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
}

function AddMealForm({ day, slot, writer, onDone }: { day: PlanDay; slot: PlanSlot; writer: WriteApi; onDone: () => void }) {
  const [mode, setMode] = useState<"recept" | "produkt" | "snabb">("recept");
  const recipes = useApi<{ recipes: RecipeSummary[] }>(mode === "recept" ? "/ui/api/recipes" : null);
  const products = useApi<{ products: Product[] }>(mode === "produkt" ? "/ui/api/products" : null);
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState("1");
  const [name, setName] = useState("");
  const [m, setM] = useState({ kcal: "", protein: "", fat: "", carbs: "" });
  // produkt mode: build a multi-item meal row by row
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [unit, setUnit] = useState("gram"); // "gram" | portion name
  const [grams, setGrams] = useState("");
  const [qty, setQty] = useState("1");
  const [rows, setRows] = useState<{ label: string; item: Record<string, unknown> }[]>([]);

  const selected = recipes.data?.recipes.find((r) => String(r.id) === recipeId);
  const canSaveRecipe = mode === "recept" && selected !== undefined && Number(servings) > 0;
  const canSaveSnabb =
    mode === "snabb" && name.trim() !== "" && Object.values(m).every((v) => v !== "" && Number.isFinite(Number(v)));

  const productList = products.data?.products ?? [];
  const query = search.trim().toLowerCase();
  const filtered = (query
    ? productList.filter((p) => `${p.name} ${p.brand ?? ""}`.toLowerCase().includes(query))
    : productList
  ).slice(0, 60);
  const product = productList.find((p) => String(p.id) === productId);

  const pickProduct = (id: string) => {
    setProductId(id);
    const p = productList.find((x) => String(x.id) === id);
    // default unit: gram when per-100g exists, else the first named portion
    setUnit(p?.per_100g ? "gram" : (p?.portions[0]?.name ?? "gram"));
    setGrams("");
    setQty("1");
  };

  const currentItem = (): { label: string; item: Record<string, unknown> } | null => {
    if (!product) return null;
    if (unit === "gram") {
      const g = Number(grams);
      if (!(g > 0) || !product.per_100g) return null;
      return { label: `${product.name} · ${g} g`, item: { product_id: product.id, grams: g } };
    }
    const q = Number(qty);
    if (!(q > 0)) return null;
    return {
      label: `${product.name} · ${sv(q, 1)} × ${unit}`,
      item: { product_id: product.id, portion_name: unit, quantity: q },
    };
  };

  const addRow = () => {
    const row = currentItem();
    if (!row) return;
    setRows((xs) => [...xs, row]);
    if (name.trim() === "" && product) setName(product.name);
    setProductId("");
    setGrams("");
    setQty("1");
    setSearch("");
  };

  const produktItems = () => {
    const inline = currentItem();
    return [...rows, ...(inline ? [inline] : [])];
  };
  const canSaveProdukt = mode === "produkt" && produktItems().length > 0;

  const save = () =>
    writer.run(async () => {
      const meal =
        mode === "recept"
          ? { slot, name: selected!.name, recipe_id: selected!.id, recipe_servings: Number(servings) }
          : mode === "produkt"
            ? {
                slot,
                name: name.trim() || product?.name || rows[0]!.label.split(" · ")[0]!,
                items: produktItems().map((r) => r.item),
              }
            : {
                slot,
                name: name.trim(),
                items: [
                  {
                    description: name.trim(),
                    macros: { kcal: Number(m.kcal), protein: Number(m.protein), fat: Number(m.fat), carbs: Number(m.carbs) },
                  },
                ],
              };
      await putJson(`/ui/api/plan/${day.date}`, { meals: [meal], replace: false });
      onDone();
    });

  return (
    <div className="vadd">
      <div className="vadd-tabs">
        <button className={mode === "recept" ? "active" : ""} onClick={() => setMode("recept")}>Från recept</button>
        <button className={mode === "produkt" ? "active" : ""} onClick={() => setMode("produkt")}>Produkt</button>
        <button className={mode === "snabb" ? "active" : ""} onClick={() => setMode("snabb")}>Snabb</button>
      </div>
      {mode === "recept" ? (
        <div className="vadd-fields">
          <KvittoSelect
            value={recipeId}
            onChange={setRecipeId}
            ariaLabel="välj recept"
            placeholder="Välj recept…"
            options={(recipes.data?.recipes ?? []).map((r) => ({
              value: String(r.id),
              label: r.name,
              description: r.kcal_per_serving !== null ? `${sv(r.kcal_per_serving, 0)} kcal/port` : undefined,
            }))}
          />
          <label className="vadd-servings">
            portioner
            <input type="number" min="0.5" step="0.5" value={servings} onChange={(e) => setServings(e.target.value)} />
          </label>
        </div>
      ) : mode === "produkt" ? (
        <div className="vadd-fields">
          <input placeholder="Måltidsnamn (valfritt)" value={name} onChange={(e) => setName(e.target.value)} />
          {rows.length > 0 ? (
            <ul className="vadd-rows">
              {rows.map((r, i) => (
                <li key={i}>
                  <span>{r.label}</span>
                  <button aria-label={`ta bort ${r.label}`} onClick={() => setRows((xs) => xs.filter((_, j) => j !== i))}>×</button>
                </li>
              ))}
            </ul>
          ) : null}
          <input placeholder="Sök produkt…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <KvittoSelect
            value={productId}
            onChange={pickProduct}
            ariaLabel="välj produkt"
            placeholder={products.data ? `Välj produkt (${filtered.length})…` : "Hämtar produkter…"}
            options={filtered.map((p) => ({
              value: String(p.id),
              label: p.brand ? `${p.name} · ${p.brand}` : p.name,
              description: p.per_100g ? `${sv(p.per_100g.kcal, 0)} kcal/100 g` : undefined,
            }))}
          />
          {product ? (
            <div className="vadd-amount">
              <KvittoSelect
                value={unit}
                onChange={setUnit}
                ariaLabel="enhet"
                options={[
                  ...(product.per_100g ? [{ value: "gram", label: "gram" }] : []),
                  ...product.portions.map((p) => ({ value: p.name, label: p.name })),
                ]}
              />
              {unit === "gram" ? (
                <label>
                  g
                  <input type="number" inputMode="decimal" min="1" value={grams} onChange={(e) => setGrams(e.target.value)} />
                </label>
              ) : (
                <label>
                  antal
                  <input type="number" inputMode="decimal" min="0.25" step="0.25" value={qty} onChange={(e) => setQty(e.target.value)} />
                </label>
              )}
              <button className="ghost" disabled={currentItem() === null} onClick={addRow}>+ rad</button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="vadd-fields">
          <input placeholder="Namn" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="vadd-macros">
            {(["kcal", "protein", "fat", "carbs"] as const).map((k) => (
              <label key={k}>
                {k === "carbs" ? "kolh" : k === "fat" ? "fett" : k}
                <input type="number" inputMode="decimal" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="vadd-actions">
        <button disabled={writer.busy || !(canSaveRecipe || canSaveSnabb || canSaveProdukt)} onClick={save}>Lägg till</button>
        <button className="ghost" onClick={onDone}>Avbryt</button>
      </div>
    </div>
  );
}

function MealRow({ day, meal, week, writer, reload }: { day: PlanDay; meal: PlanMeal; week: PlanWeek; writer: WriteApi; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState(meal.recipe_servings !== null ? String(meal.recipe_servings) : "");
  const [moveDate, setMoveDate] = useState(day.date);
  const [moveSlot, setMoveSlot] = useState<PlanSlot>(meal.slot);

  const slotMeals = day.meals.filter((x) => x.slot === meal.slot);
  const rebuildWithout = () => {
    const rest = slotMeals.filter((x) => x.id !== meal.id).map((x) => mealToInput(x));
    return rest.length > 0
      ? putJson(`/ui/api/plan/${day.date}`, { meals: rest, replace: true })
      : putJson(`/ui/api/plan/${day.date}`, { clear_slots: [meal.slot] });
  };

  const remove = () =>
    writer.run(async () => {
      await rebuildWithout();
      reload();
    });

  const move = () =>
    writer.run(async () => {
      await putJson(`/ui/api/plan/${moveDate}`, { meals: [mealToInput(meal, { slot: moveSlot })], replace: false });
      await rebuildWithout();
      reload();
    });

  const saveServings = () =>
    writer.run(async () => {
      const rebuilt = slotMeals.map((x) =>
        x.id === meal.id ? mealToInput(x, { recipe_servings: Number(servings) }) : mealToInput(x),
      );
      await putJson(`/ui/api/plan/${day.date}`, { meals: rebuilt, replace: true });
      reload();
    });

  return (
    <>
      <button className="rowlink vmeal" onClick={() => setOpen(!open)}>
        <span>{meal.name}</span>
        {meal.logged ? <span className="vlogged">loggad ✓</span> : null}
        {meal.totals_incomplete ? <span className="vwarn">olöst</span> : null}
        <span className="grow" />
        <span className="num">{sv(meal.kcal, 0)} kcal</span>
      </button>
      {open ? (
        <div className="vmeal-detail">
          <div className="vmacro">{macroLine(meal)}</div>
          {meal.recipe_id !== null ? (
            <div className="vfield">
              <label>
                portioner
                <input type="number" min="0.5" step="0.5" value={servings} onChange={(e) => setServings(e.target.value)} />
              </label>
              <button disabled={writer.busy || !(Number(servings) > 0) || Number(servings) === meal.recipe_servings} onClick={saveServings}>
                Spara
              </button>
            </div>
          ) : null}
          {(meal.items ?? []).length > 0 ? (
            <ul className="vitems">
              {meal.items!.map((it, i) => (
                <li key={i}>
                  {it.description}
                  {it.grams !== null ? ` · ${sv(it.grams, 0)} g` : ""}
                  {it.unresolved ? ` — ${it.reason ?? "olöst"}` : ` · ${sv(it.kcal ?? (it.macros?.kcal ?? 0), 0)} kcal`}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="vfield">
            <KvittoSelect
              value={moveDate}
              onChange={setMoveDate}
              ariaLabel="flytta till dag"
              options={week.days.map((d) => ({ value: d.date, label: `${d.weekday} ${d.date.slice(8)}` }))}
            />
            <KvittoSelect
              value={moveSlot}
              onChange={(v) => setMoveSlot(v as PlanSlot)}
              ariaLabel="flytta till lucka"
              options={SLOTS.map((s) => ({ value: s, label: SLOT_LABEL[s] }))}
            />
            <button disabled={writer.busy || (moveDate === day.date && moveSlot === meal.slot)} onClick={move}>Flytta</button>
          </div>
          <div className="vfield">
            <button className="danger" disabled={writer.busy} onClick={remove}>Ta bort</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DayCard({ day, week, writer, reload }: { day: PlanDay; week: PlanWeek; writer: WriteApi; reload: () => void }) {
  const [adding, setAdding] = useState<PlanSlot | null>(null);
  const today = new Date().toLocaleDateString("sv-SE");
  const hasMeals = day.meals.length > 0;

  const setDayType = (value: string) =>
    writer.run(async () => {
      await putJson(`/ui/api/plan/${day.date}`, { day_type: value });
      reload();
    });

  const confirm = () => {
    if (!window.confirm(`Bekräfta ${day.weekday} ${day.date}? Måltiderna loggas mot dagens mål.`)) return;
    void writer.run(async () => {
      await putJson(`/ui/api/confirm/${day.date}`, { action: "confirm" });
      reload();
    });
  };

  const unconfirm = () => {
    if (!window.confirm(`Ångra bekräftelsen för ${day.weekday} ${day.date}? Planens loggade måltider tas bort ur loggen.`)) return;
    void writer.run(async () => {
      await putJson(`/ui/api/confirm/${day.date}`, { action: "unconfirm" });
      reload();
    });
  };

  const warnings = [
    !day.checks.kcal_ok ? "över kcal-budget" : null,
    !day.checks.protein_floor_ok && hasMeals ? "under proteingolv" : null,
    !day.checks.fat_floor_ok && hasMeals ? "under fettgolv" : null,
  ].filter(Boolean) as string[];

  return (
    <section className={`vday${day.confirmed ? " confirmed" : ""}${day.date === today ? " today" : ""}`}>
      <header className="vday-head">
        <div className="vday-title">
          <span className="vday-name">{day.weekday}</span>
          <span className="vday-date num">{day.date.slice(5)}</span>
          {day.confirmed ? <span className="vday-lock">låst ✓</span> : null}
        </div>
        <div className="vday-type">
          <KvittoSelect value={day.day_type} onChange={setDayType} ariaLabel="dagstyp" options={DAY_TYPES} />
        </div>
      </header>
      <div className="vday-sum num">
        {sv(day.totals.kcal, 0)} / {sv(day.targets.kcal, 0)} kcal · P {sv(day.totals.protein, 0)} / {sv(day.targets.protein_min, 0)} g
      </div>
      {warnings.length > 0 ? <div className="vday-warn">⚠ {warnings.join(" · ")}</div> : null}
      {SLOTS.map((slot) => {
        const meals = day.meals.filter((meal) => meal.slot === slot);
        if (meals.length === 0 && adding !== slot && day.confirmed) return null;
        return (
          <div key={slot} className="vslot">
            <div className="vslot-head">
              <span>{SLOT_LABEL[slot]}</span>
              {!day.confirmed && adding !== slot ? (
                <button className="vslot-add" onClick={() => setAdding(slot)} aria-label={`lägg till ${SLOT_LABEL[slot]}`}>+ lägg till</button>
              ) : null}
            </div>
            {meals.map((meal) => (
              <MealRow key={meal.id} day={day} meal={meal} week={week} writer={writer} reload={reload} />
            ))}
            {adding === slot ? <AddMealForm day={day} slot={slot} writer={writer} onDone={() => { setAdding(null); reload(); }} /> : null}
          </div>
        );
      })}
      <div className="vday-actions">
        {day.confirmed ? (
          <button className="ghost" disabled={writer.busy} onClick={unconfirm}>Ångra bekräftelse</button>
        ) : hasMeals ? (
          <button className="vconfirm" disabled={writer.busy} onClick={confirm}>Bekräfta dagen 🔒</button>
        ) : null}
      </div>
    </section>
  );
}

export function Vecka() {
  const [start, setStart] = useState<string | null>(null);
  const path = `/ui/api/plan${start ? `?start=${start}` : ""}`;
  const { data, error, reload } = useApi<PlanWeek>(path, true);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const writer: WriteApi = {
    busy,
    run: async (fn) => {
      setBusy(true);
      setWriteError(null);
      try {
        await fn();
      } catch (e) {
        setWriteError((e as Error).message);
      }
      setBusy(false);
    },
  };

  if (error) return <ErrorNote message={error} />;
  if (!data) return null;

  return (
    <>
      <div className="vnav">
        <button onClick={() => setStart(addDaysStr(data.start_date, -7))}>‹ förra</button>
        <span className="vnav-range num">{data.start_date} – {data.end_date}</span>
        <button onClick={() => setStart(null)}>idag</button>
        <button onClick={() => setStart(addDaysStr(data.start_date, 7))}>nästa ›</button>
      </div>
      <div className="tiles">
        <div className="tile">
          <div className="t-label">Planerade dagar</div>
          <div className="t-value">{data.week.planned_days} / 7</div>
          <div className="t-sub">{data.week.confirmed_days} bekräftade</div>
        </div>
        {data.week.avg_planned_kcal !== null ? (
          <div className="tile">
            <div className="t-label">Snitt planerat</div>
            <div className="t-value">{sv(data.week.avg_planned_kcal, 0)}</div>
            <div className="t-sub">mål {sv(data.week.avg_target_kcal, 0)} kcal</div>
          </div>
        ) : null}
      </div>
      {writeError ? <ErrorNote message={writeError} /> : null}
      {data.days.map((day) => (
        <DayCard key={day.date} day={day} week={data} writer={writer} reload={reload} />
      ))}
      {data.week.planned_days === 0 ? <EmptyState>Inget planerat den här veckan. Planera i chatten eller med + lägg till.</EmptyState> : null}
      {data.shopping_list.length > 0 ? (
        <details className="vshop">
          <summary>Handlingslista ({data.shopping_list.length})</summary>
          <ul>
            {data.shopping_list.map((line, i) => (
              <li key={i}>
                {line.description}
                {line.grams !== null ? ` · ${sv(line.grams, 0)} g` : ""}
                {line.quantity !== null && line.portion_name !== null ? ` · ${sv(line.quantity, 1)} × ${line.portion_name}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
