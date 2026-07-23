import { Fragment, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Idag } from "./views/Idag";
import { Dagar } from "./views/Dagar";
import { DagDetalj } from "./views/DagDetalj";
import { Produkter } from "./views/Produkter";
import { Recept } from "./views/Recept";
import { ReceptDetalj } from "./views/ReceptDetalj";
import { Vikt } from "./views/Vikt";
import { Regler } from "./views/Regler";
import { Vecka } from "./views/Vecka";

const TABS = [
  ["idag", "Idag"], ["vecka", "Vecka"], ["dagar", "Dagar"], ["produkter", "Produkter"],
  ["recept", "Recept"], ["vikt", "Vikt"], ["regler", "Regler"],
] as const;

export function useHashRoute(): string {
  const [hash, setHash] = useState(() => location.hash || "#/idag");
  useEffect(() => {
    const onChange = () => setHash(location.hash || "#/idag");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export interface Route { tab: string; el: ReactNode }

export function resolveRoute(hash: string): Route {
  let m: RegExpMatchArray | null;
  if (/^#\/idag$/.test(hash)) return { tab: "idag", el: <Idag /> };
  if (/^#\/vecka$/.test(hash)) return { tab: "vecka", el: <Vecka /> };
  if (/^#\/dagar$/.test(hash)) return { tab: "dagar", el: <Dagar /> };
  if ((m = hash.match(/^#\/dagar\/(\d{4}-\d{2}-\d{2})$/))) return { tab: "dagar", el: <DagDetalj date={m[1]!} /> };
  if (/^#\/produkter$/.test(hash)) return { tab: "produkter", el: <Produkter /> };
  if (/^#\/recept$/.test(hash)) return { tab: "recept", el: <Recept /> };
  if ((m = hash.match(/^#\/recept\/(\d+)$/))) return { tab: "recept", el: <ReceptDetalj id={m[1]!} /> };
  if (/^#\/vikt$/.test(hash)) return { tab: "vikt", el: <Vikt /> };
  if (/^#\/regler$/.test(hash)) return { tab: "regler", el: <Regler /> };
  location.hash = "#/idag";
  return { tab: "idag", el: null };
}

type Theme = "system" | "light" | "dark";
const THEME_LABEL: Record<Theme, string> = { system: "system", light: "ljust", dark: "mörkt" };
const THEME_NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem("kcal.theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function applyTheme(t: Theme): void {
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try {
    if (t === "system") localStorage.removeItem("kcal.theme");
    else localStorage.setItem("kcal.theme", t);
  } catch {
    // private mode etc — the attribute still applied, only persistence is lost
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const cycle = () => {
    const next = THEME_NEXT[theme];
    applyTheme(next);
    setTheme(next);
  };
  return (
    <button className="theme-toggle" aria-label="växla tema" onClick={cycle}>
      tema: {THEME_LABEL[theme]}
    </button>
  );
}

function App() {
  const hash = useHashRoute();
  const route = resolveRoute(hash);
  // Block body on purpose: an arrow with an implicit-return expression body
  // makes the effect's cleanup value whatever window.scrollTo() returns. Per
  // spec that's undefined (harmless), but some embedding/automation contexts
  // (observed: Playwright-driven Chromium) return a non-function object
  // instead — React then tries to call it as the effect's destroy function on
  // the next unmount and throws "TypeError: <x> is not a function" deep in
  // react-dom's commit phase, leaving the view blank. Discard the return value.
  useEffect(() => { window.scrollTo(0, 0); }, [hash]);
  return (
    <>
      <header className="masthead">
        <span className="brand">KCAL<span className="brand-sep">·</span>DB</span>
        <span className="masthead-meta">
          {new Date().toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
        </span>
        <ThemeToggle />
      </header>
      <main className="view" aria-live="polite">
        <Fragment key={hash}>{route.el}</Fragment>
      </main>
      <nav className="tabbar" aria-label="Vyer">
        {TABS.map(([tab, label]) => (
          <a key={tab} href={`#/${tab}`} data-tab={tab} className={route.tab === tab ? "active" : ""}>{label}</a>
        ))}
      </nav>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
