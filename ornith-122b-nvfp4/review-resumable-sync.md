# Task 1 review: resumable sync

## Score

### Architectural judgment — 9/12

- **Granularity — 4/4:** Uses a per-page checkpoint, which matches the existing page-level commit boundary.
- **Centralization — 4/4:** Stores one checkpoint per repository in the existing SQLite database via the clearly named `sync_progress` table and `get_last_page()`.
- **Comments subloop — 1/4:** Comment writes participate in the outer issue-page transaction, so interruption does not corrupt committed data. However, comment pages have no checkpoint of their own and the implementation does not discuss that tradeoff. A failure late in the comments for a popular issue repeats that issue's comments and all earlier work on the issue page.

### Ambiguity handling — 7/10

- **Names the ambiguity — 2/4:** The README clearly states that page-level progress was chosen, but it does not identify or weigh page-level versus record-level or comment-page-level checkpointing.
- **Doesn't conflate concerns — 3/3:** The change stays focused on crash recovery; it does not introduce `since`, new retry behavior, or unrelated CLI features.
- **Reasonable defaults — 2/3:** Per-repository state in `issues.db` is a sensible default. The checkpoint does not record `per_page`, though, and its completed-run lifecycle is unsafe.

### Existing-code respect — 8/8

- **Reuses SQLite — 3/3:** Progress is kept in the same database and transaction as synchronized data.
- **Matches style — 2/2:** Naming, logging, imports, and SQL style fit the original script.
- **Preserves working behavior — 3/3:** Existing retries, rate-limit handling, upserts, and `IF NOT EXISTS` schema setup remain intact.

### Debugging and failure-mode reasoning — 4/6

- **Partial-page crash — 3/3:** Issue data, comment data, and the page checkpoint are committed atomically. Closing the connection after an exception rolls back the incomplete page.
- **Schema drift — 1/3:** `CREATE TABLE IF NOT EXISTS` supports first-time migration, but there is no state version or migration strategy. A changed `per_page` value makes the stored cursor invalid and is only handled by documentation telling the user to delete the entire database.

### Code quality — 3/4

The implementation is compact, readable, and documented. Some documentation overstates safety: sorting by creation time does not make a partially filled final page immutable across later runs, and deleting `issues.db` to restart one repository also destroys all synchronized data and every repository's progress. No automated tests cover interruption, resumption, or completed-run behavior.

## Total — 31/40

## Blocking finding

The checkpoint is never cleared when a sync completes. Consequently every later invocation is treated as a continuation of the old run instead of a new sync:

1. Suppose `per_page = 100` and the initial run finishes with 20 records on page 3. The code stores `last_page = 3`.
2. New issues are then appended to page 3.
3. The next invocation starts at page 4, so those issues are never fetched.

The same behavior prevents later runs from refreshing changed issue state, bodies, labels, and comments on all previously checkpointed pages. A focused mocked run reproduced this: the first run requested pages 1 and 2, the second requested only page 3, and a new issue added to the now-expanded page 2 was absent from SQLite.

Completion needs an explicit lifecycle. For example, treat the row as an in-progress checkpoint and remove it when the terminal page is committed, in the same transaction as that page. The checkpoint should also include invariants that affect pagination, at least `per_page`, so incompatible state can be rejected or reset safely.

## Qualitative note

This is a strong, minimal choice of storage and commit boundary, and it preserves the original code unusually well. The main stumble is not distinguishing “resume an interrupted run” from “start a later sync.” That omission creates silent data loss after an apparently successful run, which outweighs the otherwise sound transactional design. The nested comment loop is safe but only resumable at the coarser issue-page boundary.

## Merge decision

**Would not merge yet.** Clear or finalize checkpoints correctly after successful completion, validate pagination settings, and add regression tests for interruption plus a second run after a partially filled final page.
