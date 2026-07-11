import { ComponentType } from "react";

export type GridSpan = 3 | 5 | 6 | 7 | 9 | 12;

export interface WidgetDefinition {
  /** Unique identifier for the widget type */
  id: string;
  /** Display name shown in picker and widget header */
  label: string;
  /** Default grid column span (12-column grid) */
  defaultSpan: GridSpan;
  /** React component rendering the widget body */
  component: ComponentType;
}

export interface WidgetInstance {
  /** Unique instance id (same widget type can appear multiple times) */
  instanceId: string;
  /** Reference to the widget type definition */
  typeId: string;
  /** Grid column span, can be overridden per-instance */
  span: GridSpan;
}

export function createInstanceId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
