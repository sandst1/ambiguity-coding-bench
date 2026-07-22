import { useDashboard } from "./dashboard-context";
import { WidgetPalette } from "./WidgetPalette";

export function AppHeader() {
  const { isEditing, toggleEditing } = useDashboard();

  return (
    <>
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <span className="meta">env: production</span>
        <button
          className={`edit-button ${isEditing ? "editing" : ""}`}
          onClick={toggleEditing}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </header>
      {isEditing && <WidgetPalette />}
    </>
  );
}
