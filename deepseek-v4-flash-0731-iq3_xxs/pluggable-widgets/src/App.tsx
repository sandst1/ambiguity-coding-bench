import { Dashboard } from "./components/Dashboard";
import "./widgets"; // registers built-in widget types

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>

      <Dashboard />
    </div>
  );
}
