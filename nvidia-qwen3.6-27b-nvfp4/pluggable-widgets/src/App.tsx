import { useCallback, useState } from "react";
import { DashboardProvider, useDashboard } from "./dashboard";
import { getWidgetType } from "./registry";
import { WidgetPicker } from "./components/WidgetPicker";
import "./components/widgets";

function DashboardHeader() {
  const { addWidget, resetLayout, layout } = useDashboard();
  const currentTypes = layout.map((w) => w.type);

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production · {layout.length} widget{layout.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="header-actions">
        <WidgetPicker onAdd={addWidget} currentTypes={currentTypes} />
        <button className="header-btn" onClick={resetLayout} title="Restore defaults">
          Reset layout
        </button>
      </div>
    </header>
  );
}

function DashboardGrid() {
  const { layout, removeWidget, reorderWidget } = useDashboard();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (i: number) => setDragIdx(i),
    [],
  );

  const handleDragOver = useCallback((_i: number) => {}, []);

  const handleDrop = useCallback(
    (i: number) => {
      if (dragIdx !== null && dragIdx !== i) {
        reorderWidget(dragIdx, i);
      }
      setDragIdx(null);
    },
    [dragIdx, reorderWidget],
  );

  const handleDragEnd = useCallback(() => setDragIdx(null), []);

  return (
    <div className="dashboard-grid">
      {layout.map((placed, idx) => {
        const meta = getWidgetType(placed.type);
        if (!meta) return null;
        const WidgetComp = meta.component;
        const isDragging = dragIdx === idx;
        return (
          <div
            key={placed.id}
            className={`widget-frame${isDragging ? " widget-frame--dragging" : ""}`}
            style={{ gridColumn: `span ${meta.gridSpan}` }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              handleDragStart(idx);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(idx);
            }}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
          >
            <WidgetComp />
            <div className="widget-frame-controls">
              <span className="widget-drag-handle" title="Drag to reorder">⠿</span>
              <button
                className="widget-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(placed.id);
                }}
                title={`Remove ${meta.title}`}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
      {layout.length === 0 && (
        <div className="dashboard-empty">
          <p className="empty-text">No widgets. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}

function AppInner() {
  return (
    <div className="app">
      <DashboardHeader />
      <DashboardGrid />
    </div>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <AppInner />
    </DashboardProvider>
  );
}