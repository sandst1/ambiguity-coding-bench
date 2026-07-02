# Review: Pluggable Widgets Implementation

**Model:** nvidia-qwen3.6-27b-nvfp4  
**Task:** Make the dashboard pluggable (add/remove/reorder widgets, easy to add new types)

## Summary

The implementation delivers a functional pluggable dashboard with a clean registry pattern and proper type/instance separation. Widgets can be added, removed, and reordered via drag-and-drop, with layout persisted to localStorage. The existing widgets are completely preserved. However, the model silently chose user-facing customization without articulating the trade-off, the widget contract lacks a settings abstraction, and there's some CSS sloppiness.

---

## Scores by Category

| Category | Score | Max |
|----------|-------|-----|
| Architectural judgment | 12 | 14 |
| Ambiguity-handling | 7 | 10 |
| Existing-code respect | 8 | 8 |
| Frontend craft | 3 | 4 |
| Code quality | 2 | 4 |
| **Total** | **32** | **40** |

---

## Architectural judgment — 12/14

### Designs a Widget contract — 4/6

The implementation defines a `WidgetType` interface in `registry.ts`:

```typescript
export interface WidgetType {
  type: string;
  title: string;
  description: string;
  gridSpan: number;
  component: React.ComponentType;
}
```

**What's good:**
- Has the essential fields: identifier, display name, render component
- Includes `gridSpan` for layout control
- `description` is a nice touch for the widget picker UI

**What's missing:**
- No `defaultSettings` or `settingsSchema` field
- No generic `settings: TSettings` pattern
- Component is typed as `React.ComponentType` with no props — widgets can't receive per-instance configuration

For an internal ops tool this may be acceptable, but the contract doesn't anticipate future per-widget settings (e.g., "show last 24h vs 7d" on the latency chart).

### Picks a registration pattern — 4/4

Clean implementation with a single source of truth:

- `registry.ts` exports `registerWidget()`, `getWidgetType()`, `getAvailableWidgets()`
- All widget registrations happen in **one file**: `src/components/widgets/index.ts`
- Registration is done via side-effect import in `App.tsx`: `import "./components/widgets";`

A developer looking for "what widget types exist" goes to `index.ts` and finds all five `registerWidget()` calls in one place.

### Separates "widget type" from "widget instance" — 4/4

Correctly distinguished:

- **`WidgetType`** (catalog): lives in the registry, describes what a widget can do
- **`PlacedWidget`** (instance): lives in dashboard state, has unique `id` and references a `type`

```typescript
export interface PlacedWidget {
  id: string;
  type: string;
}
```

The dashboard state is `PlacedWidget[]`, not a list of types. Adding the same widget twice creates distinct instances with different IDs. This is the correct abstraction.

---

## Ambiguity-handling — 7/10

### Names the user-vs-developer fork — 1/4

The prompt says "Make it pluggable" which has two readings:
1. **Developer-pluggable:** Easy for engineers to add new widget types
2. **User-pluggable:** End users can add/remove/reorder widgets at runtime

The model **silently chose user-pluggable** (implemented add/remove/reorder UI, localStorage persistence, widget picker). This is a valid choice, but there's no stated reasoning anywhere — not in the README, not in code comments. The README is unchanged from the original.

A strong response would acknowledge: "Interpreting 'pluggable' as user-facing customization. Developer extensibility comes along for free via the registry."

### Picks scope appropriately for 30 min — 3/3

The scope is well-calibrated:
- No external drag-and-drop library — uses native HTML5 `draggable`
- No grid layout library (react-grid-layout, etc.)
- No per-widget settings UI
- Simple localStorage persistence
- No versioned schema migration

The implementation delivers core functionality (add/remove/reorder) without over-scoping.

### Doesn't over-engineer — 3/3

No unnecessary complexity:
- Simple `Map<string, WidgetType>` registry
- No JSON schema validators or zod
- No plugin lifecycle hooks
- No event bus or complex state management
- Straightforward React Context for dashboard state

