"""
GitHub issues sync.

Pulls issues from a configured GitHub repo into a local SQLite DB so we can
run analytics against them without hammering the API every time.

Run with:
    python sync.py
"""
import logging
import sqlite3
import sys
import time
import tomllib
from datetime import datetime, timezone
from pathlib import Path

import requests

CONFIG_PATH = Path(__file__).parent / "config.toml"
DB_PATH = Path(__file__).parent / "issues.db"

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

        CREATE TABLE IF NOT EXISTS sync_progress (
            repo TEXT PRIMARY KEY,
            last_issue_id INTEGER NOT NULL,
            comments_fetched INTEGER NOT NULL DEFAULT 0,
            synced_at TEXT NOT NULL
        );
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

    import json
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
            json.dumps([l["name"] for l in issue.get("labels", [])]),
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


def get_progress(conn: sqlite3.Connection, repo: str) -> tuple[int, int]:
    """Return (last_issue_id, comments_fetched_flag) for repo."""
    cur = conn.execute(
        "SELECT last_issue_id, comments_fetched FROM sync_progress WHERE repo = ?", (repo,)
    )
    row = cur.fetchone()
    if row:
        return row[0], row[1]
    return 0, 0


def update_progress(conn: sqlite3.Connection, repo: str, issue_id: int, comments_fetched: int):
    """Update the sync progress for a repo."""
    conn.execute(
        """
        INSERT INTO sync_progress (repo, last_issue_id, comments_fetched, synced_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(repo) DO UPDATE SET
            last_issue_id = excluded.last_issue_id,
            comments_fetched = excluded.comments_fetched,
            synced_at = excluded.synced_at
        """,
        (repo, issue_id, comments_fetched, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()


def skip_already_synced(conn: sqlite3.Connection, repo: str, issue: dict) -> bool:
    """Return True if this issue has already been synced (and comments if applicable)."""
    last_id, comments_done = get_progress(conn, repo)
    issue_id = issue["id"]
    if issue_id <= last_id:
        # This issue was already processed in a previous run
        return True
    if comments_done and last_id > 0:
        # All comments for issues up to last_id were already fetched
        # Since we're only here for a new issue (id > last_id), its comments need to be fetched
        pass
    return False


def sync_issues(session: requests.Session, conn: sqlite3.Connection, repo: str, per_page: int):
    """Fetch all issues for a repo and write them to the DB, resuming from previous checkpoints."""
    logger.info("Syncing issues for %s", repo)
    url = f"https://api.github.com/repos/{repo}/issues"
    page = 1
    total_issues = 0
    last_issue_id, _ = get_progress(conn, repo)
    logger.info("Resuming from issue_id %d for %s", last_issue_id, repo)

    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "sort": "created",
            "direction": "asc",
        }
        resp = request_with_retry(session, url, params)
        batch = resp.json()
        if not batch:
            break

        issue_count_in_page = 0
        max_issue_id_in_page = 0

        for issue in batch:
            if skip_already_synced(conn, repo, issue):
                continue

            if upsert_issue(conn, repo, issue):
                issue_count_in_page += 1
                issue_id = issue["id"]
                if issue_id > max_issue_id_in_page:
                    max_issue_id_in_page = issue_id

                # If the issue has comments, fetch them too
                if issue.get("comments", 0) > 0:
                    fetch_comments_for_issue(session, conn, issue)

        conn.commit()
        total_issues += issue_count_in_page
        logger.info("Page %d: %d issues (total so far: %d)", page, issue_count_in_page, total_issues)

        # Update progress after each page
        if max_issue_id_in_page > 0:
            update_progress(conn, repo, max_issue_id_in_page, 1)

        if len(batch) < per_page:
            break
        page += 1

    logger.info("Done with %s: %d issues total", repo, total_issues)


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


def main():
    config = load_config()
    setup_logging(config.get("log_level", "INFO"))

    session = requests.Session()
    session.headers.update({
        "Accept": "application/vnd.github+json",
        "User-Agent": "issues-sync/0.1",
    })
    if token := config.get("github_token"):
        session.headers["Authorization"] = f"Bearer {token}"

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    try:
        for repo in config["repos"]:
            sync_issues(session, conn, repo, per_page=config.get("per_page", 100))
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
