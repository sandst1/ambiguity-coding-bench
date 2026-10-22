import { useState } from "react";
import type { DragEvent } from "react";
import { getWidgetDefinition } from "./widgets/registry";
import { useDashboardLayout } from "./state/useDashboardLayout";
import { WidgetCard } from "./components/WidgetCard";
import { AddWidgetMenu } from "./components/AddWidgetMenu";

export function App() {
  const { layout, addWidget, removeWidget, moveWidget } = useDashboardLayout();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragOver = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDrop = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (dragIndex !== null) moveWidget(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  };

  const visibleLayout = layout.filter((id) => getWidgetDefinition(id) != null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="app-header-actions">
          <AddWidgetMenu currentLayout={layout} onAdd={addWidget} />
          <span className="meta">env: production</span>
        </div>
      </header>

      <div className="dashboard-grid">
        {visibleLayout.map((id, index) => {
          const definition = getWidgetDefinition(id);
          if (!definition) return null;
          return (
            <WidgetCard
              key={id}
              definition={definition}
              dragging={dragIndex === index}
              dropTarget={overIndex === index && dragIndex !== null}
              onDragStart={(event) => handleDragStart(index, event)}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
              onRemove={removeWidget}
            />
          );
        })}
      </div>

      {visibleLayout.length === 0 ? (
        <div className="dashboard-empty">
          <p>No widgets on the dashboard.</p>
          <AddWidgetMenu currentLayout={layout} onAdd={addWidget} />
        </div>
      ) : null}
    </div>
  );
}
