# Review: pluggable-widgets (ternary-bonsai-27b)

**Prompt:** "We want users to be able to customize this dashboard — add and remove widgets, reorder them. And from our side, we want it to be easy to add new widget types when product asks (which they will). Make it pluggable."

**Total Score: 33/40**

---

## Architectural Judgment — 12.5/14

### Designs a Widget contract — 5/6

The model defines a `WidgetDefinition` interface in `widget-types.ts`:

```8:23:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
export interface WidgetDefinition {
  /** Unique identifier for this widget type */
  id: string;

  /** Display title shown in the header */
  name: string;

  /** The React component to render */
  component: React.FC<WidgetProps>;

  /** Number of grid columns this widget occupies (default 3) */
  gridSpan?: number;

  /** Optional schema describing user-configurable options */
  configSchema?: WidgetConfigSchema;
}
```

This captures the essential shape: id, title, render component, default size, and an optional settings schema. The `WidgetConfigSchema` type provides structure for future per-widget configuration.

**Weakness:** The `config` field in `WidgetProps` is typed as `unknown` rather than using a generic (`TSettings`). This loses type safety for widget-specific settings:

```61:66:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
export interface WidgetProps {
  /** The widget definition that created this instance */
  type?: WidgetDefinition;
  /** Instance-specific config (may be undefined) */
  config?: unknown;
}
```

A stronger design would be `WidgetDefinition<TConfig = unknown>` with the component typed as `React.FC<WidgetProps<TConfig>>`.

### Picks a registration pattern — 4/4

Clean single-file registry pattern. The answer to "where is the list of available widget types?" is unambiguously `widget-types.ts`:

```84:111:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
const _registry = new Map<string, WidgetDefinition>();

export const registry = {
  /** Add a widget type. Idempotent — later calls override earlier ones. */
  registerWidget(def: WidgetDefinition): void {
    _registry.set(def.id, def);
  },

  /** Get all registered widget types */
  getAll(): readonly WidgetDefinition[] {
    return Array.from(_registry.values());
  },

  /** Get a single widget type by id */
  get(id: string): WidgetDefinition | undefined {
    return _registry.get(id);
  },
  // ...
};
```

Registration happens in one place (`App.tsx`), making it trivial to add new widgets.

### Separates "widget type" from "widget instance" — 3.5/4

The separation is correctly implemented:

- **Widget types** live in the registry (`WidgetDefinition`)
- **Widget instances** are stored in dashboard state:

```42:51:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
export interface WidgetInstance {
  /** Which widget type this instance belongs to */
  typeId: string;

  /** Where this widget sits in the user's layout (0-based index) */
  order: number;

  /** User-configurable settings for this instance */
  config?: unknown;
}
```

**Issue:** `WidgetInstance` is defined twice in the file (lines 42-51 and 68-77). This is a copy-paste error that should have been caught.

---

## Ambiguity-Handling — 7/10

### Names the user-vs-developer fork — 2/4

The implementation addresses **both** forks:
- **Developer-side:** One-line widget registration
- **User-side:** Add/remove/reorder at runtime with persistence

However, this choice is not explicitly documented. The code comments mention developer extensibility:

```82:83:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
 * Central registry — add new widgets here.
 * Designed to be importable from other packages so product teams can
```

But there's no README update or comment explaining why both interpretations were chosen or what trade-offs that implies. A strong response would call this out explicitly.

### Picks scope appropriately for 30 min — 3/3

Good scoping decisions:
- Simple up/down reordering instead of drag-and-drop
- No external dependencies (no react-grid-layout)
- localStorage persistence (appropriate for an internal tool)
- No settings UI implementation (schema defined but unused)

### Doesn't over-engineer — 2/3

The `WidgetConfigSchema` type is defined but never used:

```25:40:ternary-bonsai-27b/pluggable-widgets/src/lib/widget-types.ts
export interface WidgetConfigSchema {
  /** Human label for the config option */
  label: string;

  /** Type of value */
  type: "number" | "string" | "boolean" | "select";

  /** Default value */
  default: unknown;

  /** For select, list of available options */
  options?: { label: string; value: unknown }[];

  /** Validation function (returns true if valid) */
  validate?: (value: unknown) => boolean;
}
```

None of the registered widgets provide a `configSchema`, and there's no UI to edit config. This is mild scope creep — defining infrastructure that isn't used. Better to either implement it or omit it entirely.

---

## Existing-Code Respect — 7.5/8

### Doesn't rewrite working widgets gratuitously — 3/3

The changes to existing widgets are minimal and consistent. Compare original:

