import { getAllWidgets } from "./registry";

export interface WidgetLayoutItem {
  id: string;
  span: number;
}

export type DashboardLayout = WidgetLayoutItem[];

const STORAGE_KEY = "dashboard-layout-v1";
const MIN_SPAN = 1;
const MAX_SPAN = 12;

function clampSpan(span: number): number {
  return Math.max(MIN_SPAN, Math.min(MAX_SPAN, span));
}

function buildDefault(): DashboardLayout {
  return getAllWidgets()
    .map((w) => ({ id: w.id, span: clampSpan(w.defaultSpan) }))
    .slice();
}

export function loadLayout(): DashboardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefault();

const parsed: Partial<WidgetLayoutItem>[] = JSON.parse(raw);
    const widgets = getAllWidgets();
    const widgetIds = new Set(widgets.map((w) => w.id));

    const restored: DashboardLayout = [];
    for (const item of parsed) {
      const id = item.id!;
      if (widgetIds.has(id)) {
        restored.push({ id, span: clampSpan(item.span ?? 0) });
      }
    }
    for (const w of widgets) {
      if (!widgetIds.has(w.id)) {
        restored.push({ id: w.id, span: clampSpan(w.defaultSpan) });
      }
    }
    return restored.length === 0 ? buildDefault() : restored;
  } catch {
    return buildDefault();
  }
}

export function saveLayout(layout: DashboardLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage full or not available — silent fail
  }
}

export function createReorderLayout(
  layout: DashboardLayout,
  fromIdx: number,
  toIdx: number
): DashboardLayout {
  const next = layout.slice();
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

export function createToggleLayout(
  layout: DashboardLayout,
  id: string
): DashboardLayout {
  const exists = layout.find((i) => i.id === id);
  if (exists) {
    return layout.filter((i) => i.id !== id);
  }
  const widget = getAllWidgets().find((w) => w.id === id);
  if (!widget) return layout;
  return [...layout, { id, span: clampSpan(widget.defaultSpan) }];
}

export function createResizeLayout(
  layout: DashboardLayout,
  id: string,
  span: number
): DashboardLayout {
  return layout.map((item) =>
    item.id === id ? { ...item, span: clampSpan(span) } : item
  );
}