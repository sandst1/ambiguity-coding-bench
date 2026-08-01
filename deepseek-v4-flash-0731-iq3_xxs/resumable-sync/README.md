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

See `init_db()` in `sync.py`. Three tables: `issues`, `comments`, and
`sync_state` (tracks resumability, see below).

## Resumable

The sync records the last fully-processed page per repo in the `sync_state`
table, committing it atomically with that page's data. If a run is interrupted
(host restart, Ctrl-C, or a GitHub failure the retry can't recover from),
restarting the script resumes each repo at the next page instead of starting
over.

- Pages are sorted by `created` ascending, which is stable: `created_at` is
  immutable, so new issues only appear at the end and already-synced pages
  don't shift.
- When a repo's sync completes cleanly the bookmark is cleared, so an ordinary
  run is still a full sync of current data. Only an *interrupted* run resumes.
- If a run stops mid-page, that page's work was not committed, so it is
  simply re-processed on the next run (upserts are idempotent).

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
