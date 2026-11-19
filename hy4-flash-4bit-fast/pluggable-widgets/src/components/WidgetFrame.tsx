import type { DragEvent } from "react";
import type { WidgetDefinition } from "./widgets/registry";
import type { WidgetInstance } from "../hooks/useDashboardLayout";

export interface DragState {
  id: string;
  overId: string | null;
}

interface WidgetFrameProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  drag: DragState | null;
  onDragStart: (id: string) => void;
  onDragOver: (id: string | null) => void;
  onDrop: (draggedId: string, targetId: string) => void;
  onDragEnd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}

export function WidgetFrame({
  instance,
  definition,
  drag,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMove,
  onRemove,
}: WidgetFrameProps) {
  const Body = definition.Component;
  const isDragging = drag?.id === instance.id;
  const isDropTarget = drag?.overId === instance.id && !isDragging;

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOver(instance.id);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onDragOver(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") || drag?.id;
    if (draggedId) onDrop(draggedId, instance.id);
    onDragEnd();
  }

  return (
    <section
      className={`widget widget-frame${isDragging ? " is-dragging" : ""}${isDropTarget ? " is-drop-target" : ""}`}
      style={{ gridColumn: `span ${instance.span}` }}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="widget-header">
        <div className="widget-heading">
          <span className="widget-title">{definition.title}</span>
          {definition.subtitle && <span className="widget-subtitle">{definition.subtitle}</span>}
        </div>
        <div className="widget-controls">
          <button
            type="button"
            className="widget-control widget-control--drag"
            draggable
            title="Drag to reorder"
            aria-label={`Drag ${definition.title} to reorder`}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", instance.id);
              event.dataTransfer.effectAllowed = "move";
              onDragStart(instance.id);
            }}
            onDragEnd={onDragEnd}
          >
            ⠿
          </button>
          <button
            type="button"
            className="widget-control"
            title="Move earlier"
            aria-label={`Move ${definition.title} earlier`}
            onClick={() => onMove(instance.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="widget-control"
            title="Move later"
            aria-label={`Move ${definition.title} later`}
            onClick={() => onMove(instance.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="widget-control widget-control--remove"
            title="Remove widget"
            aria-label={`Remove ${definition.title}`}
            onClick={() => onRemove(instance.id)}
          >
            ×
          </button>
        </div>
      </div>
      <div className="widget-body">
        <Body />
      </div>
    </section>
  );
}
