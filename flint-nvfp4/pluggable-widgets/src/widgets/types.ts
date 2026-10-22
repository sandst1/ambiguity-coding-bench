import type { ComponentType, ReactNode } from "react";

export type WidgetId = string;

export interface WidgetDefinition {
  /** Stable identifier used as the key in the dashboard layout, e.g. "stats". */
  id: string;
  /** Title shown in the widget header. */
  title: string;
  /** Optional helper text shown next to the title. */
  subtitle?: ReactNode;
  /** Width of the widget in the 12-column grid, from 1 to 12. */
  defaultCols: number;
  /** The widget UI. A new widget type only needs this plus a registry entry. */
  component: ComponentType;
}
