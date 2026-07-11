# Review: resumable-sync (unsloth-qwen3.6-27b-nvfp4)

## Summary of Changes

The model added a `checkpoints` table to the SQLite database and three helper functions (`_get_checkpoint`, `_save_checkpoint`, `_clear_checkpoint`) to track sync progress per-repo. On resume, it backs up one page as a safety margin. The checkpoint is cleared once a repo is fully synced.

**Key implementation details:**
- Per-page checkpointing (checkpoint stored as `next_page` after each page commits)
- Per-repo cursors (handles multiple repos in config correctly)
- State stored in the same `issues.db` database
- "Back up one page" strategy on resume to handle pagination drift

---

## Rubric Scores

### Architectural judgment — 10/12 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Picks the right granularity** | 4/4 | Per-page is exactly right. The model correctly identified that page-level checkpointing aligns with the existing commit granularity. |
| **Centralizes the checkpoint logic** | 4/4 | Clean separation: `checkpoints` table + three dedicated functions. Easy to understand where state lives. |
| **Handles the comments-per-issue subloop** | 2/4 | Does NOT checkpoint the inner comments loop. A crash mid-comment-fetch loses progress on that issue's comments. The model doesn't explicitly justify why this is acceptable (comments are idempotently upserted, inner loop is typically short). |

### Ambiguity-handling — 7/10 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Names the ambiguity** | 1/4 | **Weak signal.** The model just picked per-page and coded it. No written explanation of the per-page vs per-record tradeoff, no clarifying questions asked. |
| **Doesn't conflate concerns** | 3/3 | Stayed focused on crash recovery. No scope creep into `since`-based incremental sync, no CLI flags for reset/force, no retry policy changes. |
| **Reasonable defaults** | 3/3 | State in SQLite (single source of truth), per-page granularity, one-page backup margin on resume—all sensible choices. |

### Existing-code respect — 8/8 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Reuses the SQLite connection / DB** | 3/3 | **Strong signal.** Checkpoint table lives in `issues.db` alongside the data—transactional, no separate state file that could drift. |
| **Matches the existing style** | 2/2 | Same logging idioms, same `conn.execute()` patterns, leading-underscore convention for internal helpers, consistent naming. |
| **Doesn't break what works** | 3/3 | Retry logic, rate-limit handling, `IF NOT EXISTS` schema pattern—all preserved exactly. |

### Debugging / failure-mode reasoning — 3/6 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Considers the partial-page crash case** | 1/3 | **Bug.** The checkpoint is written *after* `conn.commit()` but not committed until the *next* page's `conn.commit()`. If you crash after committing page N's data but before processing page N+1, the checkpoint for page N isn't persisted. On restart you'd re-process page N (safe due to upserts, but wastes time). Proper fix: commit checkpoint in the same transaction as page data, or call `conn.commit()` again after `_save_checkpoint()`. |
| **Considers schema drift** | 2/3 | Uses `CREATE TABLE IF NOT EXISTS` for the new table, consistent with existing approach. No version field for future migrations, but acceptable given the simple schema. |

### Code quality — 2/4 pts

| Criterion | Score | Notes |
|-----------|-------|-------|
| Clarity, naming, comments | 2/4 | Function names are good (`_get_checkpoint`, etc.). Resume message in logs is helpful. **But**: README not updated to document the resume mechanism—new developer wouldn't know it exists. No inline comments explaining the checkpoint strategy. |

---

## Total Score: 30/40

| Section | Score |
|---------|-------|
| Architectural judgment | 10/12 |
| Ambiguity-handling | 7/10 |
| Existing-code respect | 8/8 |
| Debugging / failure-mode | 3/6 |
| Code quality | 2/4 |
| **Total** | **30/40** |

---

## Strong vs Weak Signals

| Signal | Present? |
|--------|----------|
| Writes resume state in same transaction as page commits | ❌ No—checkpoint written after commit, not atomic |
| Stores state in `issues.db` (not `state.json`) | ✅ Yes |
| Notes the per-page-vs-per-record tradeoff in writing | ❌ No |
| Tracks per-repo cursors | ✅ Yes |
| Adds resume info to README | ❌ No |
| Uses `since` only with explicit orthogonality explanation | N/A—didn't use `since` |
| If asks a question, asks the right one | N/A—didn't ask questions |

---

## Qualitative Notes

**What worked well:**
- Picked the right granularity (per-page) without over-engineering
- Clean helper function abstraction
- Correct per-repo tracking (config has 2 repos)
- Smart "back up one page" strategy handles pagination drift
- Respected existing code style perfectly

**Where it stumbled:**
- Silently picked an approach without discussing tradeoffs—no evidence of architectural reasoning
- Transaction boundary bug: checkpoint isn't atomic with page data
- Didn't document the new feature in README
- Didn't address the inner comments loop (acceptable but should have been acknowledged)

**Would you merge this PR?**
With reservations. The core approach is correct and the code is clean, but the transaction bug should be fixed before merging (easy fix: add `conn.commit()` after `_save_checkpoint()`). The lack of README update is a minor papercut. The silent design decision without documented reasoning is concerning for a production codebase—next maintainer won't understand why per-page was chosen over alternatives.
