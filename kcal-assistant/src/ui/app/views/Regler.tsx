import { sv, useApi, type DayTargets, type Preference } from "../api";
import { ErrorNote } from "../components/Bits";

const GROUPS: Array<[string, string]> = [["stil", "Stil"], ["regel", "Regler"], ["mål", "Mål"]];

export function Regler() {
  const { data, error } = useApi<{ preferences: Preference[]; targets: Array<DayTargets & { day_type: string }> }>("/ui/api/preferences");
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  return (
    <>
      <h2>Mål per dagstyp</h2>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Dagstyp</th><th>kcal</th><th>Protein golv</th><th>Fett golv</th><th>Kolh. riktnivå</th></tr></thead>
          <tbody>
            {data.targets.map((t) => (
              <tr key={t.day_type}>
                <td>{t.day_type}</td><td>{sv(t.kcal, 0)}</td><td>{sv(t.protein_min, 0)}</td><td>{sv(t.fat_min, 0)}</td><td>{t.carbs !== null ? sv(t.carbs, 0) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {GROUPS.map(([key, title]) => {
        const prefs = data.preferences.filter((p) => p.category === key);
        if (!prefs.length) return null;
        return (
          <div key={key}>
            <h2>{title} · {prefs.length}</h2>
            <div className="kvitto">
              {prefs.map((p) => (
                <div className="k-row" style={{ alignItems: "flex-start" }} key={p.id}>
                  <span className="amount">{p.id}</span>
                  <span>{"  "}</span>
                  <span style={{ color: "var(--ink)", flex: 1 }}>{p.content}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
