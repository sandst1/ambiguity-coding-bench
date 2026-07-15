import { useState, useEffect } from "react";
import { DashboardProvider } from "./lib/dashboard-context";
import { DashboardLayout } from "./lib/dashboard-layout";
import { registry } from "./lib/widget-types";

// ── Register existing widgets as pluggable types ──────────────────────────────
// Adding a new widget is now as simple as adding one line below:
//   registry.registerWidget({ id, name, component, gridSpan });

import { StatsWidget } from "./components/widgets/StatsWidget";
import { LatencyWidget } from "./components/widgets/LatencyWidget";
import { ErrorsWidget } from "./components/widgets/ErrorsWidget";
import { ActivityWidget } from "./components/widgets/ActivityWidget";
import { ServicesWidget } from "./components/widgets/ServicesWidget";

// Register each widget type with the pluggable registry
registry.registerWidget({ id: "stats", name: "Summary", component: StatsWidget, gridSpan: 3 });
registry.registerWidget({ id: "latency", name: "Request latency", component: LatencyWidget, gridSpan: 6 });
registry.registerWidget({ id: "errors", name: "Errors", component: ErrorsWidget, gridSpan: 3 });
registry.registerWidget({ id: "activity", name: "Recent activity", component: ActivityWidget, gridSpan: 7 });
registry.registerWidget({ id: "services", name: "Services", component: ServicesWidget, gridSpan: 5 });

// ── App shell ───────────────────────────────────────────────────────────────
export function App() {
  return (
    <DashboardProvider>
      <div className="app">
        <header className="app-header">
          <h1>Ops Dashboard</h1>
          <span className="meta">env: production</span>
        </header>
        <DashboardLayout />
      </div>
    </DashboardProvider>
  );
}
