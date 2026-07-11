import { useRef, useState } from "react";
import type { WidgetInstance, GridSpan } from "../types";
import { getWidgetDef } from "../registry";

const SPANS: GridSpan[] = [3, 5, 6, 7, 9, 12];

export function WidgetWrapper({
  instance,
  onRemove,
  onReorder,
  onResize,
}: {
  instance: WidgetInstance;
  onRemove: (instanceId: string) => void;
  onReorder: (draggedId: string, overId: string) => void;
  onResize: (instanceId: string, span: GridSpan) => void;
}) {
  const def = getWidgetDef(instance.typeId);
  const WidgetComponent = def?.component;
  const dragItem = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);
  const [showResize, setShowResize] = useState(false);

  const handleDragStart = () => {
    dragItem.current = instance.instanceId;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragOver.current = instance.instanceId;
  };

  const handleDragEnd = () => {
    if (dragItem.current && dragOver.current && dragItem.current !== dragOver.current) {
      onReorder(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOver.current = null;
  };

  const cycleSpan = () => {
    const idx = SPANS.indexOf(instance.span);
    const next = SPANS[(idx + 1) % SPANS.length];
    onResize(instance.instanceId, next);
  };

  if (!def || !WidgetComponent) {
    return (
      <div className="widget" style={{ gridColumn: `span ${instance.span}` }}>
        <div className="widget-body">
          <span className="loading">Unknown widget: {instance.typeId}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="widget"
      style={{ gridColumn: `span ${instance.span}` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onMouseEnter={() => setShowResize(true)}
      onMouseLeave={() => setShowResize(false)}
    >
      <div className="widget-toolbar">
        <span className="widget-toolbar-drag" title="Drag to reorder">
          &#9776;
        </span>
        <span className="widget-title">{def.label}</span>
        <div className="widget-toolbar-actions">
          {showResize && (
            <button className="widget-toolbar-btn" onClick={cycleSpan} title={`Resize (span ${instance.span})`}>
              ↔ {instance.span}
            </button>
          )}
          <button
            className="widget-toolbar-btn widget-toolbar-remove"
            onClick={() => onRemove(instance.instanceId)}
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="widget-body">
        <WidgetComponent />
      </div>
    </div>
  );
}
