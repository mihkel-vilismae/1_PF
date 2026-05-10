"""Command execution boundary for cron jobs."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass


@dataclass(frozen=True)
class ExecutionResult:
    """Result captured from a command execution."""

    return_code: int | None
    status: str
    stdout_summary: str
    stderr_summary: str
    stdout: str = ""
    stderr: str = ""


def run_command(command: str, timeout_seconds: int = 300) -> ExecutionResult:
    """Run a command and return a compact execution result.

    `shell=True` is used intentionally because the Windows-first MVP should execute
    script paths, `.cmd` files, and simple shell commands in the same way a user
    would type them locally. This boundary should remain the only place that runs
    commands from the crontab file.
    """

    try:
        completed = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired as exc:
        stdout = _to_text(exc.stdout)
        stderr = _to_text(exc.stderr)
        return ExecutionResult(
            return_code=None,
            status="timeout",
            stdout_summary=_summarize(stdout),
            stderr_summary=_summarize(stderr),
            stdout=stdout,
            stderr=stderr,
        )
    except OSError as exc:
        stderr = str(exc)
        return ExecutionResult(
            return_code=None,
            status="error",
            stdout_summary="",
            stderr_summary=stderr,
            stderr=stderr,
        )

    return ExecutionResult(
        return_code=completed.returncode,
        status="success" if completed.returncode == 0 else "failed",
        stdout_summary=_summarize(completed.stdout),
        stderr_summary=_summarize(completed.stderr),
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


def _summarize(value: str | bytes | None, limit: int = 240) -> str:
    text = _to_text(value)
    compact = " ".join(text.split())
    if len(compact) > limit:
        return compact[: limit - 3] + "..."
    return compact


def _to_text(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode(errors="replace")
    return value
