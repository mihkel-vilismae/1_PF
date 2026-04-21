import json
import math
import os
import sqlite3
import sys


MAX_PAGE_SIZE = 100
PREFERRED_TIMESTAMP_COLUMNS = (
    "updated_at",
    "occurred_at",
    "started_at",
    "ended_at",
    "created_at",
    "last_heartbeat_at",
    "lease_acquired_at",
    "lease_expires_at",
    "last_run",
)


def connect_read_only(path: str) -> sqlite3.Connection:
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def connect_read_write(path: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def describe_columns(cursor: sqlite3.Cursor, object_name: str) -> list[dict]:
    quoted_name = quote_identifier(object_name)
    column_rows = cursor.execute(f"PRAGMA table_info({quoted_name})").fetchall()
    return [
        {
            "cid": row[0],
            "name": row[1],
            "type": row[2] or "",
            "notNull": bool(row[3]),
            "defaultValue": row[4],
            "primaryKeyOrder": row[5],
        }
        for row in column_rows
    ]


def looks_like_timestamp_column(column: dict) -> bool:
    lower_name = column["name"].lower()
    lower_type = column["type"].lower()
    if lower_name in PREFERRED_TIMESTAMP_COLUMNS:
        return True
    if lower_name.endswith("_at"):
        return True
    if "timestamp" in lower_name:
        return True
    return "date" in lower_type or "time" in lower_type


def looks_like_integer_primary_key(column: dict) -> bool:
    if not column["primaryKeyOrder"]:
        return False
    lower_name = column["name"].lower()
    lower_type = column["type"].lower()
    return "int" in lower_type or lower_name == "id" or lower_name.endswith("_id")


def choose_ordering(object_kind: str, columns: list[dict]) -> dict:
    timestamp_columns = [
        column for column in columns if looks_like_timestamp_column(column)
    ]
    if timestamp_columns:
        timestamp_columns.sort(
            key=lambda column: (
                PREFERRED_TIMESTAMP_COLUMNS.index(column["name"].lower())
                if column["name"].lower() in PREFERRED_TIMESTAMP_COLUMNS
                else len(PREFERRED_TIMESTAMP_COLUMNS),
                column["name"].lower(),
            )
        )
        primary = timestamp_columns[0]
        sql_clause = f"{quote_identifier(primary['name'])} DESC"
        description = (
            f"Ordered by {primary['name']} descending because it looks like the clearest "
            "timestamp column."
        )
        if object_kind == "table":
            sql_clause += ", rowid DESC"
            description += " rowid DESC is used as a stable tie-breaker."
        return {
            "strategy": "timestamp",
            "column": primary["name"],
            "sqlClause": sql_clause,
            "description": description,
        }

    integer_primary_keys = [
        column for column in columns if looks_like_integer_primary_key(column)
    ]
    if integer_primary_keys:
        integer_primary_keys.sort(
            key=lambda column: (column["primaryKeyOrder"], column["name"].lower())
        )
        primary = integer_primary_keys[0]
        return {
            "strategy": "integer_primary_key",
            "column": primary["name"],
            "sqlClause": f"{quote_identifier(primary['name'])} DESC",
            "description": (
                f"Ordered by {primary['name']} descending because it is the clearest integer "
                "primary-key-style column."
            ),
        }

    if object_kind == "table":
        return {
            "strategy": "rowid",
            "column": "rowid",
            "sqlClause": "rowid DESC",
            "description": (
                "Ordered by rowid descending because no timestamp or integer primary key "
                "column was found."
            ),
        }

    if columns:
        primary = columns[0]
        return {
            "strategy": "first_column",
            "column": primary["name"],
            "sqlClause": f"{quote_identifier(primary['name'])} DESC",
            "description": (
                f"Ordered by {primary['name']} descending as a best-effort heuristic because "
                "this object does not expose a timestamp, integer primary key, or rowid path."
            ),
        }

    return {
        "strategy": "none",
        "column": None,
        "sqlClause": "",
        "description": "No ordering clause was applied because the object exposes no columns.",
    }


def normalize_cell(value):
    if isinstance(value, bytes):
        return f"<{len(value)} bytes>"
    return value


def inspect_database(path: str) -> dict:
    connection = connect_read_only(path)
    try:
        cursor = connection.cursor()
        tables = []
        rows = cursor.execute(
            """
            SELECT name, type, sql
            FROM sqlite_master
            WHERE type IN ('table', 'view')
              AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            """
        ).fetchall()
        for name, kind, sql in rows:
            columns = describe_columns(cursor, name)
            tables.append(
                {
                    "name": name,
                    "kind": kind,
                    "columnCount": len(columns),
                    "columns": [column["name"] for column in columns],
                    "columnDetails": columns,
                    "sql": sql,
                }
            )

        page_count = cursor.execute("PRAGMA page_count").fetchone()[0]
        page_size = cursor.execute("PRAGMA page_size").fetchone()[0]
        user_version = cursor.execute("PRAGMA user_version").fetchone()[0]

        return {
            "tableCount": len(tables),
            "tables": tables,
            "sqlite": {
                "pageCount": page_count,
                "pageSize": page_size,
                "userVersion": user_version,
            },
        }
    finally:
        connection.close()


def fetch_table_rows(path: str, object_name: str, page: int, page_size: int) -> dict:
    normalized_page = max(0, int(page))
    normalized_page_size = max(1, min(MAX_PAGE_SIZE, int(page_size)))
    offset = normalized_page * normalized_page_size

    connection = connect_read_only(path)
    try:
        cursor = connection.cursor()
        object_row = cursor.execute(
            """
            SELECT name, type
            FROM sqlite_master
            WHERE type IN ('table', 'view')
              AND name NOT LIKE 'sqlite_%'
              AND name = ?
            """,
            (object_name,),
        ).fetchone()

        if object_row is None:
            raise ValueError(f"Table or view does not exist: {object_name}")

        resolved_name = object_row["name"]
        object_kind = object_row["type"]
        quoted_name = quote_identifier(resolved_name)
        columns = describe_columns(cursor, resolved_name)
        ordering = choose_ordering(object_kind, columns)

        count_query = f"SELECT COUNT(*) FROM {quoted_name}"
        total_rows = cursor.execute(count_query).fetchone()[0]

        query_summary = f"SELECT * FROM {quoted_name}"
        if ordering["sqlClause"]:
            query_summary = f"{query_summary} ORDER BY {ordering['sqlClause']}"
        query_summary = f"{query_summary} LIMIT {normalized_page_size} OFFSET {offset}"

        rows_query = f"SELECT * FROM {quoted_name}"
        if ordering["sqlClause"]:
            rows_query = f"{rows_query} ORDER BY {ordering['sqlClause']}"
        rows_query = f"{rows_query} LIMIT ? OFFSET ?"

        result_cursor = cursor.execute(rows_query, (normalized_page_size, offset))
        row_objects = [
            {key: normalize_cell(row[key]) for key in row.keys()}
            for row in result_cursor.fetchall()
        ]
        column_names = [description[0] for description in (result_cursor.description or [])]
        page_count = math.ceil(total_rows / normalized_page_size) if total_rows else 0

        return {
            "table": {
                "name": resolved_name,
                "kind": object_kind,
                "columns": column_names,
                "columnDetails": columns,
                "rows": row_objects,
                "rowCount": len(row_objects),
                "totalRows": total_rows,
                "page": normalized_page,
                "pageSize": normalized_page_size,
                "pageCount": page_count,
                "hasPreviousPage": normalized_page > 0,
                "hasNextPage": offset + len(row_objects) < total_rows,
                "offset": offset,
                "ordering": {
                    "strategy": ordering["strategy"],
                    "column": ordering["column"],
                    "description": ordering["description"],
                },
                "querySummary": query_summary,
            }
        }
    finally:
        connection.close()


def recreate_empty_database(path: str) -> dict:
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    connection = sqlite3.connect(path)
    try:
        connection.execute("PRAGMA user_version = 0")
        connection.commit()
    finally:
        connection.close()

    size_bytes = os.path.getsize(path) if os.path.exists(path) else 0
    return {
        "path": path,
        "exists": os.path.exists(path),
        "sizeBytes": size_bytes,
    }


def prepare_slideshow_queue(path: str, executed_at: str) -> dict:
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        eligible_count = cursor.execute(
            """
            SELECT COUNT(*)
            FROM canonical_media_assets
            WHERE geocode_status = 'GEOCODE_FOUND'
              AND address_text IS NOT NULL
              AND TRIM(address_text) <> ''
            """
        ).fetchone()[0]

        changes_before = connection.total_changes
        cursor.execute(
            """
            INSERT INTO slideshow_queue (
                media_asset_id,
                status,
                failure_reason,
                sort_bucket,
                eligible_since,
                created_at,
                updated_at
            )
            SELECT
                c.media_asset_id,
                'READY',
                NULL,
                'default',
                ?,
                ?,
                ?
            FROM canonical_media_assets c
            LEFT JOIN slideshow_queue q ON q.media_asset_id = c.media_asset_id
            WHERE c.geocode_status = 'GEOCODE_FOUND'
              AND c.address_text IS NOT NULL
              AND TRIM(c.address_text) <> ''
              AND q.media_asset_id IS NULL
            """,
            (executed_at, executed_at, executed_at),
        )
        inserted_count = connection.total_changes - changes_before
        connection.commit()

        ready_count = cursor.execute(
            "SELECT COUNT(*) FROM slideshow_queue WHERE status = 'READY'"
        ).fetchone()[0]
        failed_count = cursor.execute(
            "SELECT COUNT(*) FROM slideshow_queue WHERE status = 'FAILED'"
        ).fetchone()[0]

        return {
            "outcome": "prepared",
            "eligibleCount": eligible_count,
            "insertedCount": inserted_count,
            "readyCount": ready_count,
            "failedCount": failed_count,
            "executedAt": executed_at,
        }
    finally:
        connection.close()


def resolve_canonical_path(raw_path: str | None, repo_root: str) -> str | None:
    if raw_path is None:
        return None
    normalized = raw_path.strip()
    if not normalized:
        return None
    if os.path.isabs(normalized):
        return normalized
    return os.path.abspath(os.path.join(repo_root, normalized))


def select_current_item(path: str, executed_at: str, repo_root: str) -> dict:
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        cursor.execute("BEGIN IMMEDIATE")
        ready_candidates = cursor.execute(
            """
            SELECT
                q.slideshow_queue_id,
                q.media_asset_id,
                q.view_count,
                q.last_shown_datetime,
                c.canonical_path,
                c.address_text
            FROM slideshow_queue q
            LEFT JOIN canonical_media_assets c
                ON c.media_asset_id = q.media_asset_id
            WHERE q.status = 'READY'
            ORDER BY
                CASE WHEN q.last_shown_datetime IS NULL THEN 0 ELSE 1 END ASC,
                q.last_shown_datetime ASC,
                q.view_count ASC,
                q.slideshow_queue_id ASC
            """
        ).fetchall()

        if not ready_candidates:
            connection.commit()
            return {
                "outcome": "no_ready_row",
                "failedCandidateCount": 0,
                "selected": None,
                "executedAt": executed_at,
            }

        failed_reasons: list[dict] = []
        selected = None

        for candidate in ready_candidates:
            reason = None
            address_text = (candidate["address_text"] or "").strip()
            resolved_path = resolve_canonical_path(candidate["canonical_path"], repo_root)
            if resolved_path is None:
                reason = "canonical_path_missing"
            elif address_text == "":
                reason = "empty_address_text"
            elif not os.path.exists(resolved_path):
                reason = "canonical_file_missing"

            if reason:
                cursor.execute(
                    """
                    UPDATE slideshow_queue
                    SET status = 'FAILED',
                        failure_reason = ?,
                        updated_at = ?
                    WHERE slideshow_queue_id = ?
                    """,
                    (reason, executed_at, candidate["slideshow_queue_id"]),
                )
                failed_reasons.append(
                    {
                        "slideshowQueueId": candidate["slideshow_queue_id"],
                        "mediaAssetId": candidate["media_asset_id"],
                        "reason": reason,
                    }
                )
                continue

            cursor.execute(
                """
                UPDATE slideshow_queue
                SET view_count = view_count + 1,
                    last_shown_datetime = ?,
                    updated_at = ?,
                    failure_reason = NULL
                WHERE slideshow_queue_id = ?
                """,
                (executed_at, executed_at, candidate["slideshow_queue_id"]),
            )
            cursor.execute(
                """
                INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
                VALUES ('current_media_asset_id', ?, 'text', ?, 'stage6_run_playback')
                ON CONFLICT(state_key) DO UPDATE SET
                    state_value = excluded.state_value,
                    value_type = excluded.value_type,
                    updated_at = excluded.updated_at,
                    updated_by = excluded.updated_by
                """,
                (str(candidate["media_asset_id"]), executed_at),
            )
            selected = {
                "slideshowQueueId": candidate["slideshow_queue_id"],
                "mediaAssetId": candidate["media_asset_id"],
                "canonicalPath": candidate["canonical_path"],
                "resolvedCanonicalPath": resolved_path,
                "addressText": address_text,
                "selectedAt": executed_at,
            }
            break

        connection.commit()
        if selected is None:
            return {
                "outcome": "no_playable_ready_row",
                "failedCandidateCount": len(failed_reasons),
                "failedCandidates": failed_reasons,
                "selected": None,
                "executedAt": executed_at,
            }

        return {
            "outcome": "selected",
            "failedCandidateCount": len(failed_reasons),
            "failedCandidates": failed_reasons,
            "selected": selected,
            "executedAt": executed_at,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def main() -> int:
    if len(sys.argv) < 3:
        raise ValueError(
            "Expected usage: sqlite_admin.py <inspect|recreate|rows|stage5_prepare_queue|stage6_select_current> <path> [args]"
        )

    operation = sys.argv[1]
    path = os.path.abspath(sys.argv[2])

    if operation == "inspect":
        if len(sys.argv) != 3:
            raise ValueError("inspect expects: sqlite_admin.py inspect <path>")
        result = inspect_database(path)
    elif operation == "recreate":
        if len(sys.argv) != 3:
            raise ValueError("recreate expects: sqlite_admin.py recreate <path>")
        result = recreate_empty_database(path)
    elif operation == "rows":
        if len(sys.argv) != 6:
            raise ValueError("rows expects: sqlite_admin.py rows <path> <table_name> <page> <page_size>")
        result = fetch_table_rows(path, sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
    elif operation == "stage5_prepare_queue":
        if len(sys.argv) != 4:
            raise ValueError("stage5_prepare_queue expects: sqlite_admin.py stage5_prepare_queue <path> <executed_at>")
        result = prepare_slideshow_queue(path, sys.argv[3])
    elif operation == "stage6_select_current":
        if len(sys.argv) != 5:
            raise ValueError("stage6_select_current expects: sqlite_admin.py stage6_select_current <path> <executed_at> <repo_root>")
        result = select_current_item(path, sys.argv[3], os.path.abspath(sys.argv[4]))
    else:
        raise ValueError(f"Unsupported operation: {operation}")

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        raise
