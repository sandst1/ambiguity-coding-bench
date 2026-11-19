import { useCallback, useEffect, useState } from "react";
import { getWidget, listWidgets } from "../components/widgets/registry";

export interface WidgetInstance {
  id: string;
  type: string;
  span: number;
}

const STORAGE_KEY = "ops-dashboard-layout";

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultLayout(): WidgetInstance[] {
  return listWidgets().map((widget) => ({
    id: makeId(),
    type: widget.type,
    span: widget.span,
  }));
}

/** Ignore stale entries for unregistered types and keep stored spans sane. */
function loadLayout(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return defaultLayout();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultLayout();

    const seen = new Set<string>();
    const layout: WidgetInstance[] = [];
    for (const item of parsed) {
      if (item == null || typeof item !== "object") continue;
      const { id, type, span } = item as Record<string, unknown>;
      if (typeof type !== "string" || getWidget(type) == null) continue;
      if (typeof id !== "string" || id.length === 0 || seen.has(id)) continue;
      seen.add(id);

      const definition = getWidget(type)!;
      layout.push({
        id,
        type,
        span: typeof span === "number" && span >= 1 && span <= 12 ? span : definition.span,
      });
    }
    return layout;
  } catch {
    return defaultLayout();
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetInstance[]>(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Storage may be unavailable (private mode / quota); keep the in-memory layout.
    }
  }, [layout]);

  const addWidget = useCallback((type: string) => {
    const definition = getWidget(type);
    if (definition == null) return;
    setLayout((current) => [
      ...current,
      { id: makeId(), type, span: definition.span },
    ]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout((current) => current.filter((widget) => widget.id !== id));
  }, []);

  const moveWidget = useCallback((id: string, direction: -1 | 1) => {
    setLayout((current) => {
      const from = current.findIndex((widget) => widget.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const moveWidgetTo = useCallback((id: string, targetId: string) => {
    setLayout((current) => {
      const from = current.findIndex((widget) => widget.id === id);
      const to = current.findIndex((widget) => widget.id === targetId);
      if (from < 0 || to < 0 || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => setLayout(defaultLayout()), []);

  return { layout, addWidget, removeWidget, moveWidget, moveWidgetTo, resetLayout };
}
