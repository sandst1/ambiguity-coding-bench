import { useDashboard } from "./dashboard-context";
import { getAllWidgets } from "./registry";

export function WidgetPalette() {
  const { addItem, items } = useDashboard();
  const allWidgets = getAllWidgets();
  const addedIds = new Set(items.map((i) => i.widgetId));

  return (
    <div className="widget-palette">
      <span className="widget-palette-title">Add widget</span>
      <div className="widget-palette-list">
        {allWidgets.map((w) => {
          const isAdded = addedIds.has(w.id);
          return (
            <button
              key={w.id}
              className="widget-palette-item"
              disabled={isAdded}
              onClick={() => addItem(w.id)}
            >
              <span className="widget-palette-name">{w.name}</span>
              {w.description && (
                <span className="widget-palette-desc">{w.description}</span>
              )}
              {isAdded && <span className="widget-palette-added">added</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
