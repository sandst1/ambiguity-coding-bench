import { useCallback, useEffect, useState } from "react";
import type { WidgetId } from "../widgets/types";
import { listWidgetIds } from "../widgets/registry";

const STORAGE_KEY = "ops-dashboard:layout";

const DEFAULT_LAYOUT: WidgetId[] = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];

const KNOWN_WIDGET_IDS = new Set(listWidgetIds());

function isKnownWidgetId(id: string): id is WidgetId {
  return KNOWN_WIDGET_IDS.has(id);
}

function loadLayout(): WidgetId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    const valid = parsed.filter(
      (w): w is string => typeof w === "string" && isKnownWidgetId(w),
    );
    return valid.length > 0 ? valid : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetId[]>(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // storage unavailable (private mode, etc.) — keep the in-memory layout
    }
  }, [layout]);

  const addWidget = useCallback((id: WidgetId) => {
    setLayout((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const removeWidget = useCallback((id: WidgetId) => {
    setLayout((current) => current.filter((w) => w !== id));
  }, []);

  const moveWidget = useCallback((from: number, to: number) => {
    setLayout((current) => {
      if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(from < to ? to - 1 : to, 0, moved);
      return next;
    });
  }, []);

  return { layout, addWidget, removeWidget, moveWidget };
}
