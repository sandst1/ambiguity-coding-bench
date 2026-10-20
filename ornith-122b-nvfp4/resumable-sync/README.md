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

The sync is resumable. Progress is tracked per repo in a `sync_progress`
table inside `issues.db`, recording the last fully-processed page. If a run
is interrupted (host restart, Ctrl-C, unrecoverable API failure, etc.), just
run `python sync.py` again: it skips pages already completed and continues
from the next page, and never re-fetches comments for issues in those pages.

Progress is written in the same transaction as the page's issue/comment data,
so a page is only marked done once its data is durably committed — there's no
window for wasted redos or lost data.

To start a repo over from scratch, delete `issues.db` (progress lives in the
same file).

## Schema

See `init_db()` in `sync.py`. Three tables: `issues`, `comments`, and
`sync_progress` (per-repo page progress).

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run — and so that resuming by page number is safe, since
  earlier pages never gain new issues.
- Resuming assumes the same `per_page` value across runs. Changing `per_page`
  shifts page boundaries; restart that repo from scratch (delete `issues.db`)
  after changing it.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
