import { useState } from "react";
import { useDashboard } from "./DashboardProvider";
import { WidgetConfig } from "../widgets/WidgetConfig";
import "./EditPanel.css";

export function EditPanel() {
  const { state, toggleEditMode, addWidget, removeWidget, moveWidget, setWidgetWidth } = useDashboard();
  const allWidgets = WidgetConfig.getAll();

  const [newWidgetId, setNewWidgetId] = useState<string>("");

  const handleAdd = () => {
    if (newWidgetId) {
      addWidget(newWidgetId, allWidgets.find(w => w.id === newWidgetId)?.width);
      // Don't clear selection so user can add multiple of same type
    }
  };

  const handleRemove = (id: string) => {
    removeWidget(id);
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = state.widgets.findIndex(w => w.id === id);
    if (direction === "up" && index > 0) {
      moveWidget(index, index - 1);
    } else if (direction === "down" && index < state.widgets.length - 1) {
      moveWidget(index, index + 1);
    }
  };

  const handleWidthChange = (id: string, width: "normal" | "wide" | "tall") => {
    setWidgetWidth(id, width);
  };

  return (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <h2>Edit Dashboard</h2>
        <button className="btn btn-secondary" onClick={toggleEditMode}>
          Done Editing
        </button>
      </div>

      <div className="edit-section">
        <h3>Add Widgets</h3>
        <div className="widget-selector">
          <select
            value={newWidgetId}
            onChange={e => setNewWidgetId(e.target.value)}
          >
            <option value="">-- Select a widget --</option>
            {allWidgets.map(widget => (
              <option key={widget.id} value={widget.id}>
                {widget.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!newWidgetId}>
            Add Widget
          </button>
        </div>
      </div>

      <div className="edit-section">
        <h3>Current Widgets</h3>
        {state.widgets.length === 0 ? (
          <p className="empty-text">No widgets added yet.</p>
        ) : (
          <div className="widget-list">
            {state.widgets.map((widgetInstance, index) => {
              const widgetDef = WidgetConfig.get(widgetInstance.id)!;
              return (
                <div key={widgetInstance.id} className="widget-list-item">
                  <div className="widget-list-info">
                    <strong>{widgetDef.name}</strong>
                    {widgetDef.description && <span className="widget-desc">{widgetDef.description}</span>}
                  </div>
                  <div className="widget-list-actions">
                    <button
                      className="btn btn-icon"
                      onClick={() => handleMove(widgetInstance.id, "up")}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => handleMove(widgetInstance.id, "down")}
                      disabled={index === state.widgets.length - 1}
                      title="Move down"
                    >
                      ▼
                    </button>
                    <select
                      value={widgetInstance.width || "normal"}
                      onChange={e => handleWidthChange(widgetInstance.id, e.target.value as any)}
                      className="width-select"
                      title="Set width"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="tall">Tall</option>
                    </select>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRemove(widgetInstance.id)}
                      title="Remove widget"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}