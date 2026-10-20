import { listWidgets } from "./registry";

export function AddPalette({
  onAdd,
  onClose,
}: {
  onAdd: (type: string) => void;
  onClose: () => void;
}) {
  const widgets = listWidgets();

  return (
    <div className="palette" role="list" aria-label="Available widgets">
      {widgets.map((w) => (
        <button
          key={w.type}
          type="button"
          role="listitem"
          className="palette-item"
          onClick={() => {
            onAdd(w.type);
            onClose();
          }}
        >
          <span className="palette-label">{w.label}</span>
          <span className="palette-cols">
            {w.cols} col{w.cols === 1 ? "" : "s"}
          </span>
        </button>
      ))}
    </div>
  );
}
