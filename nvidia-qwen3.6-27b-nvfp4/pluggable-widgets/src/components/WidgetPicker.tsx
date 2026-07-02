import { useState } from "react";
import { getAvailableWidgets } from "../registry";

interface Props {
  onAdd: (type: string) => void;
  currentTypes: string[];
}

export function WidgetPicker({ onAdd, currentTypes }: Props) {
  const [open, setOpen] = useState(false);

  const available = getAvailableWidgets().filter((w) => !currentTypes.includes(w.type));

  if (!open) {
    return (
      <button className="header-btn header-btn--primary" onClick={() => setOpen(true)}>
        + Add widget
      </button>
    );
  }

  return (
    <div className="widget-picker">
      <div className="widget-picker-backdrop" onClick={() => setOpen(false)} />
      <div className="widget-picker-panel">
        <div className="widget-picker-head">
          <span className="widget-picker-title">Add a widget</span>
          <button className="widget-picker-close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="widget-picker-list">
          {available.map((w) => (
            <button
              key={w.type}
              className="widget-picker-item"
              onClick={() => {
                onAdd(w.type);
                setOpen(false);
              }}
            >
              <span className="widget-picker-item-name">{w.title}</span>
              <span className="widget-picker-item-desc">{w.description}</span>
            </button>
          ))}
          {available.length === 0 && (
            <div className="widget-picker-empty">All widgets already on dashboard</div>
          )}
        </div>
      </div>
    </div>
  );
}