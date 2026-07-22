import type { ReactNode } from "react";

export interface WidgetDefinition<TData = unknown> {
  id: string;
  name: string;
  description?: string;
  defaultWidth: number;
  icon?: ReactNode;
  render: (props: { data: TData | null; error: Error | null }) => ReactNode;
  fetch: () => Promise<TData>;
  intervalMs?: number;
}

type AnyWidget = WidgetDefinition<unknown>;

const widgets = new Map<string, AnyWidget>();

export function registerWidget(widget: AnyWidget): void {
  if (widgets.has(widget.id)) {
    throw new Error(`Widget "${widget.id}" is already registered`);
  }
  widgets.set(widget.id, widget);
}

export function getWidget(id: string): AnyWidget | undefined {
  return widgets.get(id);
}

export function getAllWidgets(): AnyWidget[] {
  return Array.from(widgets.values());
}

export function isWidgetRegistered(id: string): boolean {
  return widgets.has(id);
}
