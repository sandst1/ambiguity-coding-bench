import React from "react";
import { useDashboard } from "./DashboardProvider";
import { WidgetConfig } from "../widgets/WidgetConfig";
import "./Dashboard.css";

export function Dashboard() {
  const { state, setEditMode } = useDashboard();

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {state.widgets.length === 0 ? (
          <div className="empty-state">
            <p>No widgets added yet.</p>
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>
              Add widgets
            </button>
          </div>
        ) : (
          state.widgets.map((widgetInstance) => {
            const widgetDef = WidgetConfig.get(widgetInstance.id);
            if (!widgetDef) {
              return null;
            }

            const { width = "normal" } = widgetInstance;
            const widgetClass = `widget ${width === "wide" ? "widget--wide" : ""} ${
              width === "tall" ? "widget--tall" : ""
            }`;

            return (
              <div key={widgetInstance.id} className={`${widgetClass} ${widgetDef.cssClass || ""}`}>
                {React.createElement(widgetDef.render)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}