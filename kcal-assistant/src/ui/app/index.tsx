import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Idag } from "./views/Idag";
import { Dagar } from "./views/Dagar";
import { DagDetalj } from "./views/DagDetalj";

const TABS = [
  ["idag", "Idag"], ["dagar", "Dagar"], ["produkter", "Produkter"],
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

// Placeholder views replaced task by task.
const Placeholder = ({ name }: { name: string }) => <div className="empty">{name} portas …</div>;

export interface Route { tab: string; el: ReactNode }

export function resolveRoute(hash: string): Route {
  let m: RegExpMatchArray | null;
  if (/^#\/idag$/.test(hash)) return { tab: "idag", el: <Idag /> };
  if (/^#\/dagar$/.test(hash)) return { tab: "dagar", el: <Dagar /> };
  if ((m = hash.match(/^#\/dagar\/(\d{4}-\d{2}-\d{2})$/))) return { tab: "dagar", el: <DagDetalj date={m[1]!} /> };
  if (/^#\/produkter$/.test(hash)) return { tab: "produkter", el: <Placeholder name="Produkter" /> };
  if (/^#\/recept$/.test(hash)) return { tab: "recept", el: <Placeholder name="Recept" /> };
  if ((m = hash.match(/^#\/recept\/(\d+)$/))) return { tab: "recept", el: <Placeholder name={`Recept ${m[1]}`} /> };
  if (/^#\/vikt$/.test(hash)) return { tab: "vikt", el: <Placeholder name="Vikt" /> };
  if (/^#\/regler$/.test(hash)) return { tab: "regler", el: <Placeholder name="Regler" /> };
  location.hash = "#/idag";
  return { tab: "idag", el: null };
}

function App() {
  const hash = useHashRoute();
  const route = resolveRoute(hash);
  useEffect(() => window.scrollTo(0, 0), [hash]);
  return (
    <>
      <header className="masthead">
        <span className="brand">KCAL<span className="brand-sep">·</span>DB</span>
        <span className="masthead-meta">
          {new Date().toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </header>
      <main className="view" aria-live="polite">
        <div key={hash}>{route.el}</div>
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
