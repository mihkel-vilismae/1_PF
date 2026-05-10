from datetime import datetime

from cronemulator.cron_parser import parse_crontab_text
from cronemulator.scheduler import job_matches_datetime, next_run_after, seconds_until_next_run


def first_job(row: str):
    return parse_crontab_text(row)[0]


def test_next_run_every_minute_uses_next_minute_boundary():
    job = first_job("* * * * * /path/to/playback_worker")
    now = datetime(2026, 4, 26, 10, 0, 30)
    assert next_run_after(job, now) == datetime(2026, 4, 26, 10, 1, 0)
    assert seconds_until_next_run(job, now) == 30


def test_next_run_every_three_minutes():
    job = first_job("*/3 * * * * /path/to/screen_on_off_worker")
    now = datetime(2026, 4, 26, 10, 1, 10)
    assert next_run_after(job, now) == datetime(2026, 4, 26, 10, 3, 0)
    assert seconds_until_next_run(job, now) == 110


def test_next_run_every_ten_minutes():
    job = first_job("*/10 * * * * /path/to/regular_stage_worker")
    now = datetime(2026, 4, 26, 10, 9, 50)
    assert next_run_after(job, now) == datetime(2026, 4, 26, 10, 10, 0)
    assert seconds_until_next_run(job, now) == 10


def test_due_detection_requires_minute_boundary_match():
    job = first_job("*/10 * * * * /path/to/regular_stage_worker")
    assert job_matches_datetime(job, datetime(2026, 4, 26, 10, 10, 0)) is True
    assert job_matches_datetime(job, datetime(2026, 4, 26, 10, 11, 0)) is False
