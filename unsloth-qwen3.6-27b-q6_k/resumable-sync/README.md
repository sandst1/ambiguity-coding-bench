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

## Resumable sync

The script tracks progress in a `sync_checkpoints` table inside `issues.db`.
If interrupted (Ctrl-C, crash, network failure), simply re-run and it will
pick up where it left off:

- **Completed repos** are skipped entirely on re-run.
- **Partially synced repos** resume from the last completed page.
- **Comments** already fetched are skipped using a per-repo high-water mark.

To force a full re-sync of all repos:

```bash
python sync.py --reset
```

## Schema

See `init_db()` in `sync.py`. Tables: `issues`, `comments`, `sync_checkpoints`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
- Checkpoints are committed after each page, so at most one page of work
  is lost on interruption.
