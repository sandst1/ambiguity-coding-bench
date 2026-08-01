import { useRef, useState } from "react";
import { useWidgetLayout } from "../hooks/useWidgetLayout";
import { getWidget } from "../widgets/registry";
import type { WidgetInstance } from "../hooks/useWidgetLayout";

export function Dashboard() {
  const { instances, available, addWidget, removeWidget, moveWidget, resetLayout } =
    useWidgetLayout();

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <WidgetPicker
          available={available}
          onAdd={(widgetId) => addWidget(widgetId)}
          disabled={available.length === 0}
        />
        <button type="button" className="toolbar-button" onClick={resetLayout}>
          Reset layout
        </button>
      </div>

      <div className="dashboard-grid">
        {instances.map((instance, index) => (
          <WidgetCard
            key={instance.instanceId}
            instance={instance}
            index={index}
            count={instances.length}
            onRemove={() => removeWidget(instance.instanceId)}
            onMove={moveWidget}
          />
        ))}
        {instances.length === 0 && (
          <div className="dashboard-empty">
            No widgets on the dashboard. Add one from the list above.
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetPicker({
  available,
  onAdd,
  disabled,
}: {
  available: { id: string; title: string }[];
  onAdd: (widgetId: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const handleAdd = () => {
    if (!value) return;
    onAdd(value);
    setValue("");
  };
  return (
    <div className="picker">
      <select
        className="picker-select"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {disabled ? "All widgets added" : "Add a widget…"}
        </option>
        {available.map((w) => (
          <option key={w.id} value={w.id}>
            {w.title}
          </option>
        ))}
      </select>
      <button type="button" className="toolbar-button" onClick={handleAdd} disabled={disabled || !value}>
        Add
      </button>
    </div>
  );
}

function WidgetCard({
  instance,
  index,
  count,
  onRemove,
  onMove,
}: {
  instance: WidgetInstance;
  index: number;
  count: number;
  onRemove: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const definition = getWidget(instance.widgetId);
  const dragIndex = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!definition) return null;

  const Body = definition.component;

  const handleDragStart = (e: React.DragEvent) => {
    dragIndex.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (dragIndex.current === null) return;
    onMove(dragIndex.current, index);
    dragIndex.current = null;
  };

  return (
    <section
      className={`widget ${isDragging ? "widget--dragging" : ""}`}
      style={{ gridColumn: `span ${definition.defaultCols}` }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="widget-header">
        <span
          className="widget-drag"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={() => {
            setIsDragging(false);
            dragIndex.current = null;
          }}
          title="Drag to reorder"
        >
          ⠿
        </span>
        <div className="widget-heading">
          <span className="widget-title">{definition.title}</span>
          {definition.subtitle && (
            <span className="widget-subtitle">{definition.subtitle}</span>
          )}
        </div>
        <div className="widget-actions">
          {count > 1 && (
            <button
              type="button"
              className="widget-action"
              onClick={() => onMove(index, Math.max(0, index - 1))}
              title="Move left"
            >
              ‹
            </button>
          )}
          {count > 1 && (
            <button
              type="button"
              className="widget-action"
              onClick={() => onMove(index, Math.min(count - 1, index + 1))}
              title="Move right"
            >
              ›
            </button>
          )}
          <button
            type="button"
            className="widget-action widget-action--remove"
            onClick={onRemove}
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="widget-body">
        <Body />
      </div>
    </section>
  );
}
