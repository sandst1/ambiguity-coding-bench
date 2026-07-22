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

The sync is resumable.  If it's interrupted (Ctrl-C, host restart, transient
GitHub failure), just re-run `python sync.py` and it will pick up where it
left off.

How it works:

- After each issue is fully processed (issue + comments written to the DB),
  a checkpoint is saved to the `sync_checkpoint` table recording the last
  issue number for that repo.
- On startup, if a checkpoint exists for a repo, the sync skips all issues
  with a number less than or equal to the checkpointed value and resumes
  from the next page.
- When a repo finishes syncing successfully, its checkpoint is cleared.
- `SIGINT` and `SIGTERM` are handled gracefully: the current issue is
  checkpointed before exit so nothing is lost.
- Comments are upserted idempotently, so if the sync is interrupted mid-issue
  (after the issue is stored but before comments are complete), the next run
  will re-fetch that issue's comments harmlessly.

To force a full re-sync of a repo, delete the checkpoint:

```sql
DELETE FROM sync_checkpoint WHERE repo = 'owner/repo';
```
