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

## Resuming an interrupted run

Progress is checkpointed in `issues.db` (table `sync_progress`), one row per
repo. After each page is fully fetched — issues and their comments — the
checkpoint and the data are committed together. If the run is interrupted by
Ctrl-C, a host restart, or an API failure that exhausts retries, just run
`python sync.py` again: each repo with a checkpoint resumes at the recorded
page instead of starting from page 1. Pages are re-fetched idempotently, so
re-doing the page that was in flight is harmless.

When a repo finishes successfully its checkpoint is removed, so the next
normal run does a fresh full sync and picks up edits to older issues. If
`per_page` changes between runs, existing checkpoints are ignored and that
repo starts over from page 1.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
