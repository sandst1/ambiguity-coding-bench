# Review: Resumable Sync Implementation

**Task**: Make the sync resumable  
**Rubric**: 40 pts total

---

## Summary of Changes

The implementation adds checkpoint/resume capability by:

1. **New `sync_progress` table** in the schema with `repo`, `last_issue_id`, `comments_fetched`, and `synced_at` columns
2. **`get_progress()` / `update_progress()` functions** to read/write checkpoint state
3. **`skip_already_synced()` function** to skip issues with `id <= last_issue_id`
4. **Modified `sync_issues()`** to track `max_issue_id_in_page` and update progress after each page

README was not updated.

---

## Rubric Assessment

### Architectural judgment — 6/12 pts

**Picks the right granularity (2/4)**

The implementation tracks `last_issue_id` (per-issue), not page numbers. On resume, it re-fetches all pages from GitHub and skips issues locally via `skip_already_synced()`. This is inefficient:

- If interrupted on page 100 of 200, restart still fetches pages 1–100 from GitHub, just to skip them client-side
- Per-page checkpointing (storing the page number and resuming `?page=N`) would avoid the redundant API calls

The model didn't recognize per-page as the natural fit here. The existing code already commits per-page and sorts ascending by `created` for stable pagination—perfect alignment for per-page resume.

**Centralizes the checkpoint logic (3/4)**

State lives in one place (`sync_progress` table in `issues.db`), with dedicated functions. However:

- `skip_already_synced()` contains dead code (lines 213–216 do nothing)
- The `comments_fetched` field is written but never read meaningfully

**Handles the comments-per-issue subloop (1/4)**

The inner comment-fetch loop is not checkpointed. If a crash occurs mid-comment-fetch on a popular issue (thousands of comments), all that progress is lost. The model added a `comments_fetched` field but:

- It's set to `1` after every *page* of issues, not per-issue
- It's never used in any resume logic
- This suggests confusion about the nested loop problem

---

### Ambiguity-handling — 5/10 pts

**Names the ambiguity (0/4)**

No evidence—in code, comments, or README—that the model surfaced the per-page vs. per-record tradeoff. Silent pick.

**Doesn't conflate concerns (3/3)**

Good. Stays focused on crash recovery. No scope-creep into `since`-based incremental sync, CLI flags, or other features not asked for.

**Reasonable defaults (2/3)**

- State in same DB: ✓
- Per-repo cursors (config has 2 repos): ✓
- Commits after each page: ✓
- But the `comments_fetched` schema is poorly designed and unused

---

### Existing-code respect — 7.5/8 pts

**Reuses the SQLite connection / DB (3/3)**

Yes—adds `sync_progress` to `issues.db`. Single source of truth, transactional with data.

**Matches the existing style (1.5/2)**

Mostly yes—same logging idioms, function naming, import organization. Minor deduction for the confusing dead code in `skip_already_synced()`.

**Doesn't break what works (3/3)**

Preserved:
- Retry logic with exponential backoff
- Rate-limit handling (sleep until reset)
- Schema migration via `IF NOT EXISTS`

---

### Debugging / failure-mode reasoning — 3.5/6 pts

**Considers the partial-page crash case (1.5/3)**

The transactionality is off. The code now does:

```python
conn.commit()           # Line 259: commits page data
update_progress(...)    # Line 265: separate function that also commits
```

If a crash happens between these two commits, the page is written but progress isn't updated → that page gets re-processed on restart. Safe (due to upserts) but wasteful.

Correct pattern: update progress *inside* the page transaction, single commit for both.

**Considers schema drift (2/3)**

Uses `IF NOT EXISTS` for the new table. No version field for the state schema, but acceptable for this scope.

---

### Code quality — 2/4 pts

- Dead code in `skip_already_synced()` (the `if comments_done and last_id > 0:` block does nothing)
- `comments_fetched` field is vestigial—written but never read
- No documentation added to README explaining the resume mechanism
- No inline comment explaining the checkpoint strategy

---

## Total Score: 24/40

| Section | Max | Score |
|---------|-----|-------|
| Architectural judgment | 12 | 6 |
| Ambiguity-handling | 10 | 5 |
| Existing-code respect | 8 | 7.5 |
| Debugging/failure-mode reasoning | 6 | 3.5 |
| Code quality | 4 | 2 |
| **Total** | **40** | **24** |

---

## Tells Analysis

| Strong signal | Present? |
|---------------|----------|
| Writes resume state in a transaction with the page commits | ✗ (separate commits) |
| Stores state in `issues.db` itself | ✓ |
| Notes the per-page-vs-per-record tradeoff in writing | ✗ |
| Tracks per-repo cursors (config has 2 repos) | ✓ |
| Adds the resume info to the README | ✗ |
| Uses GitHub's `since` only if explicitly orthogonal | N/A (not used) |
| If asks a question, asks the right one | N/A (no questions asked) |

| Weak signal | Present? |
|-------------|----------|
| Just picks and codes (no tradeoff discussion) | ✓ |
| Single global cursor | ✗ (per-repo, good) |
| Silent diff (no README update) | ✓ |

---

## Qualitative Notes

The implementation *works*—it will skip already-synced issues on restart. But it's inefficient: still fetches all pages from GitHub just to skip them locally. A crash on page 100 of 200 means re-fetching pages 1–100 worth of API calls on restart.

The `comments_fetched` field suggests the model considered the nested loop problem but didn't follow through—the field is written but never read, and the `skip_already_synced()` function has a dead branch referencing it.

No documentation was added. A new developer reading the code would have to reverse-engineer the resume mechanism from the `sync_progress` table and scattered function calls.

---

## Would you merge this PR?

**Reluctantly yes**, with significant feedback:

1. The resume logic is inefficient—should use page-based resume to avoid redundant API calls
2. Dead code needs cleanup (`skip_already_synced` dead branch, unused `comments_fetched`)
3. The two-commit-per-page pattern should be fixed to single transaction
4. README needs documentation of the resume mechanism

The PR achieves the stated goal (resumability) but in a suboptimal way that a senior reviewer would push back on before merge.
