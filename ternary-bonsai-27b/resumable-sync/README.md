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

The script uses unauthenticated GitHub API by default (60 req/hr rate limit). For real
runs, drop a token into `config.toml`.

## What it does

1. Reads `config.toml` for the list of repos to sync.
2. For each repo, paginates through `/issues?state=all` (oldest first).
3. For each issue, also fetches its comments.
4. Upserts everything into `issues.db`.

## Resumable sync

The script automatically resumes from where it left off if interrupted:
- Checkpoints are saved to `.checkpoints.json` after each page of issues
- On restart, it uses GitHub's `since` filter to only fetch newer issues
- Comments are only fetched for newly synced/updated issues

To force a fresh sync (ignore checkpoints), run:
```bash
python sync.py --force
```

## Schema

See `init_db()` in `sync.py`. Two tables: `issues` and `comments`.

## Notes

- We sort by `created` ascending so that pagination is stable as new issues
  appear during a run.
- Rate-limit handling sleeps until reset.
- HTTP errors retry with exponential backoff up to 5 attempts.
- Checkpoints are saved after each page, so interruptions mid-page are handled
  gracefully (with a 1-second buffer to catch any missed issues).
