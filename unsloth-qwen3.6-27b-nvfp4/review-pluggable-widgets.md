# Review: unsloth-qwen3.6-27b-nvfp4 — Pluggable Widgets

**Total: 31/40**

---

## Architectural Judgment — 11/14

### Widget Contract (4/6)

The implementation defines a `WidgetMetadata` interface in `src/lib/registry.ts`:

```typescript
export interface WidgetMetadata {
  id: string;
  name: string;
  description: string;
  defaultSpan: number;
  component: React.FC;
}
```

This captures the essentials (id, title, render) but is missing:
- **No settings shape** — no `settings: TSettings` generic or per-widget config
- **No settings schema** — no way to describe what settings a widget accepts

It's functional for the implemented scope but won't scale if widgets need configuration (e.g., a chart widget that lets users pick which metric to show).

### Registration Pattern (4/4)

Strong. Single registry at `src/lib/registry.ts` with a `Map<string, WidgetMetadata>` and clean accessor functions:

```typescript
export function registerWidget(meta: WidgetMetadata) { ... }
export function getWidget(id: string): WidgetMetadata | undefined { ... }
export function getAllWidgets(): ReadonlyArray<WidgetMetadata> { ... }
```

Each widget self-registers via side-effect import:

```typescript
void registerWidget({
  id: "stats",
  name: "Summary Stats",
  ...
});
```

One obvious place to find all widget types. The imports are centralized in `App.tsx`.

### Type vs Instance Separation (3/4)

Reasonable separation:
- **Widget type**: `WidgetMetadata` in the registry (catalog)
- **Widget instance**: `WidgetLayoutItem` in layout-store (`{ id: string; span: number }`)

However, the instance `id` is the *type* id, not a unique instance id. This means:
- Cannot have multiple instances of the same widget type on the dashboard
- Each type can appear at most once

This is likely a deliberate scope reduction but limits flexibility.

---

## Ambiguity-Handling — 7/10

### Names the User-vs-Developer Fork (1/4)

**Weak.** The implementation silently picks user customization (add/remove/reorder widgets at runtime) without discussing the alternative interpretation (developer pluggability — making it easy for engineers to add new widget types).

The README is unchanged from the original and doesn't explain the architectural decisions. No explicit reasoning about why this fork was chosen.

### Picks Scope Appropriately (3/3)

The implementation includes:
- Widget registry with self-registration
- Layout persistence (localStorage with versioned key)
- Drag-and-drop reordering (native HTML5, no external lib)
- Add/remove widgets
- Widget resize (span control)
- Widget store UI for re-adding removed widgets

Ambitious but functional. Does not attempt react-grid-layout or complex external dependencies.

### Doesn't Over-Engineer (3/3)

No unnecessary complexity:
- No JSON-schema validators
- No zod or runtime type checking
- No plugin lifecycle hooks
- Simple localStorage persistence
- Native drag-and-drop instead of a library

---

## Existing-Code Respect — 8/8

### Doesn't Rewrite Working Widgets Gratuitously (3/3)

All five widgets receive the same minimal modification — a `registerWidget()` call added at the top:

```typescript
void registerWidget({
  id: "stats",
  name: "Summary Stats",
  description: "Requests, latency, users, and error rate at a glance",
  defaultSpan: 3,
  component: StatsWidget,
});
```

The rest of each widget (data fetching, rendering, internal helpers) is unchanged. Consistent treatment across all widgets.

### Preserves Visual Design (2/2)

All original CSS variables preserved. New styles added for:
- `.widget-wrapper` (the draggable container)
- `.widget-handle-bar` (drag handle + controls)
- `.widget-store` (add-widget UI)

Inner widget styling overridden to work within wrappers:

```css
.widget--stats,
.widget--latency,
/* ... */ {
  grid-column: auto;
  background: transparent;
  border: none;
  /* ... */
}
```

Same visual feel as original.

### Migrates Layout State Somewhere Reasonable (3/3)

Uses `localStorage` with a versioned key:

```typescript
const STORAGE_KEY = "dashboard-layout-v1";
```

The `loadLayout()` function attempts migration — loading saved layouts and filtering out widgets that no longer exist in the registry. (Note: the migration logic for *adding* new widgets has a bug — see Frontend Craft below.)

---

## Frontend Craft — 2/4

### Bug in Layout Migration

In `layout-store.ts`, the logic to add newly-registered widgets to existing layouts is broken:

```typescript
const widgets = getAllWidgets();
const widgetIds = new Set(widgets.map((w) => w.id));

const restored: DashboardLayout = [];
for (const item of parsed) {
  // ... adds saved items that still exist
}
for (const w of widgets) {
  if (!widgetIds.has(w.id)) {  // BUG: always false
    restored.push({ id: w.id, span: clampSpan(w.defaultSpan) });
  }
}
```

The condition `!widgetIds.has(w.id)` is always false because `w` comes from `widgets`, which is the source of `widgetIds`. Should check if `w.id` is already in `restored`:

```typescript
const restoredIds = new Set(restored.map((r) => r.id));
for (const w of widgets) {
  if (!restoredIds.has(w.id)) {
    restored.push({ id: w.id, span: clampSpan(w.defaultSpan) });
  }
}
```

This bug means adding a new widget type to the registry won't automatically add it to existing users' dashboards.

### Other Issues

- `item.id!` non-null assertion on potentially partial data from localStorage
- Otherwise good: no `any` types, proper hook usage, correct effect dependencies, proper list keys

---

## Code Quality — 3/4

### File Organization

```
src/
  lib/
    registry.ts      # Widget type catalog
    layout-store.ts  # Layout persistence + operations
  components/
    DashboardLayout.tsx  # Main dashboard with drag/drop
    widgets/
      StatsWidget.tsx    # Self-registering widgets
      ...
```

Clean separation of concerns.

### Adding a 6th Widget

To add a new widget:
1. Create `src/components/widgets/NewWidget.tsx` with `registerWidget()` call
2. Add import to `App.tsx` for side-effect registration

**2 files** — acceptable, though not truly "1 file." The import in `App.tsx` is easy to forget.

### Naming and Clarity

Good naming throughout. `DraggableWidget`, `WidgetStore`, `createReorderLayout`, etc. are self-explanatory. Code is readable.

---

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Architectural judgment | 11/14 | Good registry pattern, but no settings support and instances lack unique IDs |
| Ambiguity-handling | 7/10 | Silent on user-vs-dev fork; scope and complexity appropriate |
| Existing-code respect | 8/8 | Minimal, consistent changes; visual design preserved |
| Frontend craft | 2/4 | Bug in migration logic; otherwise solid |
| Code quality | 3/4 | Clear organization; 6th widget needs 2 files |
| **Total** | **31/40** | |

### Strong Signals
- Clear registry pattern in one file
- Consistent refactoring across all widgets
- Appropriate scope without over-engineering
- localStorage with versioned key

### Weak Signals
- No explicit reasoning about the user-vs-developer fork
- Bug in layout migration logic
- Instances identified by type ID (can't have multiple of same type)
- No per-widget settings support
