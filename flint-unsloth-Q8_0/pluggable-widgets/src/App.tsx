import { useEffect, useMemo, useState } from "react";
import { WIDGET_TYPE_IDS, getWidgetDefinition } from "./widgets/registry";
import type { WidgetInstance } from "./widgets/types";
import { WidgetRenderer } from "./components/WidgetRenderer";

const STORAGE_KEY = "ops-dashboard-layout";

const DEFAULT_INSTANCES: WidgetInstance[] = [
  { uid: "stats", type: "stats" },
  { uid: "latency", type: "latency" },
  { uid: "errors", type: "errors" },
  { uid: "activity", type: "activity" },
  { uid: "services", type: "services" },
];

function isWidgetInstance(value: unknown): value is WidgetInstance {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.uid === "string" && typeof candidate.type === "string";
}

function loadInstances(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isWidgetInstance);
        if (valid.length === parsed.length) {
          return valid;
        }
      }
    }
  } catch {
    // fall back to defaults
  }
  return DEFAULT_INSTANCES;
}

export function App() {
  const [instances, setInstances] = useState<WidgetInstance[]>(loadInstances);
  const [selectedType, setSelectedType] = useState("");
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ uid: string; before: boolean } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
    } catch {
      // storage unavailable; ignore
    }
  }, [instances]);

  const availableWidgets = useMemo(
    () =>
      WIDGET_TYPE_IDS.map((type) => getWidgetDefinition(type)).filter(
        (definition) => !instances.some((instance) => instance.type === definition.type),
      ),
    [instances],
  );

  function addWidget(type: string) {
    if (instances.some((instance) => instance.type === type)) {
      return;
    }
    setInstances((prev) => [...prev, { uid: crypto.randomUUID(), type }]);
  }

  function removeWidget(uid: string) {
    setInstances((prev) => prev.filter((instance) => instance.uid !== uid));
  }

  function moveWidget(fromUid: string, toUid: string, before: boolean) {
    setInstances((prev) => {
      const fromIndex = prev.findIndex((instance) => instance.uid === fromUid);
      const moved = fromIndex === -1 ? undefined : prev[fromIndex];
      if (moved === undefined) {
        return prev;
      }
      const remaining = prev.filter((instance) => instance.uid !== fromUid);
      const toIndex = remaining.findIndex((instance) => instance.uid === toUid);
      if (toIndex === -1) {
        return prev;
      }
      remaining.splice(before ? toIndex : toIndex + 1, 0, moved);
      return remaining;
    });
  }

  function handleDragStart(uid: string) {
    setDraggingUid(uid);
  }

  function handleDragEnd() {
    setDraggingUid(null);
    setDropTarget(null);
  }

  function handleDragOver(uid: string, before: boolean) {
    setDropTarget((prev) => (prev && prev.uid === uid && prev.before === before ? prev : { uid, before }));
  }

  function handleDropRequest(uid: string, before: boolean) {
    const from = draggingUid;
    setDraggingUid(null);
    setDropTarget(null);
    if (from && from !== uid) {
      moveWidget(from, uid, before);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
      </header>

      <div className="dashboard-toolbar">
        <label htmlFor="add-widget">Add widget</label>
        <select
          id="add-widget"
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
        >
          <option value="">Select a widget…</option>
          {availableWidgets.map((definition) => (
            <option key={definition.type} value={definition.type}>
              {definition.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn"
          disabled={!selectedType}
          onClick={() => {
            if (selectedType) {
              addWidget(selectedType);
            }
          }}
        >
          Add widget
        </button>
      </div>

      {instances.length > 0 ? (
        <div className="dashboard-grid">
          {instances.map((instance) => (
            <WidgetRenderer
              key={instance.uid}
              instance={instance}
              dragging={draggingUid === instance.uid}
              dropTarget={dropTarget}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDropRequest}
              onRemove={removeWidget}
            />
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">No widgets yet — add one from the toolbar above.</div>
      )}
    </div>
  );
}
