import json
import os
import sqlite3
import sys


def inspect_database(path: str) -> dict:
    connection = sqlite3.connect(path)
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
            escaped_name = name.replace("'", "''")
            column_rows = cursor.execute(f"PRAGMA table_info('{escaped_name}')").fetchall()
            tables.append(
                {
                    "name": name,
                    "kind": kind,
                    "columnCount": len(column_rows),
                    "columns": [column[1] for column in column_rows],
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


def recreate_empty_database(path: str) -> dict:
    os.makedirs(os.path.dirname(path), exist_ok=True)
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


def main() -> int:
    if len(sys.argv) != 3:
        raise ValueError("Expected usage: sqlite_admin.py <inspect|recreate> <path>")

    operation = sys.argv[1]
    path = os.path.abspath(sys.argv[2])

    if operation == "inspect":
        result = inspect_database(path)
    elif operation == "recreate":
        result = recreate_empty_database(path)
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
