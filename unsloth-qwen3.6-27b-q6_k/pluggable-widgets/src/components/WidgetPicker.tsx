import { useState, useRef, useEffect } from "react";
import { getAllWidgets } from "../registry";

export function WidgetPicker({ onAdd }: { onAdd: (typeId: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const available = getAllWidgets();

  return (
    <div className="widget-picker" ref={ref}>
      <button className="widget-picker-toggle" onClick={() => setOpen(!open)}>
        + Widget
      </button>
      {open && (
        <div className="widget-picker-dropdown">
          {available.length === 0 ? (
            <div className="widget-picker-empty">No widgets available</div>
          ) : (
            available.map((def) => (
              <button
                key={def.id}
                className="widget-picker-item"
                onClick={() => {
                  onAdd(def.id);
                  setOpen(false);
                }}
              >
                <span className="widget-picker-item-label">{def.label}</span>
                <span className="widget-picker-item-meta">span {def.defaultSpan}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
