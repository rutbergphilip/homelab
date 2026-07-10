import { sv, type DayView, type Meal } from "../api";
import { Meter, macroLine } from "./Bits";

function MealKvitto({ meal }: { meal: Meal }) {
  return (
    <div className="kvitto">
      <div className="k-title">
        <span>{meal.post_gym_shake ? `${meal.name} ⚡` : meal.name}</span>
        <span className="leader" />
        <span className="amount">{sv(meal.kcal, 0)} kcal</span>
      </div>
      <div className="k-sub">P {sv(meal.protein)} · F {sv(meal.fat)} · K {sv(meal.carbs)}</div>
      {meal.items.map((item, i) => {
        const qty = item.grams ? `${sv(item.grams, 0)} g` : item.quantity ? `${sv(item.quantity)} st` : "";
        return (
          <div className="k-row" key={i}>
            <span className="label">{item.description}{qty ? ` · ${qty}` : ""}</span>
            <span className="leader" />
            <span className="amount">{sv(item.kcal, 0)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DayBlock({ day, heading }: { day: DayView; heading?: string }) {
  const left = day.remaining.kcal;
  return (
    <>
      {heading ? <h2>{heading}</h2> : null}
      <div className="hero">
        <div className="hero-label">{left >= 0 ? "kvar idag" : "över målet"}</div>
        <div className={`hero-value${left < 0 ? " over" : ""}`}>{sv(Math.abs(left), 0)}</div>
        <div className="hero-sub">{sv(day.totals.kcal, 0)} / {sv(day.targets.kcal, 0)} kcal</div>
        <div className="chip-row">
          <span className="chip accent">{day.day_type}</span>
          <span className="chip">{day.date}</span>
        </div>
      </div>
      <div>
        <Meter label="Protein" value={day.totals.protein} target={day.targets.protein_min} floor />
        <Meter label="Fett" value={day.totals.fat} target={day.targets.fat_min} floor />
        {day.targets.carbs !== null ? <Meter label="Kolhydrater · riktnivå" value={day.totals.carbs} target={day.targets.carbs} /> : null}
      </div>
      <h2>Måltider · {day.meals.length}</h2>
      {day.meals.length === 0 ? (
        <div className="empty">Inget loggat den här dagen.</div>
      ) : (
        <>
          {day.meals.map((meal) => <MealKvitto key={meal.id} meal={meal} />)}
          <div className="kvitto">
            <div className="k-title k-total">
              <span>SUMMA</span>
              <span className="leader" />
              <span className="amount">{macroLine(day.totals)}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
