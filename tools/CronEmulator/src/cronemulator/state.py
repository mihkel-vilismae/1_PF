"""Application state boundary for the CronEmulator dashboard."""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any

from .cron_parser import CronJob, load_crontab_text, parse_crontab_text
from .executor import ExecutionResult, run_command
from .scheduler import SchedulerLoop, next_run_after, seconds_until_next_run


@dataclass(frozen=True)
class RunLogEntry:
    """One job execution log entry."""

    timestamp: str
    job_id: str
    job_name: str
    raw_cron_row: str
    command: str
    status: str
    return_code: int | None
    stdout_summary: str
    stderr_summary: str


class AppState:
    """Thread-safe app state used by HTTP routes and the scheduler loop."""

    def __init__(
        self,
        repo_root: Path,
        crontab_path: Path | None = None,
        log_file_path: Path | None = None,
    ):
        self.repo_root = repo_root
        self.crontab_path = crontab_path or repo_root / "crontab_emulated.txt"
        self.log_file_path = log_file_path
        self.raw_crontab = ""
        self.jobs: list[CronJob] = []
        self.logs: list[RunLogEntry] = []
        self._lock = threading.RLock()
        self.scheduler = SchedulerLoop(self.get_jobs, self.execute_job)
        self.reload_crontab()

    def reload_crontab(self) -> None:
        with self._lock:
            self.raw_crontab = load_crontab_text(self.crontab_path)
            self.jobs = parse_crontab_text(self.raw_crontab)

    def get_jobs(self) -> list[CronJob]:
        with self._lock:
            return list(self.jobs)

    def snapshot(self, selected_job_id: str | None = None) -> dict[str, Any]:
        now = datetime.now()
        with self._lock:
            jobs = [self._job_to_dict(job, now) for job in self.jobs]
            logs = self.logs
            if selected_job_id:
                logs = [entry for entry in logs if entry.job_id == selected_job_id]
            return {
                "crontab_path": str(self.crontab_path),
                "log_file_path": str(self.log_file_path) if self.log_file_path else None,
                "raw_crontab": self.raw_crontab,
                "scheduler_running": self.scheduler.running,
                "jobs": jobs,
                "logs": [asdict(entry) for entry in reversed(logs[-300:])],
                "generated_at": now.isoformat(timespec="seconds"),
            }

    def execute_job_by_id(self, job_id: str) -> bool:
        job = self.find_job(job_id)
        if job is None or not job.valid:
            return False
        threading.Thread(target=self.execute_job, args=(job,), daemon=True).start()
        return True

    def execute_job(self, job: CronJob) -> None:
        started_at = datetime.now().isoformat(timespec="seconds")
        result = run_command(job.command)
        self.record_log(started_at, job, result)

    def record_log(self, timestamp: str, job: CronJob, result: ExecutionResult) -> None:
        entry = RunLogEntry(
            timestamp=timestamp,
            job_id=job.id,
            job_name=job.job_name,
            raw_cron_row=job.raw_row,
            command=job.command,
            status=result.status,
            return_code=result.return_code,
            stdout_summary=result.stdout_summary,
            stderr_summary=result.stderr_summary,
        )
        with self._lock:
            self.logs.append(entry)
            self.logs = self.logs[-1000:]
            self._append_file_log(entry, result)

    def _append_file_log(self, entry: RunLogEntry, result: ExecutionResult) -> None:
        if self.log_file_path is None:
            return
        payload = asdict(entry)
        payload["stdout"] = result.stdout
        payload["stderr"] = result.stderr
        try:
            self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
            with self.log_file_path.open("a", encoding="utf-8") as log_file:
                log_file.write(json.dumps(payload, ensure_ascii=True) + "\n")
        except OSError as exc:
            print(f"[log-file] Failed to write {self.log_file_path}: {exc}")

    def clear_logs(self) -> None:
        with self._lock:
            self.logs.clear()

    def find_job(self, job_id: str) -> CronJob | None:
        with self._lock:
            for job in self.jobs:
                if job.id == job_id:
                    return job
        return None

    def _job_to_dict(self, job: CronJob, now: datetime) -> dict[str, Any]:
        next_run = next_run_after(job, now)
        last_log = next((entry for entry in reversed(self.logs) if entry.job_id == job.id), None)
        return {
            "id": job.id,
            "valid": job.valid,
            "error": job.error,
            "job_name": job.job_name,
            "raw_row": job.raw_row,
            "readable_timing": job.readable_timing,
            "command": job.command,
            "seconds_until_next_run": seconds_until_next_run(job, now),
            "next_run_timestamp": next_run.isoformat(timespec="seconds") if next_run else None,
            "last_run_timestamp": last_log.timestamp if last_log else None,
            "last_result": last_log.status if last_log else None,
            "last_return_code": last_log.return_code if last_log else None,
        }
