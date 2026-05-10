"""Schedule matching, next-run calculation, and scheduler loop."""

from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta
from typing import Callable

from .cron_parser import CronField, CronJob


ExecuteCallback = Callable[[CronJob], None]


def field_matches(field: CronField | None, value: int) -> bool:
    """Return whether one datetime component matches an MVP cron field."""

    if field is None:
        return False
    if field.any_value:
        return True
    if field.step is not None:
        return value % field.step == 0
    if field.exact is not None:
        return value == field.exact
    return False


def job_matches_datetime(job: CronJob, dt: datetime) -> bool:
    """Check whether a job is due at the given local datetime."""

    if not job.valid:
        return False
    cron_weekday = (dt.weekday() + 1) % 7  # cron Sunday=0, Python Monday=0
    return all(
        (
            field_matches(job.minute, dt.minute),
            field_matches(job.hour, dt.hour),
            field_matches(job.day_of_month, dt.day),
            field_matches(job.month, dt.month),
            field_matches(job.day_of_week, cron_weekday),
        )
    )


def next_run_after(job: CronJob, now: datetime | None = None, max_days: int = 366) -> datetime | None:
    """Find the next minute boundary when a job should run."""

    if not job.valid:
        return None
    reference = now or datetime.now()
    candidate = reference.replace(second=0, microsecond=0) + timedelta(minutes=1)
    deadline = reference + timedelta(days=max_days)
    while candidate <= deadline:
        if job_matches_datetime(job, candidate):
            return candidate
        candidate += timedelta(minutes=1)
    return None


def seconds_until_next_run(job: CronJob, now: datetime | None = None) -> int | None:
    """Return seconds until the next run, or None for invalid/unmatched jobs."""

    reference = now or datetime.now()
    next_run = next_run_after(job, reference)
    if next_run is None:
        return None
    return max(0, int((next_run - reference).total_seconds()))


class SchedulerLoop:
    """Small one-second scheduler loop with duplicate-run protection."""

    def __init__(self, get_jobs: Callable[[], list[CronJob]], execute: ExecuteCallback):
        self._get_jobs = get_jobs
        self._execute = execute
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._running_job_ids: set[str] = set()
        self._last_run_keys: set[tuple[str, str]] = set()
        self._lock = threading.Lock()

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="cronemulator-scheduler", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            now = datetime.now().replace(microsecond=0)
            current_minute_key = now.strftime("%Y-%m-%dT%H:%M")
            if now.second == 0:
                for job in self._get_jobs():
                    self._maybe_run(job, now, current_minute_key)
            self._stop_event.wait(1.0)

    def _maybe_run(self, job: CronJob, now: datetime, current_minute_key: str) -> None:
        run_key = (job.id, current_minute_key)
        with self._lock:
            if job.id in self._running_job_ids or run_key in self._last_run_keys:
                return
            if not job_matches_datetime(job, now):
                return
            self._running_job_ids.add(job.id)
            self._last_run_keys.add(run_key)

        def worker() -> None:
            try:
                self._execute(job)
            finally:
                with self._lock:
                    self._running_job_ids.discard(job.id)

        threading.Thread(target=worker, name=f"cronemulator-job-{job.id}", daemon=True).start()
