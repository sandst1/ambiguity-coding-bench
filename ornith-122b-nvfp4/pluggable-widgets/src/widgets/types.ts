import type { ComponentType } from "react";

export interface WidgetDescriptor {
  /** stable id used in the persisted layout, e.g. "latency" */
  type: string;
  /** title shown in the widget header and the add-widget palette */
  label: string;
  /** default 12-column grid span (1..12) */
  cols: number;
  /** optional subtitle shown under the title */
  subtitle?: string;
  /** the widget's body component (renders its own loading + data states) */
  component: ComponentType;
}

export interface WidgetInstance {
  /** unique per placed widget */
  id: string;
  /** references a WidgetDescriptor.type */
  type: string;
  /** optional per-instance override of the descriptor's cols */
  cols?: number;
}
