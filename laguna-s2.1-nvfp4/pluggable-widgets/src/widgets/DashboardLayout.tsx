import { useEffect, useState, useRef } from "react";
import { useDashboard } from "./dashboard-context";
import { getWidget, type WidgetDefinition } from "./registry";
import { WidgetWrapper } from "./WidgetWrapper";

export function DashboardLayout() {
  const { items, reorderItems, isEditing } = useDashboard();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (widgetId: string) => {
    setDraggedId(widgetId);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isEditing) return;
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIndex(null);
    if (!isEditing || draggedId === null) return;

    const draggedIndex = items.findIndex((item) => item.widgetId === draggedId);
    if (draggedIndex === dropIndex) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);
    reorderItems(newItems);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  if (items.length === 0) {
    return (
      <div className="dashboard-empty">
        <p>No widgets on the dashboard.</p>
        <p>Add one from the widget palette.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {items.map((item, index) => {
        const widget = getWidget(item.widgetId);
        if (!widget) return null;
        return (
          <DashboardWidgetItem
            key={item.widgetId}
            widget={widget}
            width={item.w}
            index={index}
            isEditing={isEditing}
            isDragged={draggedId === item.widgetId}
            isDragOver={dragOverIndex === index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        );
      })}
    </div>
  );
}

interface DashboardWidgetItemProps {
  widget: WidgetDefinition<unknown>;
  width: number;
  index: number;
  isEditing: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  onDragStart: (widgetId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

function DashboardWidgetItem({
  widget,
  width,
  index,
  isEditing,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: DashboardWidgetItemProps) {
  const [data, setData] = useState<unknown | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    widget.fetch().then(
      (result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      },
      (err: Error) => {
        if (!cancelled) setError(err);
      }
    );

    if (widget.intervalMs) {
      intervalRef.current = setInterval(() => {
        widget.fetch().then(
          (result) => {
            if (!cancelled) setData(result);
          },
          (err: Error) => {
            if (!cancelled) setError(err);
          }
        );
      }, widget.intervalMs);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [widget]);

  return (
    <div
      className={`widget widget--${widget.id} ${isDragOver ? "drag-over" : ""} ${isDragged ? "dragging" : ""}`}
      style={{ gridColumn: `span ${width}` }}
      draggable={isEditing}
      onDragStart={() => onDragStart(widget.id)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <WidgetWrapper widget={widget} data={data} error={error} />
    </div>
  );
}
