# issues-sync

Syncs GitHub issues into a local SQLite DB. Used by the analytics team for
their dashboards and notebooks.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python sync.py
```

The script uses unauthenticated GitHub API by default (60 req/hr). For real
runs, drop a token into `config.toml`.

## What it does

1. Reads `config.toml` for the list of repos to sync.
2. For each repo, paginates through `/issues?state=all` (oldest first).
3. For each issue, also fetches its comments.
4. Upserts everything into `issues.db`.

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.

## Resumability

The sync is resumable. Pagination progress is stored in the `sync_state` table
inside `issues.db` (last completed page + done flag) and committed in the same
transaction as the page data it describes. If the run is interrupted — Ctrl-C,
crash, host restart — the next run picks up from the last fully committed page
instead of starting over. Redoing the uncommitted tail of a page is safe because
upserts are idempotent.

Once a repo has been synced end-to-end, the next run starts a fresh scan so
issues created in the meantime are picked up.
