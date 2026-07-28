import { useState } from "react";
import { putJson, sv, useApi, type RecipeView } from "../api";
import { ErrorNote, LeaderRow, Tile, macroLine } from "../components/Bits";

// Betyg 1,0–10,0 med en decimal — servern avrundar och är sanningen.
function RatingEditor({ id, rating, onSaved }: { id: number; rating: number | null; onSaved: () => void }) {
  const [draft, setDraft] = useState(rating ?? 7.5);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const save = async (value: number | null) => {
    setSaving(true);
    setStatus(null);
    try {
      await putJson(`/ui/api/recipes/${id}`, { rating: value });
      setSaving(false);
      onSaved();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "kunde inte spara");
      setSaving(false);
    }
  };
  return (
    <div className="card rating-editor">
      <div className="body">
        <label className="field">
          <span className="label">{rating !== null ? "Ändra betyg" : "Betygsätt"} · {sv(draft, 1)}</span>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
          />
        </label>
        <div className="chip-row">
          <button className="chip accent" disabled={saving} onClick={() => save(draft)}>Spara betyg</button>
          {rating !== null ? (
            <button className="chip" disabled={saving} onClick={() => save(null)}>Rensa</button>
          ) : null}
        </div>
        {status ? <ErrorNote message={status} /> : null}
      </div>
    </div>
  );
}

export function ReceptDetalj({ id }: { id: string }) {
  const { data: r, error, reload } = useApi<RecipeView>(`/ui/api/recipes/${id}`);
  return (
    <>
      <button className="backlink" onClick={() => { location.hash = "#/recept"; }}>← Alla recept</button>
      {error ? <ErrorNote message={error} /> : null}
      {r ? (
        <>
          <h2>{r.name}</h2>
          <div className="kvitto">
            {r.ingredients.map((ing, i) =>
              ing.unresolved ? (
                <LeaderRow key={i} label={`${ing.description} · ${ing.reason}`} amount="—" />
              ) : (
                <LeaderRow
                  key={i}
                  label={`${ing.description}${ing.grams ? ` · ${sv(ing.grams, 0)} g` : ing.quantity ? ` · ${sv(ing.quantity)} st` : ""}`}
                  amount={sv(ing.kcal ?? 0, 0)}
                />
              ),
            )}
            <div className="k-title k-total">
              <span>SUMMA</span>
              <span className="leader" />
              <span className="amount">{macroLine(r.totals)}</span>
            </div>
            {r.totals_incomplete ? <div className="k-sub">⚠ ofullständig: någon ingrediens kan inte beräknas</div> : null}
          </div>
          <div className="tiles">
            {r.servings ? <Tile label="Portioner" value={sv(r.servings)} /> : null}
            {r.total_minutes !== null ? <Tile label="Tid" value={`${sv(r.total_minutes, 0)} min`} sub={r.active_minutes !== null ? `${sv(r.active_minutes, 0)} min aktiv` : null} /> : null}
            {r.per_serving ? <Tile label="Per portion" value={`${sv(r.per_serving.kcal, 0)} kcal`} sub={`P ${sv(r.per_serving.protein)} · F ${sv(r.per_serving.fat)} · K ${sv(r.per_serving.carbs)}`} /> : null}
            {r.rating !== null ? <Tile label="Betyg" value={`★ ${sv(r.rating, 1)}`} sub="av 10" /> : null}
          </div>
          <RatingEditor key={r.rating ?? "unrated"} id={r.id} rating={r.rating} onSaved={reload} />
          {r.instructions ? (
            <>
              <h2>Gör så här</h2>
              <div className="kvitto"><div className="k-sub" style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r.instructions}</div></div>
            </>
          ) : null}
          {r.notes ? <div className="note">{r.notes}</div> : null}
          {r.tags ? <div className="pill-flags">{r.tags.split(",").map((tag) => <span className="chip" key={tag}>{tag.trim()}</span>)}</div> : null}
        </>
      ) : null}
    </>
  );
}