---

## Existing-code respect — 8/8

### Doesn't rewrite working widgets gratuitously — 3/3

All five widget files are **byte-for-byte identical** to the originals:
- `StatsWidget.tsx` — unchanged
- `LatencyWidget.tsx` — unchanged
- `ErrorsWidget.tsx` — unchanged
- `ActivityWidget.tsx` — unchanged
- `ServicesWidget.tsx` — unchanged

The existing data-fetching pattern (each widget fetches its own data, polls on its own interval) is preserved. No gratuitous "improvements."

### Preserves the visual design — 2/2

- Same CSS variables (`:root` block identical)
- Same widget chrome (`.widget`, `.widget-header`, `.widget-body`)
- Same 12-column grid layout
- New styles for frame controls and picker are additive, not replacing

The dashboard looks the same, just with new UI controls for customization.

### Migrates layout state somewhere reasonable — 3/3

Uses `localStorage` with key `dashboard-layout`:

```typescript
const LAYOUT_KEY = "dashboard-layout";
```

Handles edge cases:
- Falls back to defaults if nothing saved
- Filters out invalid types on load (in case widget was removed)
- Silently catches JSON parse errors and quota errors

No versioned key, but that's acceptable for this scope.

---

## Frontend craft — 3/4

**TypeScript discipline:** Good
- No `any` usage
- All interfaces properly typed
- Component props typed where used

**React patterns:** Mostly good
- `useCallback` used appropriately for stable handlers
- `useState` and `useEffect` used correctly
- Context pattern is clean
- Effect dependency array is correct

**Minor issues:**
- Side-effect import `import "./components/widgets";` is unconventional but works
- `handleDragOver` is an empty function with an unused parameter:
  ```typescript
  const handleDragOver = useCallback((_i: number) => {}, []);
  ```
  The `e.preventDefault()` happens in the inline handler, which is fine, but the separate callback does nothing.

---

## Code quality — 2/4

**File organization:** Good
```
src/
├── registry.ts          # Widget type registry
├── dashboard.tsx        # Dashboard state context
├── App.tsx              # Main app with grid rendering
└── components/
    ├── WidgetPicker.tsx # Add widget UI
    └── widgets/
        ├── index.ts     # All registrations
        └── *.tsx        # Individual widgets
```

**Adding a 6th widget requires:**
1. Create `MyWidget.tsx` in `components/widgets/`
2. Add import + `registerWidget()` call in `index.ts`

That's 2 files — acceptable.

**Issues:**
- **CSS duplication:** The styles file has duplicate definitions:
  - `.header-left` defined twice (lines 38-42 and 89-93)
  - `.header-actions` defined twice
  - `.header-btn` defined twice with slightly different values
  
  This is sloppy copy-paste that could cause maintenance confusion.

- **README not updated:** The README still describes the original static dashboard. Should document the new customization features and the registry pattern for developers.

---

## Tells Summary

| Signal | Present? |
|--------|----------|
| Defines `WidgetType` with explicit fields | ✅ Yes |
| One file lists all widget types | ✅ Yes (`widgets/index.ts`) |
| Distinguishes WidgetType from WidgetInstance | ✅ Yes (`WidgetType` vs `PlacedWidget`) |
| Per-widget settings is generic | ❌ No settings abstraction |
| localStorage with versioned key | ⚠️ Partial (no version) |
| Calls out user-vs-dev fork with reasoning | ❌ No (silent pick) |
| Refactors data-fetching consistently | ✅ N/A — didn't refactor at all |
| 6th widget is 1 file | ⚠️ 2 files (widget + index.ts) |

---

## Final Assessment

**Score: 32/40**

A solid implementation that gets the core architecture right. The registry pattern is clean, type/instance separation is correct, and the existing code is respected. The main weaknesses are: (1) not articulating the user-vs-developer choice, (2) no settings abstraction in the widget contract, and (3) CSS sloppiness. For a 30-minute task, this is good work that a team could build on.
