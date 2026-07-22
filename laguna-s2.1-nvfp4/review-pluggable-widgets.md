# Review: Pluggable Widgets Implementation

**Model:** laguna-s2.1-nvfp4  
**Task:** Make the dashboard pluggable (add/remove/reorder widgets, easy to add new widget types)

## Summary

This implementation delivers a solid pluggable widget architecture with clear separation between widget types and instances, a centralized registry, user customization via add/remove/reorder, and localStorage persistence. The core architectural decisions are sound, though some type safety is lost through runtime casts and the "user vs developer pluggability" fork isn't explicitly called out.

---

## Architectural Judgment — 13/14

### Designs a Widget contract — 5/6

The implementation defines a `WidgetDefinition<TData>` interface in `registry.ts`:

```1:12:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/registry.ts
import type { ReactNode } from "react";

export interface WidgetDefinition<TData = unknown> {
  id: string;
  name: string;
  description?: string;
  defaultWidth: number;
  icon?: ReactNode;
  render: (props: { data: TData | null; error: Error | null }) => ReactNode;
  fetch: () => Promise<TData>;
  intervalMs?: number;
}
```

This captures the right shape: id, display metadata, render function, data fetching, and refresh interval. The generic `TData` is a good design, but type safety is partially lost because widgets use `AnyWidget = WidgetDefinition<unknown>` and must cast data in their render functions:

```9:18:laguna-s2.1-nvfp4/pluggable-widgets/src/components/widgets/StatsWidget.tsx
  render: ({ data }) => {
    const stats = data as SummaryStats;
    return (
      <div className="stat-grid">
        <Stat label="req/min" value={stats.requestsPerMin.toLocaleString()} delta={stats.requestsDelta} />
        // ...
      </div>
    );
  },
```

The `as` casts lose compile-time guarantees. A stronger approach would be to make the registry generic-aware or use a factory pattern that preserves the type through to render.

### Picks a registration pattern — 4/4

Excellent. One file (`registry.ts`) owns the list of available widget types:

```16:35:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/registry.ts
const widgets = new Map<string, AnyWidget>();

export function registerWidget(widget: AnyWidget): void {
  if (widgets.has(widget.id)) {
    throw new Error(`Widget "${widget.id}" is already registered`);
  }
  widgets.set(widget.id, widget);
}

export function getWidget(id: string): AnyWidget | undefined {
  return widgets.get(id);
}

export function getAllWidgets(): AnyWidget[] {
  return Array.from(widgets.values());
}
```

Each widget self-registers at module load time, and `src/widgets/index.ts` triggers all registrations:

```1:5:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/index.ts
import "../components/widgets/StatsWidget";
import "../components/widgets/LatencyWidget";
import "../components/widgets/ErrorsWidget";
import "../components/widgets/ActivityWidget";
import "../components/widgets/ServicesWidget";
```

### Separates "widget type" from "widget instance" — 4/4

Clear distinction:

- **Widget type (catalog):** `WidgetDefinition` — defines what a widget *is*
- **Widget instance (placed):** `LayoutItem` — tracks a placed widget with position/size

```4:11:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/dashboard-context.tsx
export interface LayoutItem {
  widgetId: string;
  w: number;
}

export interface DashboardLayoutState {
  items: LayoutItem[];
  isEditing: boolean;
}
```

The dashboard state holds instances; the registry holds types. This is the correct architecture.

---

## Ambiguity-handling — 7/10

### Names the user-vs-developer fork — 1/4

The implementation clearly chose **user customization** (runtime add/remove/reorder with persistence) over **developer pluggability** (easy to add new widget types). However, there's no explicit callout of this decision or reasoning for why one was prioritized.

The code commits to user customization with edit mode, a widget palette, and localStorage, but silently assumes this was the ask. A strong implementation would note: "Interpreting 'pluggable' as user-customizable dashboard; developer extension is also supported via the registry pattern."

### Picks scope appropriately for 30 min — 3/3

Good scope selection:
- Native HTML5 drag-and-drop for reordering (no react-grid-layout dependency)
- localStorage persistence (no backend)
- Add/remove widgets from a palette
- No per-widget settings UI (would be scope creep)

### Doesn't over-engineer — 3/3

Appropriate simplicity:
- Simple Map-based registry, no plugin lifecycle
- No zod/JSON-schema validation for widget configs
- No dynamic imports or lazy loading
- Just enough abstraction for the use case

---

## Existing-code Respect — 7.5/8

### Doesn't rewrite working widgets gratuitously — 3/3

All five widgets were refactored *consistently* to the new pattern. The internal rendering logic was preserved — the `Stat` component, chart configuration, threshold logic all remain intact. Only the wrapper changed from self-contained component to `registerWidget()` call.

