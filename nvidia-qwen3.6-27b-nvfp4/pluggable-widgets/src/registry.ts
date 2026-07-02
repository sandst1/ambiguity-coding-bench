export interface WidgetType {
  type: string;
  title: string;
  description: string;
  gridSpan: number; // columns in a 12-col grid
  component: React.ComponentType;
}

const registry = new Map<string, WidgetType>();

export function registerWidget(w: WidgetType): void {
  registry.set(w.type, w);
}

export function getWidgetType(type: string): WidgetType | undefined {
  return registry.get(type);
}

export function getAvailableWidgets(): ReadonlyArray<WidgetType> {
  return Array.from(registry.values());
}