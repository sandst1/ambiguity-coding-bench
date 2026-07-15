"""
GitHub issues sync (resumable).

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

Run with:
    python sync.py
    python sync.py --force   # ignore checkpoints, sync everything from scratch
"""
import argparse
import json
import logging
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

CONFIG_PATH = Path(__file__).parent / "config.toml"
DB_PATH = Path(__file__).parent / "issues.db"
CHECKPOINT_PATH = Path(__file__).parent / ".checkpoints.json"

logger = logging.getLogger("sync")


def load_config():
    with open(CONFIG_PATH, "rb") as f:
        return tomllib.load(f)


def setup_logging(level: str):
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def init_db(conn: sqlite3.Connection):
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY,
            number INTEGER NOT NULL,
            repo TEXT NOT NULL,
            title TEXT NOT NULL,
            state TEXT NOT NULL,
            user_login TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            closed_at TEXT,
            body TEXT,
            comments_count INTEGER NOT NULL DEFAULT 0,
            labels_json TEXT NOT NULL DEFAULT '[]',
            synced_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo);
        CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at);

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY,
            issue_id INTEGER NOT NULL,
            user_login TEXT,
            body TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (issue_id) REFERENCES issues(id)
        );

        CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
        """
    )
    conn.commit()


def request_with_retry(session: requests.Session, url: str, params: dict, max_retries: int = 5):
    """GET with exponential backoff on transient failures and rate limits."""
    backoff = 1.0
    last_err = None
    for attempt in range(max_retries):
        try:
            resp = session.get(url, params=params, timeout=30)
        except requests.RequestException as e:
            last_err = e
            logger.warning("Request failed (%s), retrying in %.1fs", e, backoff)
            time.sleep(backoff)
            backoff *= 2
            continue

        # Handle GitHub's secondary rate limiting
        if resp.status_code == 403 and "rate limit" in resp.text.lower():
            reset = int(resp.headers.get("X-RateLimit-Reset", "0"))
            wait = max(reset - int(time.time()), 1)
            logger.warning("Rate limited, sleeping %ds", wait)
            time.sleep(wait)
            continue

        if resp.status_code >= 500:
            logger.warning("Server error %d, retrying in %.1fs", resp.status_code, backoff)
            time.sleep(backoff)
            backoff *= 2
            continue

        resp.raise_for_status()
        return resp

    raise RuntimeError(f"Exhausted retries for {url}: {last_err}")


def upsert_issue(conn: sqlite3.Connection, repo: str, issue: dict):
    # GitHub's issues endpoint also returns PRs; skip those.
    if "pull_request" in issue:
        return False

    import json as mod_json
    conn.execute(
        """
        INSERT INTO issues (
            id, number, repo, title, state, user_login,
            created_at, updated_at, closed_at, body, comments_count,
            labels_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            state = excluded.state,
            updated_at = excluded.updated_at,
            closed_at = excluded.closed_at,
            body = excluded.body,
            comments_count = excluded.comments_count,
            labels_json = excluded.labels_json,
            synced_at = excluded.synced_at
        """,
        (
            issue["id"],
            issue["number"],
            repo,
            issue["title"],
            issue["state"],
            (issue.get("user") or {}).get("login"),
            issue["created_at"],
            issue["updated_at"],
            issue.get("closed_at"),
            issue.get("body"),
            issue.get("comments", 0),
            mod_json.dumps([l["name"] for l in issue.get("labels", [])]),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    return True


def upsert_comment(conn: sqlite3.Connection, issue_id: int, comment: dict):
    conn.execute(
        """
        INSERT INTO comments (id, issue_id, user_login, body, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            body = excluded.body,
            updated_at = excluded.updated_at
        """,
        (
            comment["id"],
            issue_id,
            (comment.get("user") or {}).get("login"),
            comment.get("body"),
            comment["created_at"],
            comment["updated_at"],
        ),
    )


def load_checkpoints() -> dict:
    """Load checkpoint state from file. Returns empty dict on first run."""
    if not CHECKPOINT_PATH.exists():
        return {}
    try:
        with open(CHECKPOINT_PATH) as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        logger.warning("Invalid checkpoint file, starting fresh")
        return {}


def save_checkpoints(checkpoints: dict):
    """Save checkpoint state to file."""
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump(checkpoints, f, indent=2)


def get_last_synced_issue_time(conn: sqlite3.Connection, repo: str) -> str | None:
    """Get the latest synced_at timestamp for a repo from the DB."""
    row = conn.execute(
        "SELECT MAX(synced_at) FROM issues WHERE repo = ?", (repo,)
    ).fetchone()
    return row[0] if row else None


def sync_issues(session: requests.Session, conn: sqlite3.Connection, repo: str, per_page: int, checkpoint: dict):
    """Fetch all issues for a repo and write them to the DB."""
    logger.info("Syncing issues for %s", repo)

    # Determine since timestamp for resumption
    last_synced = checkpoint.get(repo, {}).get("last_synced_updated_at")
    if not last_synced:
        last_synced = get_last_synced_issue_time(conn, repo)

    url = f"https://api.github.com/repos/{repo}/issues"
    page = 1
    total_issues = 0
    new_issues_count = 0

    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "sort": "created",
            "direction": "asc",
        }

        if last_synced:
            # Use a 1-second buffer to catch issues from interrupted pages
            last_synced_dt = datetime.fromisoformat(last_synced)
            since = (last_synced_dt - timedelta(seconds=1)).isoformat()
            params["since"] = since

        resp = request_with_retry(session, url, params)
        batch = resp.json()
        if not batch:
            break

        issue_count_in_page = 0
        newly_updated_issues = []

        for issue in batch:
            if upsert_issue(conn, repo, issue):
                issue_count_in_page += 1
                # Track issues that are newer than checkpoint for comment fetching
                if issue["updated_at"] > (last_synced or ""):
                    newly_updated_issues.append(issue)

        conn.commit()
        total_issues += issue_count_in_page
        new_issues_count += len(newly_updated_issues)
        logger.info("Page %d: %d issues synced (total so far: %d)", page, issue_count_in_page, total_issues)

        # Save checkpoint after each page so we can resume mid-sync
        if batch and issue_count_in_page > 0:
            last_issue = max(batch, key=lambda x: x["updated_at"])
            checkpoint[repo] = {
                "last_synced_updated_at": last_issue["updated_at"],
                "last_issue_id": last_issue["id"]
            }
            save_checkpoints(checkpoint)

        # Fetch comments only for newly updated issues
        for issue in newly_updated_issues:
            fetch_comments_for_issue(session, conn, issue)

        if len(batch) < per_page:
            break
        page += 1

    logger.info("Done with %s: %d issues synced (total: %d)", repo, new_issues_count, total_issues)


def fetch_comments_for_issue(session: requests.Session, conn: sqlite3.Connection, issue: dict):
    """Fetch all comments for a single issue."""
    url = issue["comments_url"]
    page = 1
    while True:
        resp = request_with_retry(session, url, {"per_page": 100, "page": page})
        batch = resp.json()
        if not batch:
            break
        for comment in batch:
            upsert_comment(conn, issue["id"], comment)
        if len(batch) < 100:
            break
        page += 1

    conn.commit()


def main():
    parser = argparse.ArgumentParser(description="Sync GitHub issues to local DB")
    parser.add_argument("--force", action="store_true", help="Force fresh sync, ignoring checkpoints")
    args = parser.parse_args()

    config = load_config()
    setup_logging(config.get("log_level", "INFO"))

    session = requests.Session()
    session.headers.update({
        "Accept": "application/vnd.github+json",
        "User-Agent": "issues-sync/0.2",
    })
    if token := config.get("github_token"):
        session.headers["Authorization"] = f"Bearer {token}"

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    checkpoint = {} if args.force else load_checkpoints()
    if args.force:
        logger.info("Forcing fresh sync (ignoring checkpoints)")

    try:
        for repo in config["repos"]:
            sync_issues(session, conn, repo, per_page=config.get("per_page", 100), checkpoint=checkpoint)
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        sys.exit(130)
    except Exception:
        logger.exception("Sync failed")
        sys.exit(1)
