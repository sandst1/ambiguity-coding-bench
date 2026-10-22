import { useState } from "react";
import { getWidgetDefinition, listWidgetIds } from "../widgets/registry";

interface AddWidgetMenuProps {
  currentLayout: string[];
  onAdd: (id: string) => void;
}

export function AddWidgetMenu({ currentLayout, onAdd }: AddWidgetMenuProps) {
  const [open, setOpen] = useState(false);
  const availableWidgetIds = listWidgetIds().filter((id) => !currentLayout.includes(id));

  return (
    <div className="add-menu">
      <button
        type="button"
        className="add-menu-button"
        onClick={() => setOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ＋ Add widget
      </button>
      {open ? (
        <>
          <div className="menu-overlay" onClick={() => setOpen(false)} />
          <div className="menu" role="menu">
            <div className="menu-heading">Add widget</div>
            {availableWidgetIds.length === 0 ? (
              <div className="menu-empty">Every widget is already on the dashboard.</div>
            ) : (
              availableWidgetIds.map((id) => {
                const definition = getWidgetDefinition(id);
                if (!definition) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      onAdd(id);
                      setOpen(false);
                    }}
                  >
                    <span className="menu-item-title">{definition.title}</span>
                    {definition.subtitle != null ? (
                      <span className="menu-item-subtitle">{definition.subtitle}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
