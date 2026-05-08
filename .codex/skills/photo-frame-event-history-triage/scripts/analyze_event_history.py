# Summarizes 12_PF dashboard Event history JSON exports.
# Flags nested scheduler failures, pipeline locks, mock downloads,
# and schema drift without requiring repo runtime access.
# Output is a first-pass triage aid, not source-code verification.

import argparse
import json
import sys
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional


# Loads an Event history JSON document from a file path or stdin.
def load_event_history(path: Optional[str]) -> Dict[str, Any]:
    if path:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    return json.load(sys.stdin)


# Walks every nested dictionary and list value in depth-first order.
def walk_values(value: Any) -> Iterable[Any]:
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk_values(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_values(child)


# Returns a nested field value without raising on missing keys.
def get_path(value: Dict[str, Any], path: List[str], default: Any = None) -> Any:
    current: Any = value
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


# Adds a finding if it is not already present.
def add_unique(findings: List[str], finding: str) -> None:
    if finding not in findings:
        findings.append(finding)


# Extracts known scheduler and CronEmulator health signals.
def inspect_scheduler_event(log: Dict[str, Any], findings: List[str]) -> None:
    if log.get("source") != "SCHEDULER":
        return

    if log.get("type") == "success":
        add_unique(findings, "Scheduler dashboard/API action reported top-level success.")

    body = get_path(log, ["details", "response", "body"], {})
    for nested in walk_values(body):
        if not isinstance(nested, dict):
            continue

        jobs = nested.get("jobs")
        if isinstance(jobs, list):
            failed_jobs = [
                job
                for job in jobs
                if isinstance(job, dict) and job.get("last_result") == "failed"
            ]
            if failed_jobs:
                names = sorted(
                    {
                        str(job.get("job_name") or job.get("id") or "unknown")
                        for job in failed_jobs
                    }
                )
                add_unique(
                    findings,
                    "Nested scheduler jobs are failing: " + ", ".join(names) + ".",
                )

            placeholders = sorted(
                {
                    str(job.get("command"))
                    for job in jobs
                    if isinstance(job, dict)
                    and isinstance(job.get("command"), str)
                    and job["command"].startswith("/path/to/")
                }
            )
            if placeholders:
                add_unique(
                    findings,
                    "Cron rows still execute placeholder commands: "
                    + ", ".join(placeholders)
                    + ".",
                )

        logs = nested.get("logs")
        if isinstance(logs, list):
            failed_logs = [
                entry
                for entry in logs
                if isinstance(entry, dict) and entry.get("status") == "failed"
            ]
            if failed_logs:
                add_unique(
                    findings,
                    f"Nested CronEmulator execution log contains {len(failed_logs)} failed run(s).",
                )

            if any("invalid_json" in str(entry.get("stderr_summary", "")) for entry in failed_logs):
                add_unique(
                    findings,
                    "PowerShell cron execution is reaching the API with invalid JSON; check command quoting.",
                )

            if any(
                "cannot find the path specified" in str(entry.get("stderr_summary", "")).lower()
                for entry in failed_logs
            ):
                add_unique(
                    findings,
                    "At least one scheduled command path does not exist on Windows.",
                )


# Extracts pipeline lock blockers and missing lock metadata.
def inspect_pipeline_event(log: Dict[str, Any], findings: List[str]) -> None:
    details = log.get("details")
    if log.get("source") != "PIPELINE" or not isinstance(details, dict):
        return

    if details.get("reason") == "pipeline_lock_held":
        action = details.get("requestedAction") or "unknown action"
        owner = details.get("lockOwner") or "unknown owner"
        add_unique(
            findings,
            f"Pipeline action {action} is blocked by an existing lock owned by {owner}.",
        )
        if details.get("lockAcquiredAt") is None or details.get("lockAgeSeconds") is None:
            add_unique(
                findings,
                "Pipeline lock metadata is incomplete; stale-lock age cannot be verified from this export.",
            )


# Extracts mock download signals and media-count mismatches.
def inspect_download_event(log: Dict[str, Any], findings: List[str]) -> None:
    body = get_path(log, ["details", "response", "body"], {})
    download = body.get("download") if isinstance(body, dict) else None
    if not isinstance(download, dict):
        return

    mode = download.get("mode")
    copied = download.get("copiedFiles")
    failed = download.get("failedFiles")
    add_unique(
        findings,
        f"Download event mode is {mode or 'unknown'} with copied={copied} and failed={failed}.",
    )

    if mode == "generated_test_data_copy":
        add_unique(
            findings,
            "Download success is mock/generated-test-data evidence, not production iCloud evidence.",
        )

    before = download.get("mediaFilesBefore")
    after = download.get("mediaFilesAfter")
    new_media = download.get("newMediaFiles")
    if copied and before == after and new_media == 0:
        add_unique(
            findings,
            "Files were copied, but media file count did not increase.",
        )


# Finds missing common fields across exported event rows.
def inspect_schema(logs: List[Dict[str, Any]]) -> List[str]:
    expected = ["id", "at", "atIso", "atTallinn", "source", "type", "message", "details"]
    missing_by_field: Dict[str, List[str]] = {field: [] for field in expected}
    for index, log in enumerate(logs, start=1):
        for field in expected:
            if field not in log:
                missing_by_field[field].append(str(index))

    findings = []
    for field, rows in missing_by_field.items():
        if rows:
            findings.append(f"Field '{field}' is missing on event row(s): {', '.join(rows)}.")
    return findings


# Builds a structured summary from an Event history export.
def summarize_event_history(export: Dict[str, Any]) -> Dict[str, Any]:
    logs = export.get("logs", [])
    if not isinstance(logs, list):
        logs = []

    typed_logs = [log for log in logs if isinstance(log, dict)]
    sources = Counter(str(log.get("source", "UNKNOWN")) for log in typed_logs)
    types = Counter(str(log.get("type", "UNKNOWN")) for log in typed_logs)
    findings: List[str] = []

    for log in typed_logs:
        inspect_scheduler_event(log, findings)
        inspect_pipeline_event(log, findings)
        inspect_download_event(log, findings)

    findings.extend(inspect_schema(typed_logs))

    return {
        "exportedAt": export.get("exportedAt"),
        "source": export.get("source"),
        "count": export.get("count"),
        "observedRows": len(typed_logs),
        "sources": dict(sorted(sources.items())),
        "types": dict(sorted(types.items())),
        "findings": findings,
    }


# Formats a structured summary as a compact operator-readable report.
def format_report(summary: Dict[str, Any]) -> str:
    lines = [
        "Event history triage",
        f"- Exported at: {summary.get('exportedAt') or 'unknown'}",
        f"- Declared count: {summary.get('count')}; observed rows: {summary.get('observedRows')}",
        f"- Sources: {summary.get('sources')}",
        f"- Types: {summary.get('types')}",
        "- Findings:",
    ]

    findings = summary.get("findings") or []
    if findings:
        lines.extend(f"  - {finding}" for finding in findings)
    else:
        lines.append("  - No known high-signal patterns detected.")

    return "\n".join(lines)


# Parses CLI arguments, runs the analysis, and prints text or JSON output.
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyze a 12_PF dashboard Event history JSON export."
    )
    parser.add_argument("path", nargs="?", help="Event history JSON file. Reads stdin if omitted.")
    parser.add_argument("--json", action="store_true", help="Print the structured summary as JSON.")
    args = parser.parse_args()

    try:
        export = load_event_history(args.path)
        summary = summarize_event_history(export)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(format_report(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
