# Review: flint-nvfp4/pluggable-widgets

**Task**: Make the dashboard widgets pluggable  
**Rubric**: BENCHMARK.md Task 2 (40 pts)

---

## Summary

The implementation creates a solid widget registry pattern with a clean `WidgetDefinition` type, localStorage-based layout persistence, and native HTML5 drag-and-drop for reordering. Both user customization (add/remove/reorder) and developer extensibility (adding new widget types) are addressed. The existing widgets were refactored consistently to remove their wrapper/header (now provided by `WidgetCard`), preserving the visual design and data-fetching patterns.

**Total Score: 34/40**

---

## Architectural Judgment — 11/14

### Designs a Widget contract (5/6)

A clear `WidgetDefinition` interface exists in `src/widgets/types.ts`:

```typescript
export interface WidgetDefinition {
  id: string;
  title: string;
  subtitle?: ReactNode;
  defaultCols: number;
  component: ComponentType;
}
```

This captures the essential shape — id, title, layout hint, and render component. However, it lacks a generic settings schema (`settings: TSettings`) that would allow per-widget configuration. For the current scope this is fine, but adding a "configurable threshold" widget later would require extending the type.

### Picks a registration pattern (4/4)

The single source of truth is `WIDGET_REGISTRY` in `src/widgets/registry.ts`:

```1:12:flint-nvfp4/pluggable-widgets/src/widgets/registry.ts
import type { WidgetDefinition } from "./types";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

/**
 * Registry of all available widget types. To add a new widget type:
 * create the component, export it here with an id/title/defaultCols, and it
 * shows up in the dashboard automatically.
 */
```

"Where is the list of available widget types?" has one obvious answer. The helper functions `getWidgetDefinition()` and `listWidgetIds()` provide clean access.

### Separates "widget type" from "widget instance" (2/4)

The dashboard layout is stored as an array of widget IDs:

```6:11:flint-nvfp4/pluggable-widgets/src/state/useDashboardLayout.ts
const DEFAULT_LAYOUT: WidgetId[] = [
  "stats",
  "latency",
  "errors",
  "activity",
  "services",
];
```

The registry is the catalog of types, and the layout is the list of placed widgets — conceptually correct. However, the implementation uses **widget type IDs as instance IDs**, meaning you cannot have two "stats" widgets on the same dashboard. For a simple ops dashboard this is reasonable, but it conflates the type/instance distinction. A stronger implementation would use instance UUIDs in the layout, each referencing a type ID.

---

## Ambiguity-handling — 8/10

### Names the user-vs-developer fork (2/4)

The README documents both:
- User customization: add/remove/reorder via UI
- Developer extensibility: add a widget type in 2 files

However, there's no explicit acknowledgment of the fork in the code or docs — no "we chose to prioritize X because Y" statement. The implementation addresses both, but silently. The rubric rewards explicitly naming the tension.

### Picks scope appropriately for 30 min (3/3)

Good scope management:
- Native HTML5 drag-and-drop instead of `react-grid-layout`
- Simple localStorage instead of URL state or backend
- No full-grid resize, no settings modals
- Each feature is complete enough to be usable

### Doesn't over-engineer (3/3)

No:
- JSON-schema runtime validators
- Zod for a 5-widget internal tool
- Plugin lifecycle hooks
- Complex state machines

Just the essentials: types, registry, state hook, UI components.

---

## Existing-code Respect — 8/8

### Doesn't rewrite working widgets gratuitously (3/3)

All 5 widgets were refactored consistently. The pattern:
- **Before**: Widget renders its own `.widget` wrapper, header, and body
- **After**: Widget renders only the body content; `WidgetCard` provides the chrome

Example transformation in `StatsWidget`:

