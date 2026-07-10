import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { api, sv, type Profile } from "../api";
import { KvittoSelect, type SelectOption } from "./ui/Select";

export interface Overrides { activity?: string; intake?: string; goal?: string; goal_date?: string }
export interface PrognosParams { source: "targets" | "recent"; overrides: Overrides }

export function forecastQuery(p: PrognosParams): string {
  const params = new URLSearchParams({ source: p.source });
  const o = p.overrides;
  if (o.activity !== undefined && o.activity !== "") params.set("activity", o.activity);
  if (o.intake !== undefined && o.intake !== "") params.set("intake", o.intake);
  if (o.goal !== undefined && o.goal !== "") params.set("goal", o.goal);
  if (o.goal_date !== undefined) params.set("goal_date", o.goal_date);
  return params.toString();
}

const ACTIVITY_LEVELS: SelectOption[] = [
  { value: "1.2", label: "stillasittande (1,2)", description: "kontorsjobb, lite eller ingen träning" },
  { value: "1.375", label: "lätt aktiv (1,375)", description: "lätt träning 1–3 dagar i veckan" },
  { value: "1.55", label: "måttligt aktiv (1,55)", description: "träning 3–5 dagar i veckan" },
  { value: "1.725", label: "mycket aktiv (1,725)", description: "hård träning 6–7 dagar i veckan" },
  { value: "1.9", label: "extremt aktiv (1,9)", description: "mycket hård träning och fysiskt arbete" },
];

export function PrognosPanel({ profile, params, setParams, onSaved }: {
  profile: Profile | null;
  params: PrognosParams;
  setParams: (fn: (prev: PrognosParams) => PrognosParams) => void;
  onSaved: () => void;
}) {
  const hasProfile = profile !== null;
  const storedAf = profile ? String(profile.activity_factor) : "";

  const [activity, setActivity] = useState(storedAf);
  const [intake, setIntake] = useState("");
  const [goal, setGoal] = useState(profile?.goal_weight_kg != null ? String(profile.goal_weight_kg) : "");
  const [goalDate, setGoalDate] = useState(profile?.goal_date ?? "");
  const [birth, setBirth] = useState(profile?.birth_date ?? "");
  const [sex, setSex] = useState<string>(profile?.sex ?? "man");
  const [height, setHeight] = useState(profile ? String(profile.height_cm) : "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const activityOptions: SelectOption[] = [
    ...(hasProfile && !ACTIVITY_LEVELS.some((o) => o.value === storedAf)
      ? [{ value: storedAf, label: `anpassad (${sv(profile!.activity_factor)})`, description: "eget värde satt via chatten", disabled: true }]
      : []),
    ...ACTIVITY_LEVELS,
  ];

  const setOverride = (key: keyof Overrides, value: string) =>
    setParams((prev) => ({ ...prev, overrides: { ...prev.overrides, [key]: value } }));

  const save = async () => {
    setSaving(true);
    setStatus("sparar …");
    const fields: Record<string, unknown> = {};
    if (birth) fields.birth_date = birth;
    if (sex) fields.sex = sex;
    if (height) fields.height_cm = Number(height);
    if (activity) fields.activity_factor = Number(activity);
    fields.goal_weight_kg = goal === "" ? null : Number(goal);
    fields.goal_date = goalDate === "" ? null : goalDate;
    try {
      await api("/ui/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) });
      onSaved(); // remounts the view: canonical re-fetch, overrides cleared
    } catch (e) {
      setStatus(`fel: ${(e as Error).message}`);
      setSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-row">
        <label className="field">
          <span className="label">Aktivitetsnivå</span>
          <KvittoSelect ariaLabel="Aktivitetsnivå" value={activity} placeholder="välj nivå …" options={activityOptions}
            onChange={(v) => { setActivity(v); setOverride("activity", v); }} />
        </label>
        <label className="field">
          <span className="label">Intag (what-if)</span>
          <input type="number" min={500} max={10000} step={50} placeholder="auto" value={intake}
            onChange={(e) => { setIntake(e.target.value); setOverride("intake", e.target.value); }} />
        </label>
        <label className="field">
          <span className="label">Målvikt kg</span>
          <input type="number" min={1} max={500} step={0.5} value={goal}
            onChange={(e) => { setGoal(e.target.value); setOverride("goal", e.target.value); }} />
        </label>
        <label className="field">
          <span className="label">Måldatum</span>
          <input type="date" value={goalDate}
            onChange={(e) => { setGoalDate(e.target.value); setOverride("goal_date", e.target.value); }} />
        </label>
      </div>
      <div className="chip-row">
        {([["targets", "planmål"], ["recent", "senaste 28 d"]] as const).map(([key, label]) => (
          <button key={key} className={`chip${params.source === key ? " accent" : ""}`}
            onClick={() => setParams((prev) => (prev.source === key ? prev : { ...prev, source: key }))}>
            {label}
          </button>
        ))}
      </div>
      <Collapsible.Root defaultOpen={!hasProfile}>
        <div className="card">
          <Collapsible.Trigger asChild>
            <button className="collapsible-summary">{hasProfile ? "Profil" : "Skapa profil"}</button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="body settings-row">
              <label className="field">
                <span className="label">Födelsedatum</span>
                <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Kön</span>
                <select value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="man">man</option>
                  <option value="kvinna">kvinna</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Längd cm</span>
                <input type="number" min={50} max={250} step={1} value={height} onChange={(e) => setHeight(e.target.value)} />
              </label>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
      <div className="settings-save">
        <button className="loadmore" disabled={saving} onClick={save}>Spara</button>
        <span className="k-sub">{status}</span>
      </div>
    </div>
  );
}
