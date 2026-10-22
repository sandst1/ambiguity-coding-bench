import type { DragEvent } from "react";
import { getWidgetDefinition } from "../widgets/registry";
import type { WidgetInstance } from "../widgets/types";

interface WidgetRendererProps {
  instance: WidgetInstance;
  dragging: boolean;
  dropTarget: { uid: string; before: boolean } | null;
  onDragStart: (uid: string) => void;
  onDragEnd: () => void;
  onDragOver: (uid: string, before: boolean) => void;
  onDrop: (uid: string, before: boolean) => void;
  onRemove: (uid: string) => void;
}

export function WidgetRenderer({
  instance,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onRemove,
}: WidgetRendererProps) {
  const definition = getWidgetDefinition(instance.type);
  const Widget = definition.component;

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    onDragOver(instance.uid, before);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    onDrop(instance.uid, before);
  }

  const className =
    dropTarget?.uid === instance.uid
      ? dropTarget.before
        ? "widget-wrapper widget-wrapper--drop-before"
        : "widget-wrapper widget-wrapper--drop-after"
      : "widget-wrapper";

  return (
    <div
      className={className}
      style={{ gridColumn: `span ${definition.span}` }}
      draggable={dragging}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", instance.uid);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(instance.uid);
      }}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Widget
        actions={
          <button
            type="button"
            className="widget-remove"
            title="Remove widget"
            onClick={() => onRemove(instance.uid)}
          >
            ×
          </button>
        }
      />
    </div>
  );
}
