#!/usr/bin/env python3

from __future__ import annotations

import argparse
from datetime import date
from os.path import relpath
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
RUN_LOG_PATH = REPO_ROOT / "docs" / "button_verification_results" / "RUN_LOG.md"

RUN_LOG_HEADER = """# Button Verification Run Log

This is the append-only ledger for every completed button verification workflow run.

Add one new row for every run, including re-runs of the same button.

| Run date | View | Section | Control | Action key | Classification | Report | Backend test | Frontend test | Summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Append one button verification workflow run to docs/button_verification_results/RUN_LOG.md.",
    )
    parser.add_argument("--run-date", default=date.today().isoformat(), help="Run date in YYYY-MM-DD format.")
    parser.add_argument("--view", required=True, help="View identifier such as A, B, C, or D.")
    parser.add_argument("--section", required=True, help="Section code such as 1A or B3.2.")
    parser.add_argument("--control", required=True, help="Human-readable control label.")
    parser.add_argument("--action-key", required=True, help="Action key such as verify-env.")
    parser.add_argument("--classification", required=True, help="Final classification such as Works or Partial.")
    parser.add_argument("--report-path", required=True, help="Path to the per-button report file.")
    parser.add_argument("--backend-test", default="", help="Backend test path or identifier.")
    parser.add_argument("--frontend-test", default="", help="Frontend test path or identifier.")
    parser.add_argument("--summary", required=True, help="Short one-line summary of the run result.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not RUN_LOG_PATH.exists():
        RUN_LOG_PATH.write_text(RUN_LOG_HEADER, encoding="utf-8")

    row = "| {run_date} | {view} | {section} | {control} | `{action_key}` | `{classification}` | {report} | {backend_test} | {frontend_test} | {summary} |\n".format(
        run_date=escape_cell(args.run_date),
        view=escape_cell(args.view),
        section=escape_cell(args.section),
        control=escape_cell(args.control),
        action_key=escape_inline_code(args.action_key),
        classification=escape_inline_code(args.classification),
        report=render_report_cell(args.report_path),
        backend_test=render_optional_code_cell(args.backend_test),
        frontend_test=render_optional_code_cell(args.frontend_test),
        summary=escape_cell(args.summary),
    )

    with RUN_LOG_PATH.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(row)

    print(f"Appended button verification run to {RUN_LOG_PATH}")


def render_report_cell(report_path: str) -> str:
    resolved = resolve_to_repo_root(report_path)
    label = resolved.name
    relative_target = relpath(resolved, RUN_LOG_PATH.parent).replace("\\", "/")
    return f"[{escape_link_text(label)}]({relative_target})"


def resolve_to_repo_root(path_value: str) -> Path:
    candidate = Path(path_value)
    if candidate.is_absolute():
        return candidate.resolve()
    return (REPO_ROOT / candidate).resolve()


def render_optional_code_cell(value: str) -> str:
    if not value.strip():
        return "-"
    return f"`{escape_inline_code(value.strip())}`"


def escape_cell(value: str) -> str:
    return " ".join(value.strip().split()).replace("|", "\\|")


def escape_inline_code(value: str) -> str:
    return value.replace("`", "")


def escape_link_text(value: str) -> str:
    return value.replace("[", "").replace("]", "")


if __name__ == "__main__":
    main()
