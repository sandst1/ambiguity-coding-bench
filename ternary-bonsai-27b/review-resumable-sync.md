# Review: ternary-bonsai-27b resumable-sync

## Summary

The implementation adds resumability via GitHub's `since` parameter and a JSON checkpoint file, but conflates incremental sync with crash recovery and stores state outside the SQLite database.

**Total Score: 17.5/40**

---

## Architectural Judgment — 5/12

### Picks the right granularity — 1.5/4

The implementation uses GitHub's `since` parameter based on `updated_at` timestamps rather than true per-page checkpointing. This conflates **incremental sync** (fetching only new/updated issues) with **crash recovery** (resuming from where we left off).

From the rubric:
> Use GitHub's `since` parameter: incremental sync by `updated_at`. A *different* feature (incremental refresh, not crash recovery) but a model may conflate them.

The checkpoint stores `last_synced_updated_at` after each page, but this is used to set `since`, not to track page position. If a crash occurs mid-page, the 1-second buffer tries to catch missed issues, but this is a workaround rather than a principled solution.

### Centralizes the checkpoint logic — 2/4

Checkpoint logic is centralized in `load_checkpoints()` and `save_checkpoints()` functions with a clear `CHECKPOINT_PATH`. However, state lives in a **separate JSON file** (`.checkpoints.json`) rather than in the SQLite database.

The rubric explicitly marks this as a weak signal:
> Creates `state.json` next to the script — weak signal

This introduces drift risk: the checkpoint file can get out of sync with the database state.

### Handles the comments-per-issue subloop — 1.5/4

The inner comment-fetching loop is **not checkpointed**. If a crash occurs while fetching comments for a large issue, all progress on that issue's comments is lost.

The implementation does add `conn.commit()` at the end of `fetch_comments_for_issue()` (line 285), which is an improvement. However, there's no reasoning provided for why the inner loop doesn't need checkpointing.

---

## Ambiguity-handling — 4/10

### Names the ambiguity — 1/4

The model **silently picked** an approach without surfacing the per-page vs per-record tradeoff. Neither the code comments nor the README explain why timestamp-based `since` was chosen over page-number tracking or per-record checkpointing.

### Doesn't conflate concerns — 1/3

The implementation **conflates** crash recovery with incremental sync by using `since`. It also adds a `--force` CLI flag that wasn't requested — minor scope creep.

### Reasonable defaults — 2/3

- The 1-second buffer for `since` is a reasonable hedge
- `.checkpoints.json` is a sensible filename
- Per-repo checkpoint tracking is good (handles multiple repos in config)

---

## Existing-code Respect — 4/8

### Reuses the SQLite connection / DB — 1/3

State goes into a **separate JSON file**, not into the same SQLite database. This is explicitly marked as worse in the rubric:

> Does state go into the same DB (good — one source of truth, transactional with the data writes) or into a separate JSON file (worse — can drift)?

A `sync_state` table in `issues.db` would have been transactional with the data writes.

### Matches the existing style — 1.5/2

- Logging idioms preserved ✓
- Import organization mostly preserved ✓
- Naming conventions followed ✓
- Odd: renamed `import json` to `import json as mod_json` inside `upsert_issue()` (line 118)

### Doesn't break what works — 1.5/3

- Retry logic preserved ✓
- Rate-limit handling preserved ✓
- Schema migration via `IF NOT EXISTS` preserved ✓

**Critical bug:** The `tomllib` import is **missing** from the file header. Line 31 calls `tomllib.load(f)` but `tomllib` is never imported. The code will fail with `NameError: name 'tomllib' is not defined`.

```python
# Line 31 references tomllib, but it's not imported
def load_config():
    with open(CONFIG_PATH, "rb") as f:
        return tomllib.load(f)  # NameError!
```

---

## Debugging / Failure-mode Reasoning — 2.5/6

### Considers the partial-page crash case — 1.5/3

The implementation commits after each page (`conn.commit()` at line 245), which is good. However:

- There's no explicit transaction wrapping page processing
- Issues are inserted one-by-one without a transaction, so a crash mid-page leaves partial data
- The 1-second `since` buffer is mentioned but is a workaround, not a principled solution

### Considers schema drift — 1/3

The checkpoint JSON has **no version field**. If the checkpoint schema changes in a future version, old checkpoints could cause silent failures or incorrect behavior.

---

## Code Quality — 2/4

**Positive:**
- README updated with clear resume documentation
- Function names are clear (`load_checkpoints`, `save_checkpoints`)
- Added `--force` flag is well-documented

**Negative:**
- Missing `tomllib` import is a blocking bug
- The `import json as mod_json` rename inside the function is awkward
- No inline comments explaining the `since` approach vs alternatives

---

## Strong vs Weak Signals (from rubric)

| Criteria | This Implementation |
|----------|---------------------|
| Writes resume state in transaction with page commits | ❌ Writes to separate JSON file |
| Stores state in `issues.db` itself | ❌ Creates `.checkpoints.json` |
| Notes the per-page-vs-per-record tradeoff | ❌ Silent pick |
| Tracks per-repo cursors | ✅ Yes, keyed by repo name |
| Adds resume info to README | ✅ Yes |
| Uses `since` with clear explanation as orthogonal | ❌ Uses `since` as primary mechanism, conflates it |

---

## Would I Merge This PR?

**No.** 

1. The code has a blocking bug (missing `tomllib` import)
2. The architectural choice conflates incremental sync with crash recovery
3. Storing state outside the database creates drift risk

After fixing the import bug, this would be a **qualified merge** with a follow-up to migrate checkpoints into SQLite.

---

## Score Breakdown

| Section | Score |
|---------|-------|
| Architectural judgment | 5/12 |
| Ambiguity-handling | 4/10 |
| Existing-code respect | 4/8 |
| Debugging/failure-mode reasoning | 2.5/6 |
| Code quality | 2/4 |
| **Total** | **17.5/40** |
