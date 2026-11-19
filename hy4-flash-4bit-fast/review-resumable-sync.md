# Review: Resumable Sync Implementation (`hy4-flash-4bit-fast`)

## Summary

The implementation adds a per-repository, per-page cursor in a new
`sync_progress` table in the existing SQLite database. Page data, comments,
and the cursor are committed together, so an interrupted page is rolled back
and safely replayed on restart. The implementation is focused, preserves the
original behavior, handles completed-run checkpoint cleanup correctly, and
documents its operational behavior well.

The main weaknesses are rubric-level reasoning gaps rather than core
correctness problems: it does not explain the per-page versus per-record
choice, it does not checkpoint the nested comment pagination or explicitly
justify that tradeoff, and it has no versioned migration strategy for future
changes to `sync_progress`.

## Scoring

### Architectural judgment — 10/12

#### Picks the right granularity — 4/4

The implementation checkpoints the next issue page after the current page and
all of its comments have been processed:

```python
if len(batch) < per_page:
    clear_progress(conn, repo)
else:
    save_progress(conn, repo, page + 1, per_page)
conn.commit()
```

This is the natural granularity for the existing program because its durable
write boundary was already one issue page. It avoids per-record state and
limits replay to the page that was in flight.

#### Centralizes checkpoint logic — 4/4

State has one obvious home: the `sync_progress` table in `issues.db`.
`get_resume_page()`, `save_progress()`, and `clear_progress()` centralize all
state access. The row is keyed by `repo`, which correctly supports the two
configured repositories independently. Persisting `per_page` also prevents a
cursor created under one page size from being misinterpreted under another.

#### Handles the comments-per-issue subloop — 2/4

The comment loop always starts at comment page 1 and has no inner checkpoint.
Because comments remain uncommitted until the enclosing issue page commits, a
crash while processing a heavily commented issue rolls back and re-fetches the
whole issue page, including all comment pages already fetched.

This is correct and idempotent, but it can still repeat substantial work. The
README says that an in-flight page is safe to redo, but it does not explicitly
argue why page-level replay is an acceptable tradeoff for the nested comment
loop. An inner cursor or a clear bounded-cost/idempotency rationale would earn
full credit.

### Ambiguity-handling — 7/10

#### Names the ambiguity — 1/4

The implementation silently chooses per-page checkpointing. The README
documents what happens, but does not discuss why per-page is preferable to
per-record state or how the nested comment pagination affected that decision.

#### Does not conflate concerns — 3/3

The change stays focused on crash recovery. It does not add incremental sync
through GitHub's `since` parameter, alter retry policy, or add unrelated CLI
features.

#### Reasonable defaults — 3/3

The defaults are sensible:

- state lives in the same database and transaction as synced data;
- cursors are scoped per repository;
- checkpoints advance once per fully processed issue page;
- completed runs clear their checkpoint so a later normal run performs a
  fresh full sync;
- changed `per_page` values invalidate old cursors safely.

### Existing-code respect — 8/8

#### Reuses the SQLite connection and database — 3/3

`sync_progress` is created through `init_db()` and uses the existing
connection. No sidecar state file can drift from `issues.db`.

#### Matches existing style — 2/2

The new helpers follow the existing snake_case function style, logging idioms,
SQLite parameter binding, and docstring conventions. The change remains small
and localized.

#### Does not break what works — 3/3

The original request retry and backoff behavior, rate-limit handling,
created-ascending pagination, PR filtering, idempotent upserts, and
`CREATE ... IF NOT EXISTS` schema setup are preserved. The terminal-page and
empty-page paths both clear progress, so a successfully completed run will not
remain stuck resuming beyond its old endpoint.

### Debugging and failure-mode reasoning — 4/6

#### Partial-page crash — 3/3

The transaction boundary is correct. SQLite starts the write transaction when
the page's first upsert runs; `save_progress()` only stages the cursor update,
and the single following `conn.commit()` makes page data, comments, and cursor
durable together. If the process exits before that commit, connection close or
process termination rolls back the page and leaves the previous cursor in
place. The README explicitly documents this behavior and the safe replay of an
in-flight page.

The final short page also clears its old checkpoint before the same commit,
which prevents a completed run from retaining stale resume state.

#### Schema drift — 1/3

`CREATE TABLE IF NOT EXISTS` supports upgrading a database that has no state
table, and the stored `per_page` value handles one important configuration
compatibility case. However, `IF NOT EXISTS` does not migrate an older
`sync_progress` table if columns or semantics change later. There is no schema
version, migration path, or validation of malformed cursor values.

### Code quality — 4/4

The checkpoint helpers are short and clearly named, logging distinguishes a
fresh run from a resumed run, and the README explains restart behavior,
checkpoint cleanup, transaction coupling, and page-size invalidation. The
implementation adds only the machinery needed for resumability.

## Total score: 33/40

- Architectural judgment: **10/12**
- Ambiguity-handling: **7/10**
- Existing-code respect: **8/8**
- Debugging / failure-mode reasoning: **4/6**
- Code quality: **4/4**

## Qualitative note

This is a strong, conservative implementation. Its best decision is coupling
the per-repo page cursor to the same commit as the issue and comment writes;
that gives it a clean recovery invariant without disturbing the original sync
flow. It also gets checkpoint lifecycle details right: a changed page size
starts over safely, and successful completion removes the cursor so future
runs still refresh the full repository. It stumbles mainly on making its
architectural reasoning explicit. In particular, a popular issue with many
comment pages can still cause significant replay, and the implementation
neither checkpoints that inner loop nor clearly accepts and explains the
tradeoff.

## Merge decision

**Yes, I would merge it.** The implementation correctly solves crash
resumption, is transactionally safe, and does not regress the original
behavior. As non-blocking follow-up feedback, I would ask for a short design
note explaining the per-page choice and why replaying the comment subloop is
acceptable, plus a schema-version or migration plan before the checkpoint
schema evolves.
