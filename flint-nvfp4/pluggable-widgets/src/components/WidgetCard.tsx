import type { DragEvent } from "react";
import type { WidgetDefinition } from "../widgets/types";

export interface WidgetCardProps {
  definition: WidgetDefinition;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onRemove: (id: string) => void;
}

export function WidgetCard({
  definition,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onRemove,
}: WidgetCardProps) {
  const Body = definition.component;

  return (
    <div
      className={`widget${dragging ? " is-dragging" : ""}${dropTarget ? " is-drop-target" : ""}`}
      style={{ gridColumn: `span ${definition.defaultCols}` }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className="widget-header"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <span className="widget-title">{definition.title}</span>
        {definition.subtitle != null ? (
          <span className="widget-subtitle">{definition.subtitle}</span>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            className="widget-remove"
            aria-label={`Remove ${definition.title} widget`}
            onClick={() => onRemove(definition.id)}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="widget-body">
        <Body />
      </div>
    </div>
  );
}