Before:
```typescript
export function StatsWidget() {
  const [data, setData] = useState<SummaryStats | null>(null);
  useEffect(() => { /* fetch logic */ }, []);
  return <div className="widget">...</div>;
}
```

After:
```typescript
registerWidget({
  id: "stats",
  render: ({ data }) => { /* same rendering */ },
  fetch: fetchSummaryStats,
  intervalMs: 30_000,
});
```

This is a consistent, justified refactor — not gratuitous rewriting.

### Preserves the visual design — 2/2

- Same CSS variables (`--bg`, `--panel`, `--border`, etc.)
- Same widget chrome (header with title/subtitle, body)
- Same grid layout (12-column, same spans)
- Edit mode styling added without disrupting existing appearance

### Migrates layout state somewhere reasonable — 2.5/3

Uses localStorage with validation:

```23:47:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/dashboard-context.tsx
const STORAGE_KEY = "dashboard:layout";

function loadLayout(): LayoutItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LayoutItem[];
      const registeredIds = new Set(getAllWidgets().map((w) => w.id));
      const valid = parsed.filter((item) => registeredIds.has(item.widgetId));
      if (valid.length > 0) return valid;
    }
  } catch {
    // fall through to defaults
  }

  return getAllWidgets().map((w) => ({ widgetId: w.id, w: w.defaultWidth }));
}
```

Good: validates stored widget IDs against current registry, falls back gracefully.

Minor gap: no version key on storage (e.g., `dashboard:layout:v1`). If `LayoutItem` shape changes in the future, old stored layouts could cause issues. For an internal tool this is acceptable.

---

## Frontend Craft — 3/4

**TypeScript discipline:** Loses points for `as` casts in every widget's render function. The generic `TData` on `WidgetDefinition` isn't leveraged at the call sites.

**Hook usage:** Correct. Effects have proper cleanup, dependencies are accurate:

```117:149:laguna-s2.1-nvfp4/pluggable-widgets/src/widgets/DashboardLayout.tsx
  useEffect(() => {
    let cancelled = false;

    widget.fetch().then(
      (result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      },
      (err: Error) => {
        if (!cancelled) setError(err);
      }
    );

    if (widget.intervalMs) {
      intervalRef.current = setInterval(() => {
        // ...
      }, widget.intervalMs);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [widget]);
```

**No React footguns:** Keys are used correctly, no infinite re-renders, drag state handled properly with a counter pattern to manage dragenter/dragleave bubbling.

---

## Code Quality — 3/4

**File organization:** Clean separation:
- `src/widgets/` — framework code (registry, context, layout, wrapper)
- `src/components/widgets/` — individual widget implementations

**Naming:** Clear and conventional (`WidgetDefinition`, `LayoutItem`, `registerWidget`, `useDashboard`)

**Adding a 6th widget:** Requires edits in 2 files:
1. Create `src/components/widgets/NewWidget.tsx` with `registerWidget({...})`
2. Add import to `src/widgets/index.ts`

Not quite the ideal "1 file" story, but close. The index file is just a list of imports, so the actual logic is in one place.

---

## Score Summary

| Category | Points | Max |
|----------|--------|-----|
| Architectural judgment | 13 | 14 |
| Ambiguity-handling | 7 | 10 |
| Existing-code respect | 7.5 | 8 |
| Frontend craft | 3 | 4 |
| Code quality | 3 | 4 |
| **Total** | **33.5** | **40** |

---

## Strong Signals Present

| Signal | Present? |
|--------|----------|
| Defines `Widget`/`WidgetDefinition` type with explicit fields | ✓ |
| One file lists all widget types (`widgets/registry.ts`) | ✓ |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ✓ |
| Per-widget settings shape is generic | Partial (generic exists but cast away) |
| If layout persists, uses `localStorage` with a versioned key | Partial (no version key) |
| Calls out which fork (user vs dev) it picked and why | ✗ |
| Refactors data-fetching consistently or doesn't refactor at all | ✓ |
| The 6th widget type is genuinely 1 file | ✗ (2 files) |

---

## Recommendations

1. **Acknowledge the fork:** Add a comment or README note explaining the choice to prioritize user customization over pure developer extensibility.

2. **Improve type safety:** Consider a factory pattern that preserves the generic type, or accept the tradeoff but document why `as` casts are acceptable here.

3. **Version the storage key:** Change to `dashboard:layout:v1` to enable future migrations.

4. **Auto-discovery for widgets:** Could use import.meta.glob (Vite) to eliminate the manual index.ts, making new widgets truly 1-file additions.
