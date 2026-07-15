import { useState, useMemo } from "react";
import { useDashboard } from "./dashboard-context";
import { widgetTypes, type WidgetDefinition } from "./widget-types";
import "./dashboard-layout.css";

export function DashboardLayout() {
  const { widgets, availableTypes, addWidget, removeWidget, moveUp, moveDown, resetLayout } = useDashboard();

  // Find which widget types are currently on the dashboard
  const usedTypeIds = useMemo(() => new Set(widgets.map((w) => w.typeId)), [widgets]);

  // Widget definitions that the user can add
  const availableWidgets = availableTypes.filter((t) => !usedTypeIds.has(t.id));

  return (
    <div className="dashboard-layout">
      {/* Toolbar */}
      <div className="layout-toolbar">
        <h2>Dashboard</h2>
        <div className="toolbar-actions">
          <button onClick={resetLayout} className="btn btn--secondary">Reset Layout</button>
        </div>
      </div>

      {/* Widget grid */}
      <div className="layout-grid">
        {widgets.map((instance, index) => {
          const def = widgetTypes.get(instance.typeId);
          if (!def) return null;
          return (
            <div key={instance.typeId} className="layout-widget" style={{ gridColumn: `span ${def.gridSpan || 3}` }}>
              <WidgetCard
                widget={def}
                instance={instance}
                index={index}
                onRemove={() => removeWidget(instance.typeId)}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < widgets.length - 1}
              />
            </div>
          );
        })}
      </div>

      {/* Add widget panel */}
      {availableWidgets.length > 0 && (
        <div className="layout-add-panel">
          <h3>Add Widget</h3>
          {availableWidgets.map((type) => (
            <button
              key={type.id}
              onClick={() => addWidget(type.id)}
              className="btn btn--add"
              title={`Add ${type.name}`}
            >
              + {type.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetCard({
  widget,
  instance,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  widget: WidgetDefinition;
  instance: { typeId: string; order: number; config?: unknown };
  index: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="widget-card">
      {/* Drag handle / controls */}
      <div className="widget-controls">
        {canMoveUp && <button className="btn btn--icon btn--up" onClick={onMoveUp} title="Move up" />}
        <button className="btn btn--icon btn--remove" onClick={onRemove} title="Remove widget" />
        {canMoveDown && <button className="btn btn--icon btn--down" onClick={onMoveDown} title="Move down" />}
      </div>

      {/* Render the actual widget */}
      <div className="widget-content">
        <widget.component type={widget} config={instance.config} />
      </div>
    </div>
  );
}
