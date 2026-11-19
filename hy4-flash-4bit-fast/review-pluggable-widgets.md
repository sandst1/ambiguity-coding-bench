# Review: hy4-flash-4bit-fast — Pluggable Widgets (Task 2)

## Summary

This implementation delivers a solid pluggable widget system that addresses both end-user customization and developer extensibility. The architecture is clean, with proper separation between widget types and widget instances, a centralized registry, and consistent refactoring across all widgets.

---

## Scores by Rubric Dimension

### Architectural Judgment — 13/14 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Designs a Widget contract | 6/6 | Strong `WidgetDefinition` interface with explicit fields: `type`, `title`, `description`, `subtitle`, `span`, `Component`. This is exactly the right shape. |
| Picks a registration pattern | 4/4 | Single `registry.ts` with a `Map<string, WidgetDefinition>`, `registerWidget()`, `getWidget()`, and `listWidgets()`. One obvious place to find all widget types. |
| Separates type from instance | 3/4 | `WidgetDefinition` (catalog) vs `WidgetInstance` (placed) is correctly modeled. However, no per-instance settings support beyond `span` — instances can vary position and span but nothing else. |

**Analysis:**

The `WidgetDefinition` contract is well-designed:

```typescript
export interface WidgetDefinition {
  type: string;
  title: string;
  description: string;
  subtitle?: string;
  span: number;
  Component: ComponentType;
}
```

The registry pattern using a `Map` is clean and allows O(1) lookups. Registration order doubles as default layout order, which is a clever and practical choice.

The type/instance separation is correct but minimal — `WidgetInstance` only has `id`, `type`, and `span`. A more complete implementation would include a generic `settings: TSettings` field for per-instance configuration, but this scope choice is reasonable for a 30-minute task.

---

### Ambiguity-Handling — 8/10 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Names the user-vs-developer fork | 2/4 | Implementation delivers both user customization (add/remove/reorder with persistence) AND developer extensibility (registry pattern), but doesn't explicitly discuss the tradeoff or choice. |
| Picks scope appropriately | 3/3 | Well-scoped: drag-and-drop, add/remove, localStorage persistence without over-reaching into complex grid libraries or backend persistence. |
| Doesn't over-engineer | 3/3 | No JSON schema validators, no Zod, no plugin lifecycle hooks. Simple `Map` registry, plain localStorage. Cuts to what's useful. |

**Analysis:**

The implementation silently does both readings of "pluggable" — which is pragmatic but doesn't demonstrate explicit reasoning about the ambiguity. The README documents both features:

> Users can add widgets from the **+ Add widget** menu, remove them with the × button, and reorder them...

> ## Adding a widget type
> 1. Create a component in `src/components/widgets/`...

But it doesn't explain *why* both were chosen or acknowledge the tradeoff. A strong answer would note: "I interpreted 'pluggable' as needing both user customization and developer extensibility. Given 30 minutes, I prioritized X but designed Y to be easy to add."

---

### Existing-Code Respect — 8/8 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Doesn't rewrite gratuitously | 3/3 | All five widgets refactored consistently to render only their body. Data-fetching pattern (useEffect + setInterval) preserved exactly. |
| Preserves visual design | 2/2 | Same CSS variables (`--bg`, `--panel`, `--accent`, etc.), same widget chrome, same grid feel. New styles for toolbar/controls extend rather than replace. |
| Migrates layout state reasonably | 3/3 | `localStorage` under `ops-dashboard-layout`. Graceful handling of stale entries for unregistered types. |

**Analysis:**

The refactoring is surgical and consistent. Original widget:

```tsx
// Original StatsWidget
return (
  <div className="widget widget--stats">
    <div className="widget-header">...</div>
    <div className="widget-body">
      {data == null ? <span className="loading">Loading…</span> : (
        <div className="stat-grid">...</div>
      )}
    </div>
  </div>
);
```

Refactored widget:

```tsx
// New StatsWidget
if (data == null) return <span className="loading">Loading…</span>;
return <div className="stat-grid">...</div>;
```

The wrapper is now handled by `WidgetFrame`, which is exactly the right decomposition. The hardcoded `.widget--stats` etc. class names are replaced with dynamic `gridColumn: span ${instance.span}`, which is cleaner.

