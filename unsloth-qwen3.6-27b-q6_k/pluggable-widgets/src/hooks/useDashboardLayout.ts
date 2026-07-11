import { useState, useCallback, useEffect } from "react";
import type { WidgetInstance, GridSpan } from "../types";
import { createInstanceId } from "../types";
import { getWidgetDef } from "../registry";

const STORAGE_KEY = "dashboard-layout-v1";

function loadLayout(): WidgetInstance[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetInstance[];
  } catch {
    return null;
  }
}

function saveLayout(layout: WidgetInstance[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

export function useDashboardLayout(defaultLayout: WidgetInstance[]) {
  const [layout, setLayout] = useState<WidgetInstance[]>(() => loadLayout() ?? defaultLayout);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const addWidget = useCallback((typeId: string) => {
    const def = getWidgetDef(typeId);
    if (!def) return;
    setLayout((prev) => [
      ...prev,
      {
        instanceId: createInstanceId(),
        typeId,
        span: def.defaultSpan,
      },
    ]);
  }, []);

  const removeWidget = useCallback((instanceId: string) => {
    setLayout((prev) => prev.filter((w) => w.instanceId !== instanceId));
  }, []);

  const reorderWidget = useCallback((draggedId: string, overId: string) => {
    setLayout((prev) => {
      const draggedIdx = prev.findIndex((w) => w.instanceId === draggedId);
      const overIdx = prev.findIndex((w) => w.instanceId === overId);
      if (draggedIdx === -1 || overIdx === -1 || draggedIdx === overIdx) return prev;
      const next = [...prev];
      const [removed] = next.splice(draggedIdx, 1);
      next.splice(overIdx, 0, removed);
      return next;
    });
  }, []);

  const resizeWidget = useCallback((instanceId: string, span: GridSpan) => {
    setLayout((prev) =>
      prev.map((w) => (w.instanceId === instanceId ? { ...w, span } : w))
    );
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(defaultLayout);
  }, [defaultLayout]);

  return { layout, addWidget, removeWidget, reorderWidget, resizeWidget, resetLayout };
}
