# Review: deepseek-4-flash-0713-3bit — Pluggable Widgets

**Final Score: 37 / 40**

---

## Architectural Judgment — 13 / 14

### Widget Contract — 5 / 6

The implementation defines a clear `WidgetDefinition` interface in `registry.ts`:

```12:26:deepseek-4-flash-0713-3bit/pluggable-widgets/src/widgets/registry.ts
export interface WidgetDefinition {
  /** Unique id, e.g. "stats" or "latency". */
  id: string;
  /** Human readable title shown in the card header and the picker. */
  title: string;
  /** Short description shown in the add-widget picker. */
  description: string;
  /** Grid columns this widget occupies by default (1–12). */
  defaultCols: number;
  /** Small hint shown next to the title in the card header. */
  subtitle?: string;
  /** Renders the widget body. */
  component: ComponentType;
}
```

This captures the right shape: id, title, description, grid span, optional subtitle, and render component. The contract is well-documented with JSDoc comments.

**Deduction (-1):** No generic settings support (`settings: TSettings`). Per-widget settings would require extending the interface rather than being built-in. Acceptable for scope, but not the strongest possible design.

### Registration Pattern — 4 / 4

Clean Map-based registry with a single source of truth:

```28:46:deepseek-4-flash-0713-3bit/pluggable-widgets/src/widgets/registry.ts
const registry = new Map<string, WidgetDefinition>();

/** Register a widget type. Throws on duplicate ids to catch mistakes early. */
export function registerWidget(def: WidgetDefinition): void {
  if (registry.has(def.id)) {
    throw new Error(`A widget with id "${def.id}" is already registered.`);
  }
  registry.set(def.id, def);
}

/** Look up a single widget type by id. */
export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

/** All registered widget types, in registration order. */
export function getRegisteredWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}
```

All widget types are registered in one file (`src/widgets/index.ts`). Duplicate detection with clear error message. This is exactly what the rubric asks for.

### Type vs Instance Separation — 4 / 4

Clear and correct separation:

- **`WidgetDefinition`** (registry.ts) = catalog of available widget *types*
- **`WidgetInstance`** (useWidgetLayout.ts) = placed widget with unique `instanceId` and reference to `widgetId`

```4:7:deepseek-4-flash-0713-3bit/pluggable-widgets/src/hooks/useWidgetLayout.ts
export interface WidgetInstance {
  instanceId: string;
  widgetId: string;
}
```

The hook manages instances (add/remove/reorder), the registry manages types. This is the architectural separation the rubric explicitly calls out as a "strong signal."

---

## Ambiguity-Handling — 8 / 10

### Names the User-vs-Developer Fork — 2 / 4

The implementation tackles *both* interpretations of "pluggable":

1. **Developer pluggability:** Registry pattern for adding new widget types
2. **User customization:** Add/remove/reorder widgets with localStorage persistence

However, there's no explicit acknowledgment of this ambiguity in the README or code comments. The README documents how to add widgets (developer side) and mentions user customization, but doesn't call out that "pluggable" has two readings or explain why both were chosen.

**Deduction (-2):** Silent pick. The model implemented both forks competently but didn't demonstrate recognition that this was an architectural choice with trade-offs.

### Picks Scope Appropriately — 3 / 3

Well-scoped for ~30 minutes:

- HTML5 drag-and-drop reordering (no react-grid-layout)
- Add/remove widgets via simple dropdown picker
- localStorage persistence with validation
- No complex settings UI or grid resizing

The implementation is complete and functional without being overambitious.

### Doesn't Over-Engineer — 3 / 3

No unnecessary complexity:

- No zod or JSON-schema validators
- No plugin lifecycle hooks
- No abstract factories or dependency injection
- Simple `sanitize()` function for layout validation instead of a schema library

The code does what's needed and nothing more.

---

## Existing-Code Respect — 8 / 8

### Doesn't Rewrite Working Widgets Gratuitously — 3 / 3

All widgets were consistently refactored to a body-only pattern:

**Original StatsWidget:**
```tsx
return (
  <div className="widget widget--stats">
    <div className="widget-header">
      <span className="widget-title">Summary</span>
      ...
    </div>
    <div className="widget-body">...</div>
  </div>
);
```

