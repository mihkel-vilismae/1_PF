"""Crontab file parsing and human-readable schedule helpers."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class CronField:
    """Parsed representation of one MVP cron field."""

    raw: str
    any_value: bool = False
    step: int | None = None
    exact: int | None = None


@dataclass(frozen=True)
class CronJob:
    """A parsed crontab row."""

    id: str
    raw_row: str
    minute: CronField | None
    hour: CronField | None
    day_of_month: CronField | None
    month: CronField | None
    day_of_week: CronField | None
    command: str
    job_name: str
    readable_timing: str
    valid: bool
    error: str | None = None


FIELD_RANGES: tuple[tuple[int, int], ...] = (
    (0, 59),
    (0, 23),
    (1, 31),
    (1, 12),
    (0, 6),
)


def load_crontab_text(path: Path) -> str:
    """Load the raw crontab text, returning an empty string if the file is missing."""

    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def parse_crontab_text(text: str) -> list[CronJob]:
    """Parse a crontab-like text file into valid and invalid job rows."""

    jobs: list[CronJob] = []
    for line_number, row in enumerate(text.splitlines(), start=1):
        stripped = row.strip()
        if not stripped or stripped.startswith("#"):
            continue
        jobs.append(parse_cron_row(stripped, line_number))
    return jobs


def parse_cron_row(row: str, line_number: int) -> CronJob:
    """Parse one crontab row while preserving invalid rows for UI display."""

    parts = row.split(maxsplit=5)
    job_id = f"line-{line_number}"
    if len(parts) < 6:
        return _invalid_job(job_id, row, "Expected five cron fields plus a command.")

    field_values = parts[:5]
    command = parts[5].strip()
    if not command:
        return _invalid_job(job_id, row, "Command is empty.")

    parsed_fields: list[CronField] = []
    for index, raw_field in enumerate(field_values):
        low, high = FIELD_RANGES[index]
        try:
            parsed_fields.append(parse_field(raw_field, low, high))
        except ValueError as exc:
            return _invalid_job(job_id, row, str(exc), command=command)

    readable = humanize_schedule(field_values)
    return CronJob(
        id=job_id,
        raw_row=row,
        minute=parsed_fields[0],
        hour=parsed_fields[1],
        day_of_month=parsed_fields[2],
        month=parsed_fields[3],
        day_of_week=parsed_fields[4],
        command=command,
        job_name=infer_job_name(command),
        readable_timing=readable,
        valid=True,
    )


def parse_field(raw_field: str, low: int, high: int) -> CronField:
    """Parse one supported MVP cron field.

    Supported forms are `*`, `*/N`, and exact integers in range.
    """

    if raw_field == "*":
        return CronField(raw=raw_field, any_value=True)

    if raw_field.startswith("*/"):
        step_text = raw_field[2:]
        if not step_text.isdigit():
            raise ValueError(f"Unsupported step field: {raw_field}")
        step = int(step_text)
        if step <= 0:
            raise ValueError(f"Step must be greater than zero: {raw_field}")
        return CronField(raw=raw_field, step=step)

    if raw_field.isdigit():
        exact = int(raw_field)
        if exact < low or exact > high:
            raise ValueError(f"Field value {exact} outside range {low}-{high}.")
        return CronField(raw=raw_field, exact=exact)

    raise ValueError(f"Unsupported MVP cron field: {raw_field}")


def infer_job_name(command: str) -> str:
    """Infer a stable display name from the command path or executable."""

    first_arg = command.split()[0]
    normalized = first_arg.replace("\\", "/").rstrip("/")
    name = normalized.split("/")[-1]
    return name or command


def humanize_schedule(fields: Iterable[str]) -> str:
    """Translate common MVP cron schedules into readable timing text."""

    minute, hour, dom, month, dow = list(fields)
    if [hour, dom, month, dow] == ["*", "*", "*", "*"]:
        if minute == "*":
            return "Every minute"
        if minute.startswith("*/"):
            return f"Every {minute[2:]} minutes"
        if minute.isdigit():
            return f"Every hour at minute {int(minute):02d}"
    if dom == month == dow == "*" and minute.isdigit() and hour.isdigit():
        return f"Every day at {int(hour):02d}:{int(minute):02d}"
    return "Custom MVP cron schedule"


def _invalid_job(job_id: str, row: str, error: str, command: str = "") -> CronJob:
    return CronJob(
        id=job_id,
        raw_row=row,
        minute=None,
        hour=None,
        day_of_month=None,
        month=None,
        day_of_week=None,
        command=command,
        job_name=infer_job_name(command) if command else "Invalid row",
        readable_timing="Invalid cron row",
        valid=False,
        error=error,
    )
