import type { ReactNode } from "react";
import { sv, type Macros } from "../api";

export const macroLine = (m: Macros): string =>
  `${sv(m.kcal, 0)} kcal · P ${sv(m.protein)} · F ${sv(m.fat)} · K ${sv(m.carbs)}`;

export function Tile({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="tile">
      <div className="t-label">{label}</div>
      <div className="t-value">{value}</div>
      {sub ? <div className="t-sub">{sub}</div> : null}
    </div>
  );
}

export function LeaderRow({ cls = "k-row", label, amount, sub }: { cls?: string; label: string; amount: string; sub?: string }) {
  return (
    <>
      <div className={cls}>
        <span className="label">{label}</span>
        <span className="leader" />
        <span className="amount">{amount}</span>
      </div>
      {sub ? <div className="k-sub">{sub}</div> : null}
    </>
  );
}

export function Meter({ label, value, target, floor = false, unit = "g" }: { label: string; value: number; target: number; floor?: boolean; unit?: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const cls = floor ? (value >= target ? "ok" : "under") : "neutral";
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="label">{label}</span>
        <span className="leader" />
        <span className="value">
          {floor ? (
            <>
              <span className={`status ${cls}`}>{sv(value)} </span>
              <span>/ {sv(target)} {unit}</span>
            </>
          ) : (
            `${sv(value)} / ${sv(target)} ${unit}`
          )}
        </span>
      </div>
      <div className="meter-track"><div className={`meter-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function ErrorNote({ message }: { message: string }) {
  return <div className="error-banner">Kunde inte hämta data: {message}</div>;
}