**Refactored StatsWidget:**
```13:24:deepseek-4-flash-0713-3bit/pluggable-widgets/src/components/widgets/StatsWidget.tsx
  if (data == null) {
    return <span className="loading">Loading…</span>;
  }

  return (
    <div className="stat-grid">
      <Stat label="req/min" value={data.requestsPerMin.toLocaleString()} delta={data.requestsDelta} />
      // ...
    </div>
  );
```

The chrome (card wrapper, header, title) is now owned by `Dashboard`. This refactor is applied consistently across all five widgets — not haphazardly to some.

### Preserves the Visual Design — 2 / 2

All original CSS variables preserved. The `styles.css` extends (not replaces) the original with new toolbar/picker/drag styles while keeping all existing widget styling intact:

```1:11:deepseek-4-flash-0713-3bit/pluggable-widgets/src/styles.css
:root {
  --bg: #f6f7f9;
  --panel: #ffffff;
  --border: #e3e5ea;
  --text: #1f2328;
  --text-muted: #656d76;
  --accent: #0969da;
  --good: #1a7f37;
  --warn: #bf8700;
  --bad: #cf222e;
}
```

New UI elements (toolbar, picker, drag handles) use the same design language.

### Migrates Layout State Somewhere Reasonable — 3 / 3

Uses `localStorage` with a clear key:

```9:9:deepseek-4-flash-0713-3bit/pluggable-widgets/src/hooks/useWidgetLayout.ts
const STORAGE_KEY = "ops-dashboard:widget-layout";
```

Includes validation via `sanitize()` that drops unknown/invalid widget types — a basic migration story. First-run defaults to showing all registered widgets.

---

## Frontend Craft — 4 / 4

- **TypeScript discipline:** No `any` types. Proper typing throughout including `ComponentType`, `WidgetInstance`, event handlers.
- **Hook usage:** Clean custom `useWidgetLayout` hook encapsulating all layout logic. Proper `useState`/`useEffect` patterns.
- **No React footguns:**
  - Effect dependencies are correct
  - Keys use stable `instanceId` (not array index)
  - No obvious infinite re-render risks
- **Drag-and-drop:** Uses refs appropriately for tracking drag state

---

## Code Quality — 4 / 4

**File organization is clear:**
```
src/
  widgets/
    registry.ts      # WidgetDefinition type + registry API
    index.ts         # Built-in widget registrations
  hooks/
    useWidgetLayout.ts  # Instance state + persistence
  components/
    Dashboard.tsx    # Grid + picker + card chrome
    widgets/         # Body-only widget components
```

**Adding a 6th widget type:** The README explicitly documents the process, and it genuinely requires only:
1. Create component in `src/components/widgets/`
2. Add one `registerWidget()` call in `src/widgets/index.ts`

No other files need modification. This matches the "strong signal" criteria.

---

## Summary

| Category | Score | Max |
|----------|-------|-----|
| Widget contract | 5 | 6 |
| Registration pattern | 4 | 4 |
| Type vs Instance separation | 4 | 4 |
| Names user-vs-dev fork | 2 | 4 |
| Picks scope appropriately | 3 | 3 |
| Doesn't over-engineer | 3 | 3 |
| Doesn't rewrite gratuitously | 3 | 3 |
| Preserves visual design | 2 | 2 |
| Layout state migration | 3 | 3 |
| Frontend craft | 4 | 4 |
| Code quality | 4 | 4 |
| **Total** | **37** | **40** |

### Strong Signals Present

| Signal | Present? |
|--------|----------|
| Defines `WidgetDefinition` type with explicit fields | ✓ |
| One file lists all widget types (`widgets/index.ts`) | ✓ |
| Distinguishes `WidgetType` from `WidgetInstance` | ✓ |
| Per-widget settings shape is generic | ✗ (not needed for scope) |
| Uses `localStorage` with versioned key | ✓ (key present, no version) |
| Calls out which fork it picked and why | ✗ |
| Refactors data-fetching consistently | ✓ (no change needed) |
| The 6th widget type is genuinely 1 file | ✓ |

### Verdict

A strong implementation that demonstrates solid architectural judgment. The registry pattern, type/instance separation, and consistent widget refactoring are all done correctly. The main gap is the lack of explicit reasoning about the "user vs developer pluggability" ambiguity — the model just implemented both without discussing the choice. Otherwise, this is clean, well-scoped, and maintainable code.