```13:21:flint-nvfp4/pluggable-widgets/src/components/widgets/StatsWidget.tsx
  return data == null ? (
    <span className="loading">Loading…</span>
  ) : (
    <div className="stat-grid">
      <Stat label="req/min" value={data.requestsPerMin.toLocaleString()} delta={data.requestsDelta} />
      <Stat label="p99 ms" value={String(data.p99LatencyMs)} delta={data.latencyDelta} invertColor />
      <Stat label="users" value={data.activeUsers.toLocaleString()} delta={data.usersDelta} />
      <Stat label="err %" value={data.errorRate.toFixed(2)} delta={data.errorRateDelta} invertColor />
    </div>
```

The data-fetching pattern (`useEffect` + `setInterval`) is preserved unchanged.

### Preserves the visual design (2/2)

Same CSS variables, same widget chrome styling. New styles (`.add-menu*`, `.widget-remove`, drag states) match the existing aesthetic with consistent spacing, colors, and typography.

### Migrates layout state somewhere reasonable (3/3)

localStorage with a namespaced key:

```5:5:flint-nvfp4/pluggable-widgets/src/state/useDashboardLayout.ts
const STORAGE_KEY = "ops-dashboard:layout";
```

Error handling for private browsing mode, validation of loaded widget IDs against the registry, and graceful fallback to defaults.

---

## Frontend Craft — 4/4

- **TypeScript discipline**: No `any`, proper typing throughout
- **Hook usage**: `useCallback` for stable callbacks, proper effect dependencies
- **No React footguns**: Keys are stable widget IDs, no effect dependency bugs
- **Drag state**: Clean management with `dragIndex`/`overIndex` state

The `moveWidget` logic correctly handles the index shift after splicing:

```54:64:flint-nvfp4/pluggable-widgets/src/state/useDashboardLayout.ts
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
```

---

## Code Quality — 3/4

### File organization

Clean structure:
```
src/
  widgets/
    types.ts      — WidgetDefinition interface
    registry.ts   — WIDGET_REGISTRY + helpers
  state/
    useDashboardLayout.ts
  components/
    WidgetCard.tsx
    AddWidgetMenu.tsx
    widgets/*.tsx
```

### Adding a 6th widget

Per the README:
1. Create `src/components/widgets/<Name>Widget.tsx`
2. Add entry to `WIDGET_REGISTRY`

That's genuinely 2 files — good.

### Deduction

The README update is thorough, but the code itself lacks inline comments explaining the overall architecture. A brief comment in `App.tsx` explaining the widget system flow would help onboarding.

---

## Tells Assessment

| Strong signal | This implementation |
|--------------|---------------------|
| Defines `Widget`/`WidgetDefinition` type with explicit fields | ✓ `WidgetDefinition` with id, title, subtitle, defaultCols, component |
| One file lists all widget types | ✓ `widgets/registry.ts` |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ⚠ Conceptually yes, but uses type ID as instance ID |
| Per-widget settings shape is generic | ✗ No settings schema |
| If layout persists, uses localStorage with a versioned key | ✓ `ops-dashboard:layout` |
| Calls out which fork (user vs dev) it picked and why | ✗ Silent pick, addressed both |
| Refactors data-fetching consistently or doesn't refactor at all | ✓ Consistent across all 5 widgets |
| The 6th widget type is genuinely 1 file | ✓ Close — 1 file + 1 registry entry (same file edits) |

---

## Would I Merge?

**Yes**, with minor feedback:

1. Consider separating instance IDs from type IDs if multiple instances of the same widget type might be needed later
2. Add a brief architecture comment in `App.tsx`
3. The README is excellent

This is a clean, well-scoped implementation that addresses both user customization and developer extensibility without over-engineering.

---

## Score Breakdown

| Dimension | Points | Score |
|-----------|--------|-------|
| Architectural judgment | 14 | 11 |
| Ambiguity-handling | 10 | 8 |
| Existing-code respect | 8 | 8 |
| Frontend craft | 4 | 4 |
| Code quality | 4 | 3 |
| **Total** | **40** | **34** |
