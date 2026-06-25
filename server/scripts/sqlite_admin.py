# Backend SQLite administration and media pipeline worker entrypoint.
# Provides schema inspection and queued worker operations for PhotoFrame.
# GPS/geocode worker stages delegate provider-specific work to media_pipeline modules.

import json
import math
import os
import sqlite3
import sys
import hashlib
from datetime import datetime


from media_pipeline.geocode_placeholder_provider import (
    build_address_cache_key as provider_build_address_cache_key,
    build_placeholder_address as provider_build_placeholder_address,
)
from media_pipeline.geocode_provider_registry import default_reverse_geocode_providers
from media_pipeline.gps_exif_provider import (
    convert_gps_coordinate as provider_convert_gps_coordinate,
    default_gps_providers,
    extract_exif_gps_from_file,
)
from media_pipeline.provider_chain import run_gps_provider_chain, run_reverse_geocode_provider_chain
from media_pipeline.provider_contracts import (
    GPS_PROVIDER_STATUS_NO_RESULT,
    GPS_PROVIDER_STATUS_SUCCEEDED,
    GEOCODE_PROVIDER_STATUS_SUCCEEDED,
    GpsProviderInput,
    ReverseGeocodeInput,
)


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
IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".tif",
    ".tiff",
    ".heic",
    ".heif",
}
VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".m4v",
    ".avi",
    ".mkv",
    ".webm",
    ".wmv",
    ".mpeg",
    ".mpg",
}
CANONICAL_REQUIRED_TABLES = (
    "canonical_media_assets",
    "media_asset_variants",
    "address_cache",
    "parse_files_for_gps_queue",
    "geocode_queue",
    "slideshow_queue",
    "runtime_state",
    "action_runs",
    "system_logs",
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


def recreate_empty_database(path: str, schema_path: str | None = None) -> dict:
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    connection = sqlite3.connect(path)
    try:
        connection.execute("PRAGMA user_version = 0")
        connection.commit()
    finally:
        connection.close()

    result = {
        "path": path,
        "exists": os.path.exists(path),
        "sizeBytes": os.path.getsize(path) if os.path.exists(path) else 0,
    }
    if schema_path is not None:
        schema_bootstrap = ensure_canonical_schema(path, schema_path, CANONICAL_REQUIRED_TABLES)
        result["schemaBootstrap"] = schema_bootstrap
        result["sizeBytes"] = os.path.getsize(path) if os.path.exists(path) else 0
    return result


def classify_media_type(file_path: str) -> str | None:
    extension = os.path.splitext(file_path)[1].lower()
    if extension in IMAGE_EXTENSIONS:
        return "image"
    if extension in VIDEO_EXTENSIONS:
        return "video"
    return None


def collect_media_files(download_dir: str) -> list[str]:
    if not os.path.isdir(download_dir):
        return []

    media_files: list[str] = []
    for root, _, files in os.walk(download_dir):
        for file_name in files:
            candidate = os.path.join(root, file_name)
            if classify_media_type(candidate) is not None:
                media_files.append(os.path.abspath(candidate))
    media_files.sort()
    return media_files


def compute_file_sha1(file_path: str) -> str:
    digest = hashlib.sha1()
    with open(file_path, "rb") as handle:
        while True:
            chunk = handle.read(65536)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def build_asset_key(file_path: str, file_size_bytes: int, modified_ns: int) -> str:
    normalized = os.path.abspath(file_path)
    raw = f"{normalized}|{file_size_bytes}|{modified_ns}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()


def ensure_canonical_schema(path: str, schema_path: str, required_tables: tuple[str, ...] | None = None) -> dict:
    resolved_schema_path = os.path.abspath(schema_path)
    if not os.path.exists(resolved_schema_path):
        raise FileNotFoundError(f"Schema bootstrap file does not exist: {resolved_schema_path}")

    with open(resolved_schema_path, "r", encoding="utf-8") as handle:
        schema_sql = handle.read()

    normalized_required_tables = required_tables or (
        "canonical_media_assets",
        "media_asset_variants",
        "parse_files_for_gps_queue",
    )

    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        cursor.executescript(schema_sql)
        missing_tables = [
            table_name
            for table_name in normalized_required_tables
            if cursor.execute(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
                (table_name,),
            ).fetchone() is None
        ]
        if missing_tables:
            raise RuntimeError(
                "Schema bootstrap completed but required table(s) are still missing: "
                + ", ".join(missing_tables)
            )
        connection.commit()
        return {
            "schemaPath": resolved_schema_path,
            "applied": True,
            "requiredTables": list(normalized_required_tables),
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def stage2_index_register(path: str, download_dir: str, indexed_at: str, schema_path: str) -> dict:
    schema_bootstrap = ensure_canonical_schema(path, schema_path)
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        media_files = collect_media_files(download_dir)
        scanned_count = len(media_files)
        inserted_canonical = 0
        updated_canonical = 0
        inserted_variants = 0
        inserted_gps_queue = 0

        for file_path in media_files:
            media_type = classify_media_type(file_path)
            if media_type is None:
                continue

            file_stats = os.stat(file_path)
            file_size_bytes = int(file_stats.st_size)
            extension = os.path.splitext(file_path)[1].lower().lstrip(".") or None
            captured_at = datetime.utcfromtimestamp(file_stats.st_mtime).replace(microsecond=0).isoformat() + "Z"
            content_hash = compute_file_sha1(file_path)
            asset_key = build_asset_key(file_path, file_size_bytes, int(file_stats.st_mtime_ns))
            original_filename = os.path.basename(file_path)
            canonical_path = os.path.abspath(file_path)

            existing_asset = cursor.execute(
                "SELECT media_asset_id FROM canonical_media_assets WHERE asset_key = ?",
                (asset_key,),
            ).fetchone()

            if existing_asset is None:
                cursor.execute(
                    """
                    INSERT INTO canonical_media_assets (
                        asset_key,
                        original_filename,
                        canonical_path,
                        media_type,
                        file_extension,
                        file_size_bytes,
                        content_hash,
                        captured_at,
                        gps_status,
                        geocode_status,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'GPS_PENDING', 'GEOCODE_PENDING', ?, ?)
                    """,
                    (
                        asset_key,
                        original_filename,
                        canonical_path,
                        media_type,
                        extension,
                        file_size_bytes,
                        content_hash,
                        captured_at,
                        indexed_at,
                        indexed_at,
                    ),
                )
                media_asset_id = cursor.lastrowid
                inserted_canonical += 1
            else:
                media_asset_id = int(existing_asset["media_asset_id"])
                cursor.execute(
                    """
                    UPDATE canonical_media_assets
                    SET original_filename = ?,
                        canonical_path = ?,
                        media_type = ?,
                        file_extension = ?,
                        file_size_bytes = ?,
                        content_hash = ?,
                        captured_at = ?,
                        updated_at = ?
                    WHERE media_asset_id = ?
                    """,
                    (
                        original_filename,
                        canonical_path,
                        media_type,
                        extension,
                        file_size_bytes,
                        content_hash,
                        captured_at,
                        indexed_at,
                        media_asset_id,
                    ),
                )
                updated_canonical += 1

            cursor.execute(
                """
                INSERT OR IGNORE INTO media_asset_variants (
                    media_asset_id,
                    variant_kind,
                    file_path,
                    file_extension,
                    file_size_bytes,
                    created_at,
                    updated_at
                ) VALUES (?, 'original', ?, ?, ?, ?, ?)
                """,
                (
                    media_asset_id,
                    canonical_path,
                    extension,
                    file_size_bytes,
                    indexed_at,
                    indexed_at,
                ),
            )
            if cursor.rowcount == 1:
                inserted_variants += 1

            cursor.execute(
                """
                INSERT OR IGNORE INTO parse_files_for_gps_queue (
                    media_asset_id,
                    status,
                    attempt_count,
                    created_at,
                    updated_at
                ) VALUES (?, 'PENDING', 0, ?, ?)
                """,
                (media_asset_id, indexed_at, indexed_at),
            )
            if cursor.rowcount == 1:
                inserted_gps_queue += 1

        connection.commit()
        return {
            "outcome": "indexed",
            "downloadDir": os.path.abspath(download_dir),
            "scannedMediaCount": scanned_count,
            "insertedCanonicalCount": inserted_canonical,
            "updatedCanonicalCount": updated_canonical,
            "insertedVariantCount": inserted_variants,
            "insertedGpsQueueCount": inserted_gps_queue,
            "indexedAt": indexed_at,
            "schemaBootstrap": schema_bootstrap,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def convert_gps_coordinate(parts: tuple[float, float, float], ref: str) -> float:
    """Preserves the existing public GPS coordinate conversion helper."""

    return provider_convert_gps_coordinate(parts, ref)


def extract_exif_gps(file_path: str) -> dict | None:
    """Preserves the existing EXIF GPS helper by delegating to the provider."""

    return extract_exif_gps_from_file(file_path)


def build_address_cache_key(latitude: float, longitude: float) -> tuple[str, float, float]:
    """Preserves the existing geocode cache-key helper shape."""

    return provider_build_address_cache_key(latitude, longitude)


def build_placeholder_address(latitude: float, longitude: float) -> str:
    """Preserves the existing placeholder geocode helper shape."""

    return provider_build_placeholder_address(latitude, longitude)


def stage3_process_gps_queue(path: str, executed_at: str, schema_path: str) -> dict:
    """Processes queued GPS work by running configured GPS providers in order."""

    schema_bootstrap = ensure_canonical_schema(
        path,
        schema_path,
        (
            "canonical_media_assets",
            "parse_files_for_gps_queue",
            "geocode_queue",
            "address_cache",
        ),
    )
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        queue_rows = cursor.execute(
            """
            SELECT q.gps_queue_id, q.media_asset_id, q.attempt_count, c.canonical_path
            FROM parse_files_for_gps_queue q
            INNER JOIN canonical_media_assets c ON c.media_asset_id = q.media_asset_id
            WHERE q.status IN ('PENDING', 'RETRY')
            ORDER BY q.gps_queue_id ASC
            """
        ).fetchall()

        processed_count = 0
        success_count = 0
        failure_count = 0
        inserted_geocode_queue_count = 0

        for row in queue_rows:
            processed_count += 1
            next_attempt_count = int(row["attempt_count"] or 0) + 1
            canonical_path = row["canonical_path"]
            media_asset_id = int(row["media_asset_id"])
            gps_queue_id = int(row["gps_queue_id"])

            cursor.execute(
                """
                UPDATE parse_files_for_gps_queue
                SET status = 'PROCESSING', attempt_count = ?, processing_started_at = ?, updated_at = ?
                WHERE gps_queue_id = ?
                """,
                (next_attempt_count, executed_at, executed_at, gps_queue_id),
            )

            gps_data = None
            failure_code = None
            failure_message = None
            if canonical_path is None or not os.path.exists(canonical_path):
                failure_code = "canonical_file_missing"
                failure_message = f"Canonical media file does not exist: {canonical_path}"
            else:
                gps_result = run_gps_provider_chain(
                    GpsProviderInput(canonical_path=canonical_path),
                    default_gps_providers(),
                )
                if gps_result.status == GPS_PROVIDER_STATUS_SUCCEEDED:
                    gps_data = {
                        "latitude": gps_result.latitude,
                        "longitude": gps_result.longitude,
                        "altitude": gps_result.altitude,
                        "parserMethod": gps_result.parser_method,
                    }
                else:
                    if gps_result.status == GPS_PROVIDER_STATUS_NO_RESULT:
                        failure_code = "gps_not_found"
                        failure_message = "No GPS coordinates were found in the media asset."
                    else:
                        failure_code = gps_result.failure_code or "gps_not_found"
                        failure_message = gps_result.message or "No GPS coordinates were found in the media asset."

            if gps_data is None:
                failure_count += 1
                cursor.execute(
                    """
                    UPDATE canonical_media_assets
                    SET gps_status = 'GPS_NOT_FOUND', successful_gps_parser_method = NULL, updated_at = ?
                    WHERE media_asset_id = ?
                    """,
                    (executed_at, media_asset_id),
                )
                cursor.execute(
                    """
                    UPDATE parse_files_for_gps_queue
                    SET status = 'NO_GPS_FOUND', processing_finished_at = ?, successful_parser_method = NULL,
                        failure_code = ?, failure_message = ?, updated_at = ?
                    WHERE gps_queue_id = ?
                    """,
                    (executed_at, failure_code, failure_message, executed_at, gps_queue_id),
                )
                continue

            success_count += 1
            cursor.execute(
                """
                UPDATE canonical_media_assets
                SET gps_latitude = ?, gps_longitude = ?, gps_altitude = ?, gps_status = 'GPS_FOUND',
                    successful_gps_parser_method = ?, updated_at = ?
                WHERE media_asset_id = ?
                """,
                (gps_data["latitude"], gps_data["longitude"], gps_data["altitude"], gps_data["parserMethod"], executed_at, media_asset_id),
            )
            cursor.execute(
                """
                UPDATE parse_files_for_gps_queue
                SET status = 'COMPLETED', processing_finished_at = ?, successful_parser_method = ?,
                    failure_code = NULL, failure_message = NULL, updated_at = ?
                WHERE gps_queue_id = ?
                """,
                (executed_at, gps_data["parserMethod"], executed_at, gps_queue_id),
            )
            cursor.execute(
                """
                INSERT OR IGNORE INTO geocode_queue (media_asset_id, status, attempt_count, created_at, updated_at)
                VALUES (?, 'PENDING', 0, ?, ?)
                """,
                (media_asset_id, executed_at, executed_at),
            )
            if cursor.rowcount == 1:
                inserted_geocode_queue_count += 1

        connection.commit()
        return {
            "outcome": "processed",
            "processedCount": processed_count,
            "successCount": success_count,
            "failureCount": failure_count,
            "insertedGeocodeQueueCount": inserted_geocode_queue_count,
            "executedAt": executed_at,
            "schemaBootstrap": schema_bootstrap,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def stage4_process_geocode_queue(path: str, executed_at: str, schema_path: str) -> dict:
    """Processes queued geocode work through the reverse-geocode provider chain."""

    schema_bootstrap = ensure_canonical_schema(
        path,
        schema_path,
        (
            "canonical_media_assets",
            "parse_files_for_gps_queue",
            "geocode_queue",
            "address_cache",
        ),
    )
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        queue_rows = cursor.execute(
            """
            SELECT q.geocode_queue_id, q.media_asset_id, q.attempt_count, c.gps_latitude, c.gps_longitude
            FROM geocode_queue q
            INNER JOIN canonical_media_assets c ON c.media_asset_id = q.media_asset_id
            WHERE q.status IN ('PENDING', 'RETRY')
            ORDER BY q.geocode_queue_id ASC
            """
        ).fetchall()

        processed_count = 0
        success_count = 0
        failure_count = 0
        inserted_cache_count = 0

        for row in queue_rows:
            processed_count += 1
            next_attempt_count = int(row["attempt_count"] or 0) + 1
            geocode_queue_id = int(row["geocode_queue_id"])
            media_asset_id = int(row["media_asset_id"])
            latitude = row["gps_latitude"]
            longitude = row["gps_longitude"]

            cursor.execute(
                """
                UPDATE geocode_queue
                SET status = 'PROCESSING', attempt_count = ?, processing_started_at = ?, updated_at = ?
                WHERE geocode_queue_id = ?
                """,
                (next_attempt_count, executed_at, executed_at, geocode_queue_id),
            )

            if latitude is None or longitude is None:
                failure_count += 1
                cursor.execute(
                    """
                    UPDATE canonical_media_assets
                    SET geocode_status = 'GEOCODE_FAILED', updated_at = ?
                    WHERE media_asset_id = ?
                    """,
                    (executed_at, media_asset_id),
                )
                cursor.execute(
                    """
                    UPDATE geocode_queue
                    SET status = 'RETRY_EXHAUSTED', processing_finished_at = ?, geocode_provider = ?,
                        failure_code = 'gps_missing', failure_message = 'Cannot geocode because GPS coordinates are missing.',
                        updated_at = ?
                    WHERE geocode_queue_id = ?
                    """,
                    (executed_at, "deterministic_placeholder", executed_at, geocode_queue_id),
                )
                continue

            geocode_result = run_reverse_geocode_provider_chain(
                ReverseGeocodeInput(latitude=float(latitude), longitude=float(longitude), language_code="en"),
                default_reverse_geocode_providers(connection),
            )
            provider_name = geocode_result.provider_id
            if geocode_result.status != GEOCODE_PROVIDER_STATUS_SUCCEEDED:
                failure_count += 1
                cursor.execute(
                    """
                    UPDATE canonical_media_assets
                    SET geocode_status = 'GEOCODE_FAILED', updated_at = ?
                    WHERE media_asset_id = ?
                    """,
                    (executed_at, media_asset_id),
                )
                cursor.execute(
                    """
                    UPDATE geocode_queue
                    SET status = 'RETRY_EXHAUSTED', processing_finished_at = ?, geocode_provider = ?,
                        failure_code = ?, failure_message = ?, updated_at = ?
                    WHERE geocode_queue_id = ?
                    """,
                    (
                        executed_at,
                        provider_name,
                        geocode_result.failure_code or "geocode_not_found",
                        geocode_result.message or "No address was resolved for the coordinate pair.",
                        executed_at,
                        geocode_queue_id,
                    ),
                )
                continue

            cache_key = geocode_result.address_cache_key
            rounded_latitude = geocode_result.rounded_latitude
            rounded_longitude = geocode_result.rounded_longitude
            address_text = geocode_result.address_text
            changes_before = connection.total_changes
            cursor.execute(
                """
                INSERT OR IGNORE INTO address_cache (
                    address_cache_key, rounded_latitude, rounded_longitude, address_text, provider_name,
                    provider_response_json, language_code, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cache_key, rounded_latitude, rounded_longitude, address_text, provider_name,
                    json.dumps(geocode_result.provider_response), geocode_result.language_code, executed_at, executed_at,
                ),
            )
            if connection.total_changes > changes_before:
                inserted_cache_count += 1

            cursor.execute(
                """
                UPDATE canonical_media_assets
                SET address_text = ?, address_cache_key = ?, geocode_status = 'GEOCODE_FOUND', updated_at = ?
                WHERE media_asset_id = ?
                """,
                (address_text, cache_key, executed_at, media_asset_id),
            )
            cursor.execute(
                """
                UPDATE geocode_queue
                SET status = 'COMPLETED', processing_finished_at = ?, geocode_provider = ?,
                    failure_code = NULL, failure_message = NULL, updated_at = ?
                WHERE geocode_queue_id = ?
                """,
                (executed_at, provider_name, executed_at, geocode_queue_id),
            )
            success_count += 1

        connection.commit()
        return {
            "outcome": "processed",
            "processedCount": processed_count,
            "successCount": success_count,
            "failureCount": failure_count,
            "insertedAddressCacheCount": inserted_cache_count,
            "executedAt": executed_at,
            "schemaBootstrap": schema_bootstrap,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Stage 5 prepares slideshow rows for playable assets with a usable variant.
# Missing GPS, geocode, or address text must not block queue preparation here.
# Independent exclusions stay in place for missing variants, empty paths, and duplicates.
def prepare_slideshow_queue(path: str, executed_at: str, schema_path: str) -> dict:
    schema_bootstrap = ensure_canonical_schema(
        path,
        schema_path,
        (
            "canonical_media_assets",
            "media_asset_variants",
            "slideshow_queue",
        ),
    )
    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        candidate_rows = cursor.execute(
            """
            SELECT
                c.media_asset_id,
                COALESCE(v.file_path, '') AS variant_file_path,
                q.media_asset_id AS queued_media_asset_id
            FROM canonical_media_assets c
            LEFT JOIN media_asset_variants v
                ON v.media_asset_id = c.media_asset_id
               AND v.variant_id = (
                    SELECT MIN(v2.variant_id)
                    FROM media_asset_variants v2
                    WHERE v2.media_asset_id = c.media_asset_id
               )
            LEFT JOIN slideshow_queue q ON q.media_asset_id = c.media_asset_id
            ORDER BY c.media_asset_id ASC
            """
        ).fetchall()

        inserted_ids: list[int] = []
        skipped: list[dict] = []

        # Stage 5 eligibility contract is intentionally strict and derived from
        # repo evidence plus Stage 6 expectations. Insert a slideshow row only
        # when the asset exists canonically, has at least one media variant, the
        # chosen variant has a non-empty usable file path, and the asset is not
        # already queued.
        for row in candidate_rows:
            asset_id = int(row["media_asset_id"])
            variant_file_path = (row["variant_file_path"] or "").strip()
            already_queued = row["queued_media_asset_id"] is not None

            reason = None
            if not asset_id:
                reason = "invalid_asset_state"
            elif variant_file_path == "":
                variant_exists = cursor.execute(
                    "SELECT 1 FROM media_asset_variants WHERE media_asset_id = ? LIMIT 1",
                    (asset_id,),
                ).fetchone() is not None
                reason = "missing_file_path" if variant_exists else "missing_variant"
            elif already_queued:
                reason = "already_queued"

            if reason is not None:
                skipped.append({"asset_id": str(asset_id), "reason": reason})
                continue

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
                ) VALUES (?, 'READY', NULL, 'default', ?, ?, ?)
                """,
                (asset_id, executed_at, executed_at, executed_at),
            )
            inserted_ids.append(asset_id)

        connection.commit()
        return {
            "outcome": "prepared",
            "insertedCount": len(inserted_ids),
            "skippedCount": len(skipped),
            "insertedIds": inserted_ids,
            "skipped": skipped,
            "message": (
                f"Inserted {len(inserted_ids)} eligible slideshow queue row(s); "
                f"skipped {len(skipped)} asset(s)."
            ),
            "schemaBootstrap": schema_bootstrap,
            "executedAt": executed_at,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def seed_live_windows_native_video_fixture(path: str, fixture_relative_path: str, repo_root: str, executed_at: str, schema_path: str) -> dict:
    """Seed one deterministic generated_test_data video as the proof-only current READY item."""
    normalized_fixture = (fixture_relative_path or "").replace("\\", "/").strip().lstrip("/")
    if not normalized_fixture.startswith("generated_test_data/"):
        raise ValueError("proof video fixture must be under generated_test_data")

    fixture_path = os.path.abspath(os.path.join(repo_root, normalized_fixture))
    generated_root = os.path.abspath(os.path.join(repo_root, "generated_test_data"))
    if not (fixture_path == generated_root or fixture_path.startswith(generated_root + os.sep)):
        raise ValueError("proof video fixture resolved outside generated_test_data")
    if classify_media_type(fixture_path) != "video":
        raise ValueError("proof video fixture must be a supported video file")
    if not os.path.isfile(fixture_path):
        raise FileNotFoundError(f"proof video fixture does not exist: {fixture_path}")

    schema_bootstrap = ensure_canonical_schema(
        path,
        schema_path,
        (
            "canonical_media_assets",
            "media_asset_variants",
            "slideshow_queue",
            "runtime_state",
        ),
    )
    file_stats = os.stat(fixture_path)
    file_size_bytes = int(file_stats.st_size)
    extension = os.path.splitext(fixture_path)[1].lower().lstrip(".") or None
    content_hash = compute_file_sha1(fixture_path)
    original_filename = os.path.basename(fixture_path)
    asset_key = "proof-live-windows-native-video:" + normalized_fixture
    has_gps = "/videos_with_gps/" in ("/" + normalized_fixture)
    latitude = 59.437 if has_gps else None
    longitude = 24.7536 if has_gps else None
    address_text = "Proof fixture video location: Tallinn" if has_gps else "Proof fixture video: no GPS metadata"

    connection = connect_read_write(path)
    try:
        cursor = connection.cursor()
        cursor.execute("BEGIN IMMEDIATE")
        existing = cursor.execute(
            "SELECT media_asset_id FROM canonical_media_assets WHERE asset_key = ?",
            (asset_key,),
        ).fetchone()
        if existing is None:
            cursor.execute(
                """
                INSERT INTO canonical_media_assets (
                    asset_key, original_filename, canonical_path, media_type, file_extension,
                    file_size_bytes, content_hash, captured_at, gps_latitude, gps_longitude,
                    gps_altitude, gps_status, geocode_status, address_text, address_cache_key,
                    successful_gps_parser_method, created_at, updated_at
                ) VALUES (?, ?, ?, 'video', ?, ?, ?, ?, ?, ?, NULL, ?, 'GEOCODE_FOUND', ?, NULL, ?, ?, ?)
                """,
                (
                    asset_key,
                    original_filename,
                    normalized_fixture,
                    extension,
                    file_size_bytes,
                    content_hash,
                    executed_at,
                    latitude,
                    longitude,
                    "GPS_FOUND" if has_gps else "GPS_NOT_FOUND",
                    address_text,
                    "generated-test-data-proof-fixture",
                    executed_at,
                    executed_at,
                ),
            )
            media_asset_id = int(cursor.lastrowid)
            asset_action = "inserted"
        else:
            media_asset_id = int(existing["media_asset_id"])
            cursor.execute(
                """
                UPDATE canonical_media_assets
                SET original_filename = ?,
                    canonical_path = ?,
                    media_type = 'video',
                    file_extension = ?,
                    file_size_bytes = ?,
                    content_hash = ?,
                    gps_latitude = ?,
                    gps_longitude = ?,
                    gps_status = ?,
                    geocode_status = 'GEOCODE_FOUND',
                    address_text = ?,
                    successful_gps_parser_method = ?,
                    updated_at = ?
                WHERE media_asset_id = ?
                """,
                (
                    original_filename,
                    normalized_fixture,
                    extension,
                    file_size_bytes,
                    content_hash,
                    latitude,
                    longitude,
                    "GPS_FOUND" if has_gps else "GPS_NOT_FOUND",
                    address_text,
                    "generated-test-data-proof-fixture",
                    executed_at,
                    media_asset_id,
                ),
            )
            asset_action = "updated"

        cursor.execute(
            """
            INSERT INTO media_asset_variants (
                media_asset_id, variant_kind, file_path, file_extension, file_size_bytes,
                width_px, height_px, duration_ms, checksum, created_at, updated_at
            ) VALUES (?, 'original', ?, ?, ?, 640, 360, 2000, ?, ?, ?)
            ON CONFLICT(media_asset_id, variant_kind, file_path) DO UPDATE SET
                file_extension = excluded.file_extension,
                file_size_bytes = excluded.file_size_bytes,
                width_px = excluded.width_px,
                height_px = excluded.height_px,
                duration_ms = excluded.duration_ms,
                checksum = excluded.checksum,
                updated_at = excluded.updated_at
            """,
            (media_asset_id, normalized_fixture, extension, file_size_bytes, content_hash, executed_at, executed_at),
        )

        demoted_rows = cursor.execute(
            """
            UPDATE slideshow_queue
            SET last_shown_datetime = COALESCE(last_shown_datetime, ?),
                view_count = CASE WHEN view_count < 1 THEN 1 ELSE view_count END,
                updated_at = ?
            WHERE status = 'READY'
              AND media_asset_id != ?
            """,
            (executed_at, executed_at, media_asset_id),
        ).rowcount

        queue_row = cursor.execute(
            "SELECT slideshow_queue_id FROM slideshow_queue WHERE media_asset_id = ?",
            (media_asset_id,),
        ).fetchone()
        if queue_row is None:
            cursor.execute(
                """
                INSERT INTO slideshow_queue (
                    media_asset_id, status, failure_reason, sort_bucket, eligible_since,
                    last_shown_datetime, view_count, created_at, updated_at
                ) VALUES (?, 'READY', NULL, 'proof-live-windows-native-video', ?, NULL, 0, ?, ?)
                """,
                (media_asset_id, executed_at, executed_at, executed_at),
            )
            slideshow_queue_id = int(cursor.lastrowid)
            queue_action = "inserted"
        else:
            slideshow_queue_id = int(queue_row["slideshow_queue_id"])
            cursor.execute(
                """
                UPDATE slideshow_queue
                SET status = 'READY',
                    failure_reason = NULL,
                    sort_bucket = 'proof-live-windows-native-video',
                    eligible_since = ?,
                    last_shown_datetime = NULL,
                    view_count = 0,
                    updated_at = ?
                WHERE slideshow_queue_id = ?
                """,
                (executed_at, executed_at, slideshow_queue_id),
            )
            queue_action = "updated"

        cursor.execute(
            """
            INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
            VALUES ('current_media_asset_id', ?, 'text', ?, 'live_windows_native_video_proof_seed')
            ON CONFLICT(state_key) DO UPDATE SET
                state_value = excluded.state_value,
                value_type = excluded.value_type,
                updated_at = excluded.updated_at,
                updated_by = excluded.updated_by
            """,
            (str(media_asset_id), executed_at),
        )
        connection.commit()
        return {
            "status": "ok",
            "proofOnly": True,
            "fixtureRelativePath": normalized_fixture,
            "mediaAssetId": media_asset_id,
            "slideshowQueueId": slideshow_queue_id,
            "assetAction": asset_action,
            "queueAction": queue_action,
            "demotedReadyRows": demoted_rows,
            "mediaType": "video",
            "fileExtension": extension,
            "fileSizeBytes": file_size_bytes,
            "sha1": content_hash,
            "hasGpsLikeLocation": has_gps,
            "schemaBootstrap": schema_bootstrap,
            "executedAt": executed_at,
        }
    except Exception:
        connection.rollback()
        raise
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




def resolve_playback_contract_item(row: sqlite3.Row, current_media_asset_id: str | None) -> dict:
    media_asset_id = row["media_asset_id"]
    media_asset_id_text = str(media_asset_id)
    display_name = (row["original_filename"] or row["asset_key"] or f"media-{media_asset_id}").strip()
    address_text = (row["address_text"] or "").strip()
    media_type = (row["media_type"] or "media").strip().lower()
    return {
        "mediaAssetId": media_asset_id,
        "slideshowQueueId": row["slideshow_queue_id"],
        "displayName": display_name,
        "mediaType": media_type,
        "queueStatus": row["queue_status"],
        "resolvedAddress": address_text or "Address pending until GPS/geocode stages produce a resolved address.",
        "hasResolvedAddress": bool(address_text),
        "capturedAt": row["captured_at"],
        "lastShownAt": row["last_shown_datetime"],
        "viewCount": row["view_count"],
        "fileExtension": row["file_extension"],
        "gpsStatus": row["gps_status"],
        "geocodeStatus": row["geocode_status"],
        "isCurrent": current_media_asset_id == media_asset_id_text,
        "displayUrl": f"/api/runtime/playback/media?assetId={media_asset_id}",
    }


def fetch_current_media_asset_id(connection: sqlite3.Connection) -> str | None:
    try:
        row = connection.execute(
            "SELECT state_value FROM runtime_state WHERE state_key = 'current_media_asset_id' LIMIT 1"
        ).fetchone()
    except sqlite3.OperationalError as e:
        if "no such table" in str(e).lower():
            return None
        raise
    if row is None or row["state_value"] is None:
        return None
    value = str(row["state_value"]).strip()
    return value or None


def playback_queue_counts(connection: sqlite3.Connection) -> dict:
    try:
        rows = connection.execute(
            "SELECT status, COUNT(*) AS row_count FROM slideshow_queue GROUP BY status"
        ).fetchall()
    except sqlite3.OperationalError as e:
        if "no such table" in str(e).lower():
            return {"totalCount": 0, "readyCount": 0, "failedCount": 0}
        raise

    counts = {"totalCount": 0, "readyCount": 0, "failedCount": 0}
    for row in rows:
        count = int(row["row_count"] or 0)
        counts["totalCount"] += count
        if row["status"] == "READY":
            counts["readyCount"] += count
        elif row["status"] == "FAILED":
            counts["failedCount"] += count
    return counts


def fetch_playback_queue_items(connection: sqlite3.Connection, limit: int) -> list[sqlite3.Row]:
    try:
        return connection.execute(
            """
            SELECT
                q.slideshow_queue_id,
                q.media_asset_id,
                q.status AS queue_status,
                q.failure_reason,
                q.last_shown_datetime,
                q.view_count,
                q.eligible_since,
                c.asset_key,
                c.original_filename,
                c.canonical_path,
                c.media_type,
                c.file_extension,
                c.captured_at,
                c.address_text,
                c.gps_status,
                c.geocode_status
            FROM slideshow_queue q
            JOIN canonical_media_assets c
                ON c.media_asset_id = q.media_asset_id
            ORDER BY
                CASE WHEN q.status = 'READY' THEN 0 ELSE 1 END ASC,
                CASE WHEN q.last_shown_datetime IS NULL THEN 0 ELSE 1 END ASC,
                q.last_shown_datetime ASC,
                q.view_count ASC,
                q.slideshow_queue_id ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    except sqlite3.OperationalError as e:
        if "no such table" in str(e).lower():
            return []
        raise


def playback_contract(path: str, repo_root: str, limit: int = 25) -> dict:
    connection = connect_read_only(path)
    try:
        current_media_asset_id = fetch_current_media_asset_id(connection)
        rows = fetch_playback_queue_items(connection, limit)
        items = [resolve_playback_contract_item(row, current_media_asset_id) for row in rows]
        current_item = next((item for item in items if item["isCurrent"]), None)
        next_item = next((item for item in items if item["queueStatus"] == "READY"), None)
        return {
            "currentMediaAssetId": current_media_asset_id,
            "currentItem": current_item,
            "nextItem": next_item,
            "items": items,
            "queue": {
                **playback_queue_counts(connection),
                "returnedCount": len(items),
                "limit": limit,
            },
        }
    finally:
        connection.close()


def playback_asset_media_path(path: str, media_asset_id: str, repo_root: str) -> dict:
    normalized_asset_id = str(media_asset_id or "").strip()
    if not normalized_asset_id.isdigit():
        raise ValueError("media_asset_id must be numeric")

    connection = connect_read_only(path)
    try:
        row = connection.execute(
            """
            SELECT
                c.media_asset_id,
                c.canonical_path,
                c.media_type,
                c.file_extension,
                v.file_path AS variant_path
            FROM canonical_media_assets c
            LEFT JOIN media_asset_variants v
                ON v.media_asset_id = c.media_asset_id
               AND v.variant_kind = 'original'
            WHERE c.media_asset_id = ?
            ORDER BY v.variant_id ASC
            LIMIT 1
            """,
            (int(normalized_asset_id),),
        ).fetchone()
        if row is None:
            return {"found": False, "mediaAssetId": int(normalized_asset_id)}

        raw_path = row["variant_path"] or row["canonical_path"]
        resolved_path = resolve_canonical_path(raw_path, repo_root)
        return {
            "found": True,
            "mediaAssetId": row["media_asset_id"],
            "mediaType": row["media_type"],
            "fileExtension": row["file_extension"],
            "resolvedPath": resolved_path,
        }
    finally:
        connection.close()


# Stage 6 selects the next file-backed READY asset and records it as current.
# Address text is optional playback enrichment and may remain empty/unknown.
# Missing canonical paths or files remain independent playback failures.
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


def runtime_state_get(path: str, state_key: str) -> dict:
    """
    Fetch a runtime_state value by key. Returns a dict with the key and value (or None).
    The state_value column is returned verbatim without JSON decoding. When no row exists or
    the runtime_state table does not yet exist, stateValue will be null. This helper is
    tolerant of missing tables to support early orchestration persistence before the
    canonical schema has been applied.
    """
    # Use read/write connection because we may need to create the table later; however,
    # runtime_state_get itself will not create the table. It simply handles missing table
    # errors gracefully by returning None.
    connection = connect_read_only(path)
    try:
        try:
            cursor = connection.execute(
                "SELECT state_value FROM runtime_state WHERE state_key = ?",
                (state_key,),
            )
        except sqlite3.OperationalError as e:
            # If the table does not exist yet, treat as missing state
            if "no such table" in str(e).lower():
                return {"stateKey": state_key, "stateValue": None}
            raise
        row = cursor.fetchone()
        return {
            "stateKey": state_key,
            "stateValue": row["state_value"] if row is not None else None,
        }
    finally:
        connection.close()


def runtime_state_set(
    path: str, state_key: str, state_value: str, value_type: str, updated_by: str
) -> dict:
    """
    Insert or update a runtime_state entry. The provided state_value is persisted verbatim.
    If the runtime_state table does not exist yet, it will be created with the canonical
    schema. Returns the written key, value, and the timestamp used. Raises no error on
    conflict.
    """
    executed_at = datetime.utcnow().isoformat() + "Z"
    connection = connect_read_write(path)
    try:
        # Create the runtime_state table if it does not already exist. This mirrors the
        # definition in database/schema.sql but omits the initial INSERT OR IGNORE seeds. The
        # initial seeds will be applied later when the canonical schema is loaded via
        # ensure_canonical_schema (stage2_index_register). Creating the table here
        # enables orchestration state to be persisted before Stage 2 runs.
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS runtime_state (
                state_key TEXT PRIMARY KEY,
                state_value TEXT,
                value_type TEXT NOT NULL DEFAULT 'text',
                updated_at TEXT NOT NULL,
                updated_by TEXT
            )
            """
        )
        connection.execute(
            """
            INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(state_key) DO UPDATE SET
                state_value = excluded.state_value,
                value_type = excluded.value_type,
                updated_at = excluded.updated_at,
                updated_by = excluded.updated_by
            """,
            (state_key, state_value, value_type, executed_at, updated_by),
        )
        connection.commit()
        return {
            "stateKey": state_key,
            "stateValue": state_value,
            "updatedAt": executed_at,
        }
    finally:
        connection.close()


def main() -> int:
    if len(sys.argv) < 3:
        raise ValueError(
            "Expected usage: sqlite_admin.py <inspect|recreate|rows|stage2_index_register|stage3_process_gps_queue|stage4_process_geocode_queue|stage5_prepare_queue|stage6_select_current|playback_contract|playback_asset_media_path|runtime_state_get|runtime_state_set|seed_live_windows_native_video_fixture> <path> [args]"
        )

    operation = sys.argv[1]
    path = os.path.abspath(sys.argv[2])

    if operation == "inspect":
        if len(sys.argv) != 3:
            raise ValueError("inspect expects: sqlite_admin.py inspect <path>")
        result = inspect_database(path)
    elif operation == "recreate":
        if len(sys.argv) not in (3, 4):
            raise ValueError("recreate expects: sqlite_admin.py recreate <path> [schema_path]")
        schema_path = os.path.abspath(sys.argv[3]) if len(sys.argv) == 4 else None
        result = recreate_empty_database(path, schema_path)
    elif operation == "rows":
        if len(sys.argv) != 6:
            raise ValueError("rows expects: sqlite_admin.py rows <path> <table_name> <page> <page_size>")
        result = fetch_table_rows(path, sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
    elif operation == "stage2_index_register":
        if len(sys.argv) != 6:
            raise ValueError("stage2_index_register expects: sqlite_admin.py stage2_index_register <path> <download_dir> <indexed_at> <schema_path>")
        result = stage2_index_register(path, os.path.abspath(sys.argv[3]), sys.argv[4], os.path.abspath(sys.argv[5]))
    elif operation == "stage3_process_gps_queue":
        if len(sys.argv) != 5:
            raise ValueError("stage3_process_gps_queue expects: sqlite_admin.py stage3_process_gps_queue <path> <executed_at> <schema_path>")
        result = stage3_process_gps_queue(path, sys.argv[3], os.path.abspath(sys.argv[4]))
    elif operation == "stage4_process_geocode_queue":
        if len(sys.argv) != 5:
            raise ValueError("stage4_process_geocode_queue expects: sqlite_admin.py stage4_process_geocode_queue <path> <executed_at> <schema_path>")
        result = stage4_process_geocode_queue(path, sys.argv[3], os.path.abspath(sys.argv[4]))
    elif operation == "stage5_prepare_queue":
        if len(sys.argv) != 5:
            raise ValueError("stage5_prepare_queue expects: sqlite_admin.py stage5_prepare_queue <path> <executed_at> <schema_path>")
        result = prepare_slideshow_queue(path, sys.argv[3], os.path.abspath(sys.argv[4]))
    elif operation == "stage6_select_current":
        if len(sys.argv) != 5:
            raise ValueError(
                "stage6_select_current expects: sqlite_admin.py stage6_select_current <path> <executed_at> <repo_root>"
            )
        result = select_current_item(path, sys.argv[3], os.path.abspath(sys.argv[4]))
    elif operation == "playback_contract":
        # Usage: sqlite_admin.py playback_contract <path> <repo_root> [limit]
        if len(sys.argv) < 4:
            raise ValueError(
                "playback_contract expects: sqlite_admin.py playback_contract <path> <repo_root> [limit]"
            )
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 25
        result = playback_contract(path, os.path.abspath(sys.argv[3]), limit)
    elif operation == "playback_asset_media_path":
        # Usage: sqlite_admin.py playback_asset_media_path <path> <media_asset_id> <repo_root>
        if len(sys.argv) < 5:
            raise ValueError(
                "playback_asset_media_path expects: sqlite_admin.py playback_asset_media_path <path> <media_asset_id> <repo_root>"
            )
        result = playback_asset_media_path(path, sys.argv[3], os.path.abspath(sys.argv[4]))

    elif operation == "seed_live_windows_native_video_fixture":
        # Usage: sqlite_admin.py seed_live_windows_native_video_fixture <path> <fixture_relative_path> <repo_root> <executed_at> <schema_path>
        if len(sys.argv) != 7:
            raise ValueError(
                "seed_live_windows_native_video_fixture expects: sqlite_admin.py seed_live_windows_native_video_fixture <path> <fixture_relative_path> <repo_root> <executed_at> <schema_path>"
            )
        result = seed_live_windows_native_video_fixture(path, sys.argv[3], os.path.abspath(sys.argv[4]), sys.argv[5], os.path.abspath(sys.argv[6]))
    elif operation == "runtime_state_get":
        # Usage: sqlite_admin.py runtime_state_get <path> <state_key>
        if len(sys.argv) != 4:
            raise ValueError(
                "runtime_state_get expects: sqlite_admin.py runtime_state_get <path> <state_key>"
            )
        result = runtime_state_get(path, sys.argv[3])
    elif operation == "runtime_state_set":
        # Usage: sqlite_admin.py runtime_state_set <path> <state_key> <state_value> <value_type> <updated_by>
        if len(sys.argv) != 7:
            raise ValueError(
                "runtime_state_set expects: sqlite_admin.py runtime_state_set <path> <state_key> <state_value> <value_type> <updated_by>"
            )
        result = runtime_state_set(path, sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
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
