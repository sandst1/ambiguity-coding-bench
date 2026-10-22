import type { ComponentType, ReactNode } from "react";

export interface WidgetInstance {
  uid: string;
  type: string;
}

export interface WidgetProps {
  actions?: ReactNode;
}

export interface WidgetDefinition {
  type: string;
  title: string;
  subtitle?: string;
  span: number;
  component: ComponentType<WidgetProps>;
}
