import { useState } from "react";
import { AddWidgetMenu } from "./AddWidgetMenu";
import { WidgetFrame, type DragState } from "./WidgetFrame";
import { getWidget, listWidgets } from "./widgets/registry";
import { useDashboardLayout } from "../hooks/useDashboardLayout";

export function Dashboard() {
  const { layout, addWidget, removeWidget, moveWidget, moveWidgetTo, resetLayout } =
    useDashboardLayout();
  const [drag, setDrag] = useState<DragState | null>(null);
  const availableWidgets = listWidgets();

  return (
    <>
      <div className="dashboard-toolbar">
        <AddWidgetMenu widgets={availableWidgets} onAdd={addWidget} />
        <button type="button" className="btn btn-ghost" onClick={resetLayout}>
          Reset layout
        </button>
        <span className="toolbar-hint">Drag a widget by its handle to reorder, or use ↑ / ↓.</span>
      </div>

      {layout.length === 0 ? (
        <div className="dashboard-empty">
          <strong>No widgets on your dashboard.</strong>
          <span>Use “Add widget” to add one.</span>
        </div>
      ) : (
        <div className="dashboard-grid">
          {layout.map((instance) => {
            const definition = getWidget(instance.type);
            if (definition == null) return null;
            return (
              <WidgetFrame
                key={instance.id}
                instance={instance}
                definition={definition}
                drag={drag}
                onDragStart={(id) => setDrag({ id, overId: null })}
                onDragOver={(overId) =>
                  setDrag((current) => (current ? { ...current, overId } : null))
                }
                onDrop={moveWidgetTo}
                onDragEnd={() => setDrag(null)}
                onMove={moveWidget}
                onRemove={removeWidget}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
