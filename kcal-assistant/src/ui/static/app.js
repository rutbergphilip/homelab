"use strict";

/* KCAL·DB — read-only viewer. Vanilla JS, hash routing, strict CSP. */

const viewHost = document.getElementById("view");
const mastheadMeta = document.getElementById("masthead-meta");
// Renderers append to `view`; navigate() points it at a detached staging node
// per navigation and swaps in atomically, so overlapping async renders can
// never interleave into the live DOM.
let view = viewHost;

/* ---------- helpers ---------- */

const sv = (n, dec = 1) =>
  Number(n).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: dec });

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

async function api(path) {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    // CF Access session expired: fetch followed the login redirect and got
    // HTML. A full reload lets the top-level navigation re-trigger login.
    location.reload();
    throw new Error("session expired");
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function tableHead(...titles) {
  const thead = el("thead");
  const tr = el("tr");
  for (const title of titles) tr.append(el("th", "", title));
  thead.append(tr);
  return thead;
}

function macroLine(m) {
  return `${sv(m.kcal, 0)} kcal · P ${sv(m.protein)} · F ${sv(m.fat)} · K ${sv(m.carbs)}`;
}

function leaderRow(cls, label, amount, sub) {
  const row = el("div", cls);
  row.append(el("span", "label", label), el("span", "leader"), el("span", "amount", amount));
  if (sub) row.append(el("div", "k-sub", sub));
  return row;
}

function meter(label, value, target, opts = {}) {
  const wrap = el("div", "meter");
  const head = el("div", "meter-head");
  const val = el("span", "value");
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  let cls = "neutral";
  if (opts.floor) {
    const met = value >= target;
    cls = met ? "ok" : "under";
    val.append(el("span", `status ${cls}`, `${sv(value)} `), el("span", "", `/ ${sv(target)} ${opts.unit || "g"}`));
  } else {
    val.textContent = `${sv(value)} / ${sv(target)} ${opts.unit || "g"}`;
  }
  head.append(el("span", "label", label), el("span", "leader"), val);
  const track = el("div", "meter-track");
  const fill = el("div", `meter-fill ${cls}`);
  fill.style.width = `${pct}%`;
  track.append(fill);
  wrap.append(head, track);
  return wrap;
}

function mealKvitto(meal) {
  const card = el("div", "kvitto");
  const title = el("div", "k-title");
  title.append(
    el("span", "", meal.post_gym_shake ? `${meal.name} ⚡` : meal.name),
    el("span", "leader"),
    el("span", "amount", `${sv(meal.kcal, 0)} kcal`),
  );
  card.append(title, el("div", "k-sub", `P ${sv(meal.protein)} · F ${sv(meal.fat)} · K ${sv(meal.carbs)}`));
  for (const item of meal.items || []) {
    const qty = item.grams ? `${sv(item.grams, 0)} g` : item.quantity ? `${sv(item.quantity)} st` : "";
    card.append(leaderRow("k-row", `${item.description}${qty ? ` · ${qty}` : ""}`, `${sv(item.kcal, 0)}`));
  }
  return card;
}

function dayBlock(day, { heading } = {}) {
  const frag = document.createDocumentFragment();
  if (heading) frag.append(el("h2", "", heading));

  const hero = el("div", "hero");
  const left = day.remaining.kcal;
  hero.append(el("div", "hero-label", left >= 0 ? "kvar idag" : "över målet"));
  const heroVal = el("div", `hero-value${left < 0 ? " over" : ""}`, sv(Math.abs(left), 0));
  hero.append(heroVal, el("div", "hero-sub", `${sv(day.totals.kcal, 0)} / ${sv(day.targets.kcal, 0)} kcal`));
  const chips = el("div", "chip-row");
  chips.append(el("span", "chip accent", day.day_type));
  chips.append(el("span", "chip", day.date));
  hero.append(chips);
  frag.append(hero);

  const meters = el("div");
  meters.append(
    meter("Protein", day.totals.protein, day.targets.protein_min, { floor: true }),
    meter("Fett", day.totals.fat, day.targets.fat_min, { floor: true }),
  );
  if (day.targets.carbs !== null) {
    meters.append(meter("Kolhydrater · riktnivå", day.totals.carbs, day.targets.carbs));
  }
  frag.append(meters);

  frag.append(el("h2", "", `Måltider · ${day.meals.length}`));
  if (day.meals.length === 0) {
    frag.append(el("div", "empty", "Inget loggat den här dagen."));
  } else {
    for (const meal of day.meals) frag.append(mealKvitto(meal));
    const total = el("div", "kvitto");
    const row = el("div", "k-title k-total");
    row.append(el("span", "", "SUMMA"), el("span", "leader"), el("span", "amount", macroLine(day.totals)));
    total.append(row);
    frag.append(total);
  }
  return frag;
}

/* ---------- views ---------- */

async function renderIdag() {
  const data = await api("/ui/api/overview");
  view.append(dayBlock(data.day));

  if (data.trend.latest) {
    view.append(el("h2", "", "Vikt"));
    const tiles = el("div", "tiles");
    tiles.append(tile("Senast", `${sv(data.trend.latest.weight_kg)} kg`, data.trend.latest.date));
    if (data.trend.trend) {
      tiles.append(tile("Takt", `${sv(data.trend.trend.rate_kg_week)} kg/v`, `${sv(data.trend.trend.delta_kg)} kg på ${sv(data.trend.trend.span_days, 0)} d`));
      if (data.trend.trend.est_tdee !== null) {
        tiles.append(tile("TDEE", `${sv(data.trend.trend.est_tdee, 0)}`, data.trend.trend.uncertain ? "osäker (gles logg)" : "baklängesräknad"));
      }
    }
    view.append(tiles);
  }

  view.append(el("h2", "", "Veckosnitt"));
  const week = data.week;
  const tiles = el("div", "tiles");
  tiles.append(tile("Dagar loggade", `${week.days_logged} / 7`, `${week.start_date} – ${week.end_date}`));
  if (week.avg_logged) {
    tiles.append(tile("Snitt kcal", sv(week.avg_logged.kcal, 0), `mål ${sv(week.avg_target_kcal, 0)}`));
    tiles.append(tile("Snitt protein", `${sv(week.avg_logged.protein)} g`, "över loggade dagar"));
  }
  view.append(tiles);
}

function tile(label, value, sub) {
  const box = el("div", "tile");
  box.append(el("div", "t-label", label), el("div", "t-value", value));
  if (sub) box.append(el("div", "t-sub", sub));
  return box;
}

async function renderDagar() {
  view.append(el("h2", "", "Loggade dagar"));
  const list = el("div");
  view.append(list);
  let offset = 0;
  const LIMIT = 30;

  async function loadPage() {
    const data = await api(`/ui/api/days?limit=${LIMIT}&offset=${offset}`);
    for (const day of data.days) {
      const row = el("button", "rowlink");
      row.append(
        el("span", "num", day.date),
        el("span", "dim", day.day_type),
        el("span", "grow"),
        el("span", "dim", `${day.meal_count} mål`),
        el("span", "num", `${sv(day.totals.kcal, 0)} kcal`),
      );
      row.addEventListener("click", () => {
        location.hash = `#/dagar/${day.date}`;
      });
      list.append(row);
    }
    offset += data.days.length;
    if (offset < data.total && data.days.length > 0) {
      more.hidden = false;
    } else {
      more.hidden = true;
      if (data.total === 0) list.append(el("div", "empty", "Inga dagar loggade ännu."));
    }
  }

  const more = el("button", "loadmore", "Visa fler");
  more.hidden = true;
  more.addEventListener("click", loadPage);
  view.append(more);
  await loadPage();
}

async function renderDagDetalj(date) {
  const back = el("button", "backlink", "← Alla dagar");
  back.addEventListener("click", () => {
    location.hash = "#/dagar";
  });
  view.append(back);
  const day = await api(`/ui/api/days/${date}`);
  view.append(dayBlock(day));
}

async function renderProdukter() {
  const data = await api("/ui/api/products");
  view.append(el("h2", "", `Produkter · ${data.products.length}`));
  const search = el("input", "search");
  search.type = "search";
  search.placeholder = "Sök produkt, alias, märke …";
  view.append(search);
  const list = el("div");
  view.append(list);

  function draw(filter) {
    list.replaceChildren();
    const q = (filter || "").toLowerCase();
    const hits = data.products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)),
    );
    if (hits.length === 0) {
      list.append(el("div", "empty", "Ingen träff."));
      return;
    }
    for (const p of hits) {
      const card = el("details", "card");
      const summary = el("summary");
      summary.append(
        el("span", "", p.name),
        el("span", "leader"),
        el("span", "num", p.per_100g ? `${sv(p.per_100g.kcal, 0)} kcal · P ${sv(p.per_100g.protein)}` : "—"),
      );
      card.append(summary);
      const body = el("div", "body");
      if (p.brand) body.append(el("div", "alias", p.brand));
      if (p.per_100g) {
        body.append(el("div", "macro-line", `per 100 g: ${macroLine(p.per_100g)}`));
      }
      for (const portion of p.portions) {
        body.append(
          el(
            "div",
            "macro-line",
            portion.grams !== null
              ? `${portion.name}: ${sv(portion.grams, 0)} g`
              : `${portion.name}: ${sv(portion.kcal, 0)} kcal · P ${sv(portion.protein)} · F ${sv(portion.fat)} · K ${sv(portion.carbs)}`,
          ),
        );
      }
      if (p.aliases.length) body.append(el("div", "alias", `alias: ${p.aliases.join(", ")}`));
      if (p.notes) body.append(el("div", "note", p.notes));
      const flags = el("div", "pill-flags");
      flags.append(el("span", `chip ${p.verified ? "ok" : "under"}`, p.verified ? "verifierad" : "overifierad"));
      flags.append(el("span", "chip", p.source));
      body.append(flags);
      card.append(body);
      list.append(card);
    }
  }

  search.addEventListener("input", () => draw(search.value));
  draw("");
}

