import { useState } from "react";
import { DashboardLayout } from "./components/DashboardLayout";

// Ensure all widgets are imported and registered
// (side-effect of the import calls registerWidget)
import "./components/widgets/StatsWidget";
import "./components/widgets/LatencyWidget";
import "./components/widgets/ErrorsWidget";
import "./components/widgets/ActivityWidget";
import "./components/widgets/ServicesWidget";

export function App() {
  const [env] = useState<"staging" | "production">("production");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: {env}</span>
      </header>

      <DashboardLayout />
    </div>
  );
}