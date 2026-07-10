import { createRoot } from "react-dom/client";

function App() {
  return (
    <header className="masthead">
      <span className="brand">KCAL<span className="brand-sep">·</span>DB</span>
      <span className="masthead-meta">react-skal</span>
    </header>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
