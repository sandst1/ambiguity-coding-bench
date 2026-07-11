import { useState, useRef, type DragEvent } from "react";
import { getAllWidgets, getWidget } from "../lib/registry";
import {
  loadLayout,
  saveLayout,
  createReorderLayout,
  createToggleLayout,
  createResizeLayout,
  type DashboardLayout,
  type WidgetLayoutItem,
} from "../lib/layout-store";

export function DashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(() => loadLayout());
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  const commit = (fn: (prev: DashboardLayout) => DashboardLayout) => {
    setLayout((prev) => {
      const next = fn(prev);
      saveLayout(next);
      return next;
    });
  };

  const handleDragStart = (e: DragEvent, idx: number) => {
    dragIdxRef.current = idx;
    setDropIdx(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const from = dragIdxRef.current;
    if (from !== null && from !== idx) {
      setDropIdx(idx);
    }
  };

  const handleDrop = (e: DragEvent, targetIdx: number) => {
    e.preventDefault();
    const from = dragIdxRef.current;
    if (from !== null && from !== targetIdx) {
      commit((prev) => createReorderLayout(prev, from, targetIdx));
    }
    dragIdxRef.current = null;
    setDropIdx(null);
  };

  const handleDragEnd = () => {
    dragIdxRef.current = null;
    setDropIdx(null);
  };

  const handleRemove = (id: string) => {
    commit((prev) => createToggleLayout(prev, id));
  };

  const handleResize = (id: string, span: number) => {
    commit((prev) => createResizeLayout(prev, id, span));
  };

  const allWidgets = getAllWidgets();
  const dragIdx = dragIdxRef.current;

  return (
    <>
      <div className="dashboard-grid" onDragOver={(e) => e.preventDefault()}>
        {layout.map((item, idx) => {
          const meta = getWidget(item.id);
          if (!meta) return null;
          const Component = meta.component;
          const isDragging = dragIdx === idx;
          const isDropTarget = dropIdx === idx;

          return (
            <DraggableWidget
              key={item.id}
              idx={idx}
              id={item.id}
              name={meta.name}
              span={item.span}
              isDragging={isDragging}
              isDropTarget={isDropTarget}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onRemove={handleRemove}
              onResize={handleResize}
            >
              <Component />
            </DraggableWidget>
          );
        })}
      </div>

      <WidgetStore
        layout={layout}
        allWidgets={allWidgets}
        onToggle={handleRemove}
      />
    </>
  );
}

interface DraggableWidgetProps {
  idx: number;
  id: string;
  name: string;
  span: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: DragEvent, idx: number) => void;
  onDragOver: (e: DragEvent, idx: number) => void;
  onDrop: (e: DragEvent, idx: number) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
  onResize: (id: string, span: number) => void;
  children: React.ReactNode;
}

function DraggableWidget({
  idx,
  id,
  name,
  span,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onResize,
  children,
}: DraggableWidgetProps) {
  return (
    <div
      className={`widget-wrapper span-${span} ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      onDragEnd={onDragEnd}
    >
      <div className="widget-handle-bar">
        <span className="widget-drag-icon" title="Drag to reorder">⠿</span>
        <span className="widget-handle-name">{name}</span>
        <div className="widget-controls">
          <div className="widget-span-control">
            <button
              type="button"
              className="span-btn"
              title="Shrink"
              onClick={() => onResize(id, span - 1)}
              disabled={span <= 1}
            >
              −
            </button>
            <span className="span-label">{span}</span>
            <button
              type="button"
              className="span-btn"
              title="Widen"
              onClick={() => onResize(id, span + 1)}
              disabled={span >= 12}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="widget-remove-btn"
            title="Remove widget"
            onClick={() => onRemove(id)}
          >
            ×
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

interface WidgetStoreProps {
  layout: WidgetLayoutItem[];
  allWidgets: ReturnType<typeof getAllWidgets>;
  onToggle: (id: string) => void;
}

function WidgetStore({ layout, allWidgets, onToggle }: WidgetStoreProps) {
  const visibleIds = new Set(layout.map((item) => item.id));
  const hiddenWidgets = allWidgets.filter((w) => !visibleIds.has(w.id));

  if (hiddenWidgets.length === 0) return null;

  return (
    <details className="widget-store">
      <summary className="widget-store-summary">
        Add Widgets{" "}
        <span className="widget-store-count">({hiddenWidgets.length})</span>
      </summary>
      <div className="widget-store-grid">
        {hiddenWidgets.map((w) => (
          <button
            key={w.id}
            type="button"
            className="widget-store-card"
            onClick={() => onToggle(w.id)}
          >
            <span className="widget-store-card-name">{w.name}</span>
            <span className="widget-store-card-desc">{w.description}</span>
            <span className="widget-store-add">+</span>
          </button>
        ))}
      </div>
    </details>
  );
}