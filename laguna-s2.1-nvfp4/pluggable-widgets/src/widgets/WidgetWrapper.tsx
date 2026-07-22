import { useDashboard } from "./dashboard-context";
import type { WidgetDefinition } from "./registry";

interface WidgetWrapperProps {
  widget: WidgetDefinition<unknown>;
  data: unknown;
  error: Error | null;
}

export function WidgetWrapper({ widget, data, error }: WidgetWrapperProps) {
  const { isEditing, removeItem } = useDashboard();

  return (
    <>
      <div className="widget-header">
        <div>
          <span className="widget-title">{widget.name}</span>
          {widget.description && (
            <span className="widget-subtitle">{widget.description}</span>
          )}
        </div>
        {isEditing && (
          <button
            className="widget-remove"
            onClick={() => removeItem(widget.id)}
            title={`Remove ${widget.name}`}
            aria-label={`Remove ${widget.name}`}
          >
            ×
          </button>
        )}
      </div>
      <div className="widget-body">
        {error ? (
          <span className="loading">Error: {error.message}</span>
        ) : data == null ? (
          <span className="loading">Loading…</span>
        ) : (
          widget.render({ data, error })
        )}
      </div>
    </>
  );
}
