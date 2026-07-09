import React from "react";

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  render: () => React.ReactNode;
  width?: "normal" | "wide" | "tall";
  cssClass?: string; // Optional CSS class for widget-specific styling
}