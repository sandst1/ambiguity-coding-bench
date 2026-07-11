# Review: pluggable-widgets (unsloth-qwen3.6-27b-q6_k)

**Total Score: 34/40**

---

## Architectural Judgment — 13/14

### Widget contract — 5/6

The implementation defines a clear `WidgetDefinition` interface in `types.ts`:

```typescript
export interface WidgetDefinition {
  id: string;
  label: string;
  defaultSpan: GridSpan;
  component: ComponentType;
}
```

**Strengths:**
- Explicit fields with proper TypeScript types
- `ComponentType` from React for the render component
- Sensible `GridSpan` type restricting to valid values (3, 5, 6, 7, 9, 12)

**Gap:** No settings schema or generic settings parameter (e.g., `settings: TSettings`). This limits per-widget configuration, though arguably appropriate for scope.

### Registration pattern — 4/4

One clear file (`registry.ts`) with a `Map`-based registry:

```typescript
const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void { ... }
export function getWidgetDef(typeId: string): WidgetDefinition | undefined { ... }
export function getAllWidgets(): WidgetDefinition[] { ... }
```

Each widget self-registers via side-effect import:

```typescript
// In StatsWidget.tsx
registerWidget({
  id: "stats",
  label: "Summary",
  defaultSpan: 3,
  component: StatsWidget,
});
```

The list of available types lives in **one obvious place** — the registry Map.

### Separates "widget type" from "widget instance" — 4/4

Excellent separation in `types.ts`:

```typescript
// Catalog entry (type definition)
export interface WidgetDefinition {
  id: string;
  label: string;
  defaultSpan: GridSpan;
  component: ComponentType;
}

// Placed widget (instance on dashboard)
export interface WidgetInstance {
  instanceId: string;  // Unique per placement
  typeId: string;      // References WidgetDefinition.id
  span: GridSpan;      // Can override defaultSpan
}
```

This correctly supports multiple instances of the same widget type.

---

## Ambiguity-handling — 7/10

### Names the user-vs-developer fork — 1/4

**Weak signal.** The implementation clearly picks **user extensibility** (UI-based add/remove/reorder) rather than developer extensibility (easy to add new widget types to code). However:

- The README is unchanged from the original — no mention of the pluggable architecture
- No explanation of why user-side customization was chosen
- No stated reasoning anywhere in the codebase

This is the "silent pick" antipattern from the rubric.

### Picks scope appropriately for 30 min — 3/3

Appropriate scoping:
- HTML5 native drag-and-drop (no react-dnd / react-grid-layout)
- Simple span-cycling button for resize (not drag-to-resize)
- localStorage persistence with versioned key
- No settings UI per widget

The implementation is complete and functional without over-reaching.

### Doesn't over-engineer — 3/3

Clean and minimal:
- No JSON-schema validators
- No zod validation
- No plugin lifecycle hooks
- Simple Map-based registry, no fancy DI or service locator

---

## Existing-code Respect — 7/8

### Doesn't rewrite working widgets gratuitously — 3/3

All 5 widgets were refactored **consistently**:
- Each widget now renders just the body content (no wrapper div)
- Each adds `registerWidget()` call at module bottom
- Data-fetching pattern (useState + useEffect + interval) preserved identically

No haphazard partial refactoring.

### Preserves the visual design — 1/2

**Mostly preserved:**
- Same CSS variables (--bg, --panel, --border, --accent, etc.)
- Same 12-column grid layout
- Same widget chrome aesthetics

**Lost:**
- Widget subtitles ("last 5 min", "last 2h, ms") that provided context in original headers
- Original had `widget-header` with title + subtitle; new version has `widget-toolbar` with drag handle + title + actions

The toolbar is a reasonable addition for the pluggable UI, but losing the subtitles removes useful context.

### Migrates layout state somewhere reasonable — 3/3

Proper localStorage persistence:

```typescript
const STORAGE_KEY = "dashboard-layout-v1";

function loadLayout(): WidgetInstance[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetInstance[];
  } catch {
    return null;
  }
}
```

- Versioned key (`-v1`) provides migration path
- Graceful fallback to default layout
- Silent failure on storage errors

---

## Frontend Craft — 4/4

**TypeScript discipline:** No `any` types. Proper typing throughout with explicit interfaces.

**Hook usage:** Clean custom hook `useDashboardLayout` encapsulating all layout state logic:
- `useCallback` for stable function references
- `useEffect` with proper dependency array for persistence
- Lazy state initialization

**No React footguns:**
- Proper cleanup in useEffect (clearInterval)
- Stable keys via `instanceId`
- No obvious dependency bugs or infinite re-render risks

**Minor observation:** Drag refs stored in `useRef` work correctly but could be simplified with a drag context.

---

## Code Quality — 3/4

**File organization:**
```
src/
  types.ts           # WidgetDefinition, WidgetInstance
  registry.ts        # Widget registration
  hooks/
    useDashboardLayout.ts
  components/
    WidgetPicker.tsx
    WidgetWrapper.tsx
    widgets/
      StatsWidget.tsx
      LatencyWidget.tsx
      ...
```

Clear separation of concerns.

**Adding a 6th widget type:**
1. Create `src/components/widgets/NewWidget.tsx`
2. Import `registerWidget`, call it with definition
3. Add side-effect import in `App.tsx`

This is close to "one file" but still requires the import in `App.tsx`. A dynamic import or barrel file could eliminate this, though it's a minor friction.

**Naming:** Clear and consistent (WidgetDefinition, WidgetInstance, WidgetWrapper, WidgetPicker).

---

## Summary

| Category | Score |
|----------|-------|
| Architectural judgment | 13/14 |
| Ambiguity-handling | 7/10 |
| Existing-code respect | 7/8 |
| Frontend craft | 4/4 |
| Code quality | 3/4 |
| **Total** | **34/40** |

### Strongest aspects:
- Clean type/instance separation
- Single-file registry pattern
- Consistent widget refactoring
- Appropriate scope without over-engineering

### Areas for improvement:
- Should have documented the user-vs-developer extensibility choice
- Lost widget subtitles in the UI refresh
- Adding new widget types requires touching `App.tsx` (could use dynamic discovery)
