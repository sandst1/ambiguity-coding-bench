import type { ReactNode } from "react";
import type { WidgetDescriptor, WidgetInstance } from "./types";

export function WidgetShell({
  descriptor,
  instance,
  editing,
  isFirst,
  isLast,
  onRemove,
  onMove,
  children,
}: {
  descriptor: WidgetDescriptor;
  instance: WidgetInstance;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  children: ReactNode;
}) {
  const cols = instance.cols ?? descriptor.cols;

  return (
    <div className="widget" style={{ gridColumn: `span ${cols}` }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <span className="widget-title">{descriptor.label}</span>
          {descriptor.subtitle ? (
            <span className="widget-subtitle">{descriptor.subtitle}</span>
          ) : null}
        </div>
        {editing ? (
          <div className="widget-controls">
            <button
              type="button"
              className="widget-btn"
              onClick={() => onMove(-1)}
              disabled={isFirst}
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              className="widget-btn"
              onClick={() => onMove(1)}
              disabled={isLast}
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className="widget-btn widget-btn--danger"
              onClick={onRemove}
              title="Remove widget"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>
      <div className="widget-body">{children}</div>
    </div>
  );
}
