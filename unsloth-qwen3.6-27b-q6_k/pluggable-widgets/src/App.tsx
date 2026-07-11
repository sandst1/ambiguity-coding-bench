import type { WidgetInstance } from "./types";
import { useDashboardLayout } from "./hooks/useDashboardLayout";
import { WidgetWrapper } from "./components/WidgetWrapper";
import { WidgetPicker } from "./components/WidgetPicker";

// Side-effect imports to register widgets with the registry
import "./components/widgets/StatsWidget";
import "./components/widgets/LatencyWidget";
import "./components/widgets/ErrorsWidget";
import "./components/widgets/ActivityWidget";
import "./components/widgets/ServicesWidget";

const defaultLayout: WidgetInstance[] = [
  { instanceId: "default-stats", typeId: "stats", span: 3 },
  { instanceId: "default-latency", typeId: "latency", span: 6 },
  { instanceId: "default-errors", typeId: "errors", span: 3 },
  { instanceId: "default-activity", typeId: "activity", span: 7 },
  { instanceId: "default-services", typeId: "services", span: 5 },
];

export function App() {
  const { layout, addWidget, removeWidget, reorderWidget, resizeWidget, resetLayout } =
    useDashboardLayout(defaultLayout);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header-actions">
          {layout.length > 0 && (
            <button className="app-reset-btn" onClick={resetLayout}>
              Reset layout
            </button>
          )}
          <span className="meta">env: production</span>
          <WidgetPicker onAdd={addWidget} />
        </div>
      </header>

      <div className="dashboard-grid">
        {layout.length === 0 && (
          <div className="dashboard-empty">
            <p>No widgets yet. Click <strong>+ Widget</strong> to add one.</p>
          </div>
        )}
        {layout.map((instance) => (
          <WidgetWrapper
            key={instance.instanceId}
            instance={instance}
            onRemove={removeWidget}
            onReorder={reorderWidget}
            onResize={resizeWidget}
          />
        ))}
      </div>
    </div>
  );
}
