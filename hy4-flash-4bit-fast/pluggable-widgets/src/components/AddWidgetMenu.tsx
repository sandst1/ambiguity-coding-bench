import { useEffect, useRef, useState } from "react";
import type { WidgetDefinition } from "./widgets/registry";

interface AddWidgetMenuProps {
  widgets: WidgetDefinition[];
  onAdd: (type: string) => void;
}

export function AddWidgetMenu({ widgets, onAdd }: AddWidgetMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="add-widget" ref={rootRef}>
      <button
        type="button"
        className="btn"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        + Add widget
      </button>
      {open && (
        <div className="add-widget-menu" role="menu" aria-label="Available widgets">
          <div className="add-widget-menu-title">Available widgets</div>
          {widgets.map((widget) => (
            <button
              key={widget.type}
              type="button"
              role="menuitem"
              className="add-widget-option"
              onClick={() => {
                onAdd(widget.type);
                setOpen(false);
              }}
            >
              <span className="add-widget-name">{widget.title}</span>
              <span className="add-widget-desc">{widget.description}</span>
            </button>
          ))}
          {widgets.length === 0 && (
            <div className="add-widget-empty">No widget types registered.</div>
          )}
        </div>
      )}
    </div>
  );
}