async function renderRecept() {
  const data = await api("/ui/api/recipes");
  view.append(el("h2", "", `Recept · ${data.recipes.length}`));
  if (data.recipes.length === 0) {
    view.append(el("div", "empty", "Inga recept ännu. Säg åt assistenten: 'spara som recept'."));
    return;
  }
  for (const r of data.recipes) {
    const row = el("button", "rowlink");
    row.append(el("span", "", r.name));
    row.append(el("span", "grow"));
    row.append(el("span", "dim", r.tags || ""));
    if (r.total_minutes !== null) row.append(el("span", "dim", `~${sv(r.total_minutes, 0)} min`));
    row.append(el("span", "num", r.kcal_per_serving !== null ? `${sv(r.kcal_per_serving, 0)} kcal/port` : "—"));
    row.addEventListener("click", () => {
      location.hash = `#/recept/${r.id}`;
    });
    view.append(row);
  }
}

async function renderReceptDetalj(id) {
  const back = el("button", "backlink", "← Alla recept");
  back.addEventListener("click", () => {
    location.hash = "#/recept";
  });
  view.append(back);
  const r = await api(`/ui/api/recipes/${id}`);
  view.append(el("h2", "", r.name));

  const card = el("div", "kvitto");
  for (const ing of r.ingredients) {
    if (ing.unresolved) {
      card.append(leaderRow("k-row", `${ing.description} · ${ing.reason}`, "—"));
    } else {
      const qty = ing.grams ? `${sv(ing.grams, 0)} g` : ing.quantity ? `${sv(ing.quantity)} st` : "";
      card.append(leaderRow("k-row", `${ing.description}${qty ? ` · ${qty}` : ""}`, sv(ing.kcal, 0)));
    }
  }
  const total = el("div", "k-title k-total");
  total.append(el("span", "", "SUMMA"), el("span", "leader"), el("span", "amount", macroLine(r.totals)));
  card.append(total);
  if (r.totals_incomplete) card.append(el("div", "k-sub", "⚠ ofullständig: någon ingrediens kan inte beräknas"));
  view.append(card);

  const tiles = el("div", "tiles");
  if (r.servings) tiles.append(tile("Portioner", sv(r.servings), null));
  if (r.total_minutes !== null) {
    tiles.append(
      tile("Tid", `${sv(r.total_minutes, 0)} min`, r.active_minutes !== null ? `${sv(r.active_minutes, 0)} min aktiv` : null),
    );
  }
  if (r.per_serving) tiles.append(tile("Per portion", `${sv(r.per_serving.kcal, 0)} kcal`, `P ${sv(r.per_serving.protein)} · F ${sv(r.per_serving.fat)} · K ${sv(r.per_serving.carbs)}`));
  view.append(tiles);

  if (r.instructions) {
    view.append(el("h2", "", "Gör så här"));
    const instr = el("div", "kvitto");
    instr.append(el("div", "k-sub", ""));
    instr.lastChild.style.whiteSpace = "pre-wrap";
    instr.lastChild.style.fontSize = "13px";
    instr.lastChild.textContent = r.instructions;
    view.append(instr);
  }
  if (r.notes) view.append(el("div", "note", r.notes));
  if (r.tags) {
    const flags = el("div", "pill-flags");
    for (const tag of r.tags.split(",")) flags.append(el("span", "chip", tag.trim()));
    view.append(flags);
  }
}