The `loadLayout()` function in `useDashboardLayout.ts` properly filters out stale entries:

```typescript
if (typeof type !== "string" || getWidget(type) == null) continue;
```

This prevents crashes if a widget type is removed in a future version.

---

### Frontend Craft — 4/4 pts

| Criterion | Notes |
|-----------|-------|
| TypeScript discipline | No `any` anywhere. Props properly typed with interfaces. |
| Hook usage | `useCallback` for stable handler references, `useEffect` for side effects and cleanup, `useState` for local state. |
| No React footguns | Effect dependencies correct, no infinite re-renders, keys provided on mapped elements. |

**Analysis:**

The drag-and-drop implementation is well-structured with explicit state management:

```typescript
const [drag, setDrag] = useState<DragState | null>(null);
```

The `DragState` type clearly models the dragging state:

```typescript
export interface DragState {
  id: string;
  overId: string | null;
}
```

Event handlers properly prevent default and use `dataTransfer` for drag data. The `AddWidgetMenu` correctly cleans up global event listeners on unmount.

---

### Code Quality — 4/4 pts

| Criterion | Notes |
|-----------|-------|
| File organization | Clear: `registry.ts` for types, `useDashboardLayout.ts` for state, `Dashboard.tsx` for orchestration, `WidgetFrame.tsx` for chrome, `AddWidgetMenu.tsx` for the picker. |
| Naming | Descriptive: `WidgetDefinition`, `WidgetInstance`, `addWidget`, `removeWidget`, `moveWidgetTo`. |
| Documentation | README updated with layout table, customization instructions, and "Adding a widget type" guide. |

**Adding a 6th widget** requires exactly:
1. One new file: `src/components/widgets/NewWidget.tsx`
2. One `registerWidget()` call in `registry.ts`

This matches the "strong signal" criterion: *"The 6th widget type is genuinely 1 file."*

---

## Total Score: 37/40

| Dimension | Score |
|-----------|-------|
| Architectural Judgment | 13/14 |
| Ambiguity-Handling | 8/10 |
| Existing-Code Respect | 8/8 |
| Frontend Craft | 4/4 |
| Code Quality | 4/4 |
| **Total** | **37/40** |

---

## Strong vs Weak Signals Checklist

| Signal | Present? |
|--------|----------|
| ✅ Defines `WidgetDefinition` type with explicit fields | Yes |
| ✅ One file lists all widget types (`registry.ts`) | Yes |
| ✅ Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | Yes |
| ⚠️ Per-widget settings shape is generic | No — only `span` varies per instance |
| ✅ If layout persists, uses `localStorage` | Yes (key: `ops-dashboard-layout`) |
| ⚠️ Versioned localStorage key | No — no version migration story |
| ❌ Calls out which fork (user vs dev) it picked and why | No — silent implementation of both |
| ✅ Refactors data-fetching consistently | Yes — all 5 widgets refactored identically |
| ✅ The 6th widget type is genuinely 1 file | Yes |

---

## Would I Merge This PR?

**Yes.** This is a clean, well-architected implementation that solves the stated problem. The main critique is the lack of explicit reasoning about the user-vs-developer ambiguity, but the code quality and architecture are solid enough that this is a minor documentation issue rather than a structural problem.

**What surprised me:** The implementation addressed both readings of "pluggable" without over-engineering either. The drag-and-drop is native HTML5 (no library), the state management is a simple hook, and the registry is a `Map`. This restraint is notable.

**Where it could improve:**
1. Add explicit commentary on the user-vs-developer tradeoff decision
2. Add versioning to the localStorage key for future migrations
3. Consider a generic `settings: TSettings` field for per-instance widget configuration

---

## Qualitative Notes

The implementation follows the "strong signal" pattern almost perfectly for architecture and existing-code respect. The main gap is in ambiguity-handling — specifically, not explicitly naming the fork between user extensibility and developer extensibility. The README documents both features but treats them as obvious rather than as a deliberate scoping choice.

The refactoring approach is commendable: rather than bolting on visibility/order props to existing components (a weak pattern), the model properly decomposed widgets into body-only components wrapped by a generic `WidgetFrame`. This is exactly the right architectural move.
