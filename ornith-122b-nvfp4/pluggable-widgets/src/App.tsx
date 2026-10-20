import { useState } from "react";
import { getWidget } from "./widgets/registry";
import { useDashboard } from "./widgets/useDashboard";
import { WidgetShell } from "./widgets/WidgetShell";
import { AddPalette } from "./widgets/AddPalette";

export function App() {
  const { instances, add, remove, move } = useDashboard();
  const [editing, setEditing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <div className="header-actions">
          <span className="meta">env: production</span>
          {editing ? (
            <button
              type="button"
              className="btn"
              onClick={() => setShowPalette((s) => !s)}
            >
              {showPalette ? "Hide palette" : "Add widget"}
            </button>
          ) : null}
          <button type="button" className="btn" onClick={() => setEditing((e) => !e)}>
            {editing ? "Done" : "Customize"}
          </button>
        </div>
      </header>

      {editing && showPalette ? (
        <AddPalette onAdd={add} onClose={() => setShowPalette(false)} />
      ) : null}

      {instances.length === 0 ? (
        <p className="empty">
          No widgets yet. Click <strong>Customize</strong> to add one.
        </p>
      ) : null}

      <div className={`dashboard-grid${editing ? " is-editing" : ""}`}>
        {instances.map((inst, i) => {
          const descriptor = getWidget(inst.type);
          if (!descriptor) return null;
          const Body = descriptor.component;
          return (
            <WidgetShell
              key={inst.id}
              descriptor={descriptor}
              instance={inst}
              editing={editing}
              isFirst={i === 0}
              isLast={i === instances.length - 1}
              onRemove={() => remove(inst.id)}
              onMove={(dir) => move(inst.id, dir)}
            >
              <Body />
            </WidgetShell>
          );
        })}
      </div>
    </div>
  );
}