async function renderVikt() {
  const data = await api("/ui/api/weights");
  view.append(el("h2", "", "Vikt"));
  if (data.weights.length === 0) {
    view.append(el("div", "empty", "Inga viktloggar ännu. Säg '82,1 idag' till assistenten."));
    return;
  }

  const series = [...data.weights].reverse(); // ascending by date
  const chartHost = el("div");
  view.append(chartHost);

  const tiles = el("div", "tiles");
  tiles.append(tile("Senast", `${sv(data.trend.latest.weight_kg)} kg`, data.trend.latest.date + (data.trend.stale ? " · gammal" : "")));
  if (data.trend.trend) {
    tiles.append(tile("Takt", `${sv(data.trend.trend.rate_kg_week)} kg/v`, `${sv(data.trend.trend.delta_kg)} kg / ${sv(data.trend.trend.span_days, 0)} d`));
    tiles.append(
      tile(
        "TDEE",
        data.trend.trend.est_tdee !== null ? sv(data.trend.trend.est_tdee, 0) : "—",
        data.trend.trend.est_tdee === null ? "ingen intagsdata" : data.trend.trend.uncertain ? "osäker (gles logg)" : `${data.trend.trend.intake_days} intagsdagar`,
      ),
    );
  } else if (data.trend.reason) {
    tiles.append(tile("Trend", "—", data.trend.reason));
  }
  view.append(tiles);

  view.append(el("h2", "", "Prognos"));
  const prognosHost = el("div");
  view.append(prognosHost);
  await loadPrognos(chartHost, prognosHost, series, "targets");

  view.append(el("h2", "", "Alla vägningar"));
  const wrap = el("div", "tablewrap");
  const table = el("table");
  table.append(tableHead("Datum", "kg", "Anteckning"));
  const tbody = el("tbody");
  for (const w of data.weights) {
    const tr = el("tr");
    tr.append(el("td", "", w.date), el("td", "", sv(w.weight_kg)), el("td", "", w.note || ""));
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
  view.append(wrap);
}

async function loadPrognos(chartHost, prognosHost, series, source) {
  let fc;
  try {
    fc = await api(`/ui/api/forecast?source=${source}`);
  } catch (e) {
    fc = { forecast: null, reason: "kunde inte hämtas" };
  }
  chartHost.replaceChildren();
  if (series.length >= 2 || fc.forecast) chartHost.append(weightChart(series, fc.forecast));
  prognosHost.replaceChildren();

  if (!fc.forecast) {
    prognosHost.append(el("div", "empty", `Ingen prognos: ${fc.reason}`));
    return;
  }
  const f = fc.forecast;

  const tiles = el("div", "tiles");
  if (f.goal) {
    tiles.append(
      tile("Målvikt", `${sv(f.goal.weight_kg)} kg`, f.goal.reached ? "uppnådd" : f.goal.eta ? `nås ≈ ${f.goal.eta}` : f.goal.reason),
    );
  }
  if (f.weight_at_goal_date) {
    tiles.append(tile("Vid måldatum", `≈ ${sv(f.weight_at_goal_date.kg)} kg`, f.weight_at_goal_date.date));
  }
  tiles.append(
    tile("TDEE i kalkylen", sv(f.assumptions.tdee_start, 0), f.assumptions.calibration === "mätdata" ? "kalibrerad mot mätdata" : "formel (Mifflin-St Jeor)"),
  );
  tiles.append(
    tile(
      "Intag i kalkylen",
      sv(f.assumptions.intake_kcal, 0),
      f.assumptions.intake_source === "targets" ? "planmål (dagstypsmix)" : f.assumptions.intake_source === "recent" ? "snitt senaste 28 d" : "angivet",
    ),
  );
  prognosHost.append(tiles);

  // Real-time lookup: the daily curve is already here — no network per date.
  const byDate = new Map(f.curve.map((p) => [p.date, p]));
  const picker = el("div", "forecast-picker");
  const input = el("input");
  input.type = "date";
  input.min = f.curve[0].date;
  input.max = f.curve[f.curve.length - 1].date;
  input.value = f.weight_at_goal_date ? f.weight_at_goal_date.date : f.curve[Math.min(30, f.curve.length - 1)].date;
  const out = el("span", "num");
  const show = () => {
    const p = byDate.get(input.value);
    out.textContent = p ? `≈ ${sv(p.kg)} kg (${sv(p.low)}–${sv(p.high)})` : "—";
  };
  input.addEventListener("input", show);
  picker.append(el("span", "label", "Uppskattad vikt"), input, out);
  prognosHost.append(picker);

  const toggle = el("div", "chip-row");
  for (const [key, label] of [["targets", "planmål"], ["recent", "senaste 28 d"]]) {
    const chip = el("button", `chip${key === source ? " accent" : ""}`, label);
    chip.addEventListener("click", () => {
      if (key === source) return;
      // in-flight guard: the whole toggle is rebuilt when loadPrognos resolves
      for (const b of toggle.querySelectorAll("button")) b.disabled = true;
      loadPrognos(chartHost, prognosHost, series, key);
    });
    toggle.append(chip);
  }
  prognosHost.append(toggle);

  if (f.notes.length) prognosHost.append(el("div", "note", f.notes.join(" · ")));
  show();
}

function weightChart(series, forecast) {
  const NS = "http://www.w3.org/2000/svg";
  const W = 640, H = 240, M = { top: 16, right: 52, bottom: 24, left: 10 };
  const frame = el("div", "chart-frame");
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Viktutveckling och prognos, kg över tid");

  // Draw the projection only to just past the goal anchors (or 60 days) so
  // the history is not compressed into a sliver by a 365-day tail.
  const proj = forecast ? forecast.curve : [];
  const DAY = 86400000;
  const anchors = forecast
    ? [forecast.goal && forecast.goal.eta, forecast.weight_at_goal_date && forecast.weight_at_goal_date.date]
        .filter(Boolean)
        .map((d) => Date.parse(d))
    : [];
  const horizon = proj.length
    ? (anchors.length ? Math.max(...anchors) + 7 * DAY : Date.parse(proj[0].date) + 60 * DAY)
    : 0;
  const drawn = proj.filter((p) => Date.parse(p.date) <= horizon);
  const goalKg = forecast && forecast.goal ? forecast.goal.weight_kg : null;

  const days = series.map((w) => Date.parse(w.date));
  const kgs = series.map((w) => w.weight_kg);
  const allDays = [...days, ...drawn.map((p) => Date.parse(p.date))];
  const allKgs = [...kgs, ...drawn.flatMap((p) => [p.low, p.high]), ...(goalKg !== null ? [goalKg] : [])];
  const x0 = Math.min(...allDays), x1 = Math.max(...allDays);
  const pad = Math.max(0.4, (Math.max(...allKgs) - Math.min(...allKgs)) * 0.15);
  const y0 = Math.min(...allKgs) - pad, y1 = Math.max(...allKgs) + pad;
  const X = (t) => M.left + ((t - x0) / Math.max(1, x1 - x0)) * (W - M.left - M.right);
  const Y = (kg) => H - M.bottom - ((kg - y0) / (y1 - y0)) * (H - M.top - M.bottom);

  // 3 recessive gridlines with right-side labels
  for (let i = 0; i <= 2; i++) {
    const kg = y0 + ((y1 - y0) * i) / 2;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "gridline");
    line.setAttribute("x1", M.left);
    line.setAttribute("x2", W - M.right);
    line.setAttribute("y1", Y(kg));
    line.setAttribute("y2", Y(kg));
    svg.append(line);
    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "axis-label");
    label.setAttribute("x", W - M.right + 6);
    label.setAttribute("y", Y(kg) + 3);
    label.textContent = sv(kg, 1);
    svg.append(label);
  }
  // x labels: first + last date of the drawn domain
  for (const [t, anchor] of [[x0, "start"], [x1, "end"]]) {
    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "axis-label");
    label.setAttribute("x", X(t));
    label.setAttribute("y", H - 6);
    label.setAttribute("text-anchor", anchor);
    label.textContent = new Date(t).toISOString().slice(5, 10);
    svg.append(label);
  }

  // uncertainty band (under everything else)
  if (drawn.length >= 2) {
    const band = document.createElementNS(NS, "path");
    band.setAttribute("class", "forecast-band");
    const top = drawn.map((p, i) => `${i === 0 ? "M" : "L"}${X(Date.parse(p.date)).toFixed(1)},${Y(p.high).toFixed(1)}`).join("");
    const bottom = [...drawn].reverse().map((p) => `L${X(Date.parse(p.date)).toFixed(1)},${Y(p.low).toFixed(1)}`).join("");
    band.setAttribute("d", `${top}${bottom}Z`);
    svg.append(band);
  }

  // goal weight line + vertical markers (eta, goal date)
  if (goalKg !== null) {
    const gl = document.createElementNS(NS, "line");
    gl.setAttribute("class", "goal-line");
    gl.setAttribute("x1", M.left);
    gl.setAttribute("x2", W - M.right);
    gl.setAttribute("y1", Y(goalKg));
    gl.setAttribute("y2", Y(goalKg));
    svg.append(gl);
  }
  const markers = [];
  if (forecast && forecast.goal && forecast.goal.eta) markers.push([forecast.goal.eta, "mål"]);
  if (forecast && forecast.weight_at_goal_date) markers.push([forecast.weight_at_goal_date.date, "måldatum"]);
  for (const [date, text] of markers) {
    const t = Date.parse(date);
    if (t < x0 || t > x1) continue;
    const ml = document.createElementNS(NS, "line");
    ml.setAttribute("class", "marker-line");
    ml.setAttribute("x1", X(t));
    ml.setAttribute("x2", X(t));
    ml.setAttribute("y1", M.top);
    ml.setAttribute("y2", H - M.bottom);
    svg.append(ml);
    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "axis-label");
    label.setAttribute("x", X(t) + 3);
    label.setAttribute("y", M.top + 8);
    label.textContent = text;
    svg.append(label);
  }

  // projection: dashed, low opacity — clearly an estimate
  if (drawn.length >= 1 && series.length >= 1) {
    const lastT = days[days.length - 1];
    const lastKg = kgs[kgs.length - 1];
    const fp = document.createElementNS(NS, "path");
    fp.setAttribute("class", "forecast-line");
    const d =
      `M${X(lastT).toFixed(1)},${Y(lastKg).toFixed(1)}` +
      drawn.map((p) => `L${X(Date.parse(p.date)).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("");
    fp.setAttribute("d", d);
    svg.append(fp);
  }

  // actual weigh-ins: full opacity line + dots (drawn last, on top)
  if (series.length >= 2) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "trend-line");
    path.setAttribute("d", series.map((w, i) => `${i === 0 ? "M" : "L"}${X(days[i]).toFixed(1)},${Y(kgs[i]).toFixed(1)}`).join(""));
    svg.append(path);
  }
  series.forEach((w, i) => {
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", `trend-dot${i === series.length - 1 ? " last" : ""}`);
    dot.setAttribute("cx", X(days[i]));
    dot.setAttribute("cy", Y(kgs[i]));
    dot.setAttribute("r", i === series.length - 1 ? 5 : 3.5);
    const tip = document.createElementNS(NS, "title");
    tip.textContent = `${w.date}: ${sv(w.weight_kg)} kg`;
    dot.append(tip);
    svg.append(dot);
  });

  // selective direct label: last actual point only
  const last = series[series.length - 1];
  const label = document.createElementNS(NS, "text");
  label.setAttribute("class", "point-label");
  const lx = X(days[days.length - 1]);
  label.setAttribute("x", Math.min(lx, W - M.right - 4));
  label.setAttribute("y", Y(last.weight_kg) - 10);
  label.setAttribute("text-anchor", "end");
  label.textContent = `${sv(last.weight_kg)} kg`;
  svg.append(label);

  frame.append(svg);
  return frame;
}

async function renderRegler() {
  const data = await api("/ui/api/preferences");
  view.append(el("h2", "", "Mål per dagstyp"));
  const wrap = el("div", "tablewrap");
  const table = el("table");
  table.append(tableHead("Dagstyp", "kcal", "Protein golv", "Fett golv", "Kolh. riktnivå"));
  const tbody = el("tbody");
  for (const t of data.targets) {
    const tr = el("tr");
    tr.append(
      el("td", "", t.day_type),
      el("td", "", sv(t.kcal, 0)),
      el("td", "", sv(t.protein_min, 0)),
      el("td", "", sv(t.fat_min, 0)),
      el("td", "", t.carbs !== null ? sv(t.carbs, 0) : "—"),
    );
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
  view.append(wrap);

  const groups = { stil: "Stil", regel: "Regler", mål: "Mål" };
  for (const [key, title] of Object.entries(groups)) {
    const prefs = data.preferences.filter((p) => p.category === key);
    if (!prefs.length) continue;
    view.append(el("h2", "", `${title} · ${prefs.length}`));
    const card = el("div", "kvitto");
    for (const p of prefs) {
      const row = el("div", "k-row");
      row.style.alignItems = "flex-start";
      row.append(el("span", "amount", `${p.id}`), el("span", "", "  "), el("span", "", p.content));
      row.lastChild.style.color = "var(--ink)";
      row.lastChild.style.flex = "1";
      card.append(row);
    }
    view.append(card);
  }
}

/* ---------- router ---------- */

const routes = [
  { match: /^#\/idag$/, render: renderIdag, tab: "idag" },
  { match: /^#\/dagar$/, render: renderDagar, tab: "dagar" },
  { match: /^#\/dagar\/(\d{4}-\d{2}-\d{2})$/, render: (m) => renderDagDetalj(m[1]), tab: "dagar" },
  { match: /^#\/produkter$/, render: renderProdukter, tab: "produkter" },
  { match: /^#\/recept$/, render: renderRecept, tab: "recept" },
  { match: /^#\/recept\/(\d+)$/, render: (m) => renderReceptDetalj(m[1]), tab: "recept" },
  { match: /^#\/vikt$/, render: renderVikt, tab: "vikt" },
  { match: /^#\/regler$/, render: renderRegler, tab: "regler" },
];

let navSeq = 0;

async function navigate() {
  const seq = ++navSeq;
  const hash = location.hash || "#/idag";
  const route = routes.find((r) => r.match.test(hash));
  if (!route) {
    location.hash = "#/idag";
    return;
  }
  document.querySelectorAll(".tabbar a").forEach((a) => {
    a.classList.toggle("active", a.dataset.tab === route.tab);
  });
  const stage = el("div");
  view = stage;
  try {
    await route.render(hash.match(route.match));
    if (seq !== navSeq) return; // a newer navigation won
    viewHost.replaceChildren(...stage.childNodes);
  } catch (e) {
    if (seq !== navSeq) return;
    if (e.message !== "session expired") {
      viewHost.replaceChildren(el("div", "error-banner", `Kunde inte hämta data: ${e.message}`));
    }
  }
  window.scrollTo(0, 0);
}

mastheadMeta.textContent = new Date().toLocaleDateString("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

window.addEventListener("hashchange", navigate);
navigate();