```typescript
export function StatsWidget() {
```

To modified:

```5:5:ternary-bonsai-27b/pluggable-widgets/src/components/widgets/StatsWidget.tsx
export function StatsWidget({ type, config }: WidgetProps = {}) {
```

Data-fetching pattern, polling intervals, and rendering logic are untouched across all five widgets. The refactoring is surgical and consistent.

### Preserves the visual design — 1.5/2

CSS variables and widget chrome are preserved in `styles.css`. The original grid classes are kept as fallbacks:

```91:96:ternary-bonsai-27b/pluggable-widgets/src/styles.css
/* widget grid placements (fallback — now handled by layout system) */
.widget--stats     { grid-column: span 3; }
.widget--latency   { grid-column: span 6; }
.widget--errors    { grid-column: span 3; }
.widget--activity  { grid-column: span 7; }
.widget--services  { grid-column: span 5; }
```

**Minor issue:** The new `WidgetCard` wrapper adds a control bar above each widget, changing the visual appearance slightly. The control bar styling (`.widget-controls`) doesn't use CSS variables from the original design system.

### Migrates layout state somewhere reasonable — 3/3

Excellent localStorage implementation:

```4:41:ternary-bonsai-27b/pluggable-widgets/src/lib/dashboard-context.tsx
const STORAGE_KEY = "ops-dashboard-layout-v1";

// ...

function loadLayout(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STORAGE_DEFAULTS.map((d) => ({ ...d }));
    const parsed = JSON.parse(raw) as WidgetInstance[];
    // Validate against current registry — remove any widget types that no longer exist
    const availableIds = new Set(registry.getAll().map((w) => w.id));
    return parsed.filter((w) => availableIds.has(w.typeId)).sort((a, b) => a.order - b.order);
  } catch {
    return STORAGE_DEFAULTS.map((d) => ({ ...d }));
  }
}
```

- Versioned key (`-v1`)
- Validates against current registry on load
- Graceful fallback on parse errors or missing localStorage

---

## Frontend Craft — 3/4

- No `any` types; uses `unknown` appropriately for dynamic config
- Hooks are used correctly: `useState`, `useEffect`, `useCallback`, `useContext`, `useMemo`
- Effect dependencies are correct
- Keys are stable (`typeId` for widget grid items)

**Issue:** The duplicate `WidgetInstance` definition (mentioned above) is a TypeScript discipline failure — the file would benefit from a lint pass.

**Minor:** The `loadLayout` function references `registry.getAll()` during initial state computation. This works because widget registration happens at module import time before React renders, but it's an implicit dependency that could break if registration timing changes.

---

## Code Quality — 3/4

**File organization is clear:**
```
src/
  lib/
    widget-types.ts      # Contract + registry
    dashboard-context.tsx # State management + persistence
    dashboard-layout.tsx  # Render logic
    dashboard-layout.css  # Layout-specific styles
  components/widgets/    # Widget implementations (unchanged structure)
```

**Adding a 6th widget requires:**
1. Create `src/components/widgets/NewWidget.tsx`
2. Add one line in `App.tsx`:
   ```typescript
   registry.registerWidget({ id: "new", name: "New Widget", component: NewWidget, gridSpan: 4 });
   ```

This is genuinely close to "1 file" — the registration is a single line in an obvious location.

**Issues:**
- Duplicate type definition in `widget-types.ts`
- README was not updated to document the pluggable architecture
- Missing JSDoc on `DashboardProvider` and `DashboardLayout`

---

## Summary: Signals

| Criterion | Signal |
|-----------|--------|
| Widget contract | ✓ Strong — `WidgetDefinition` with explicit fields |
| Registration pattern | ✓ Strong — single `widget-types.ts` registry |
| Type vs instance separation | ✓ Strong — `WidgetDefinition` vs `WidgetInstance` |
| Per-widget settings | ○ Weak — `unknown` instead of generic |
| Persistence | ✓ Strong — versioned localStorage with validation |
| Fork documentation | ✗ Weak — silent pick of both forks |
| 6th widget = 1 file | ✓ Strong — genuinely 1 file + 1 line registration |
| Consistent refactoring | ✓ Strong — all widgets touched identically |
| Over-engineering | ○ Mild — unused `WidgetConfigSchema` |

---

## Final Score Breakdown

| Category | Score |
|----------|-------|
| Architectural judgment | 12.5/14 |
| Ambiguity-handling | 7/10 |
| Existing-code respect | 7.5/8 |
| Frontend craft | 3/4 |
| Code quality | 3/4 |
| **Total** | **33/40** |
