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

## Resumability

The sync is designed to survive interruptions (host restarts, Ctrl-C, GitHub
API flakiness) without forcing a full re-run:

- Issues already present in `issues.db` are skipped, so a restarted sync
  continues from the first issue it has not synced yet instead of starting over.
- If an issue's comment count differs from the last sync, its comments are
  fetched again. Upserts are idempotent, so re-runs are safe.
- Each page is committed before the next one is fetched, so an interrupted run
  resumes cleanly at the page boundary.

To force a full re-sync, delete `issues.db` and run `python sync.py` again.

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
