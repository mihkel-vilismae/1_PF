from datetime import datetime
import json

from cronemulator.executor import ExecutionResult
from cronemulator.state import AppState


def test_state_loads_default_file_and_filters_logs(tmp_path):
    (tmp_path / "crontab_emulated.txt").write_text(
        "* * * * * /path/to/playback_worker\n*/3 * * * * /path/to/screen_on_off_worker\n",
        encoding="utf-8",
    )
    state = AppState(tmp_path)
    jobs = state.get_jobs()
    assert len(jobs) == 2
    assert "playback_worker" in state.snapshot()["raw_crontab"]

    state.record_log(
        datetime(2026, 4, 26, 10, 0, 0).isoformat(timespec="seconds"),
        jobs[0],
        ExecutionResult(return_code=0, status="success", stdout_summary="ok", stderr_summary=""),
    )
    state.record_log(
        datetime(2026, 4, 26, 10, 1, 0).isoformat(timespec="seconds"),
        jobs[1],
        ExecutionResult(return_code=1, status="failed", stdout_summary="", stderr_summary="bad"),
    )

    filtered = state.snapshot(selected_job_id=jobs[0].id)
    assert len(filtered["logs"]) == 1
    assert filtered["logs"][0]["job_name"] == "playback_worker"


def test_state_loads_custom_crontab_file(tmp_path):
    custom_crontab = tmp_path / "custom_crontab.txt"
    custom_crontab.write_text("* * * * * /path/to/custom_worker\n", encoding="utf-8")

    state = AppState(tmp_path, crontab_path=custom_crontab)

    assert state.crontab_path == custom_crontab
    assert state.get_jobs()[0].job_name == "custom_worker"


def test_state_appends_cron_calls_to_log_file(tmp_path):
    (tmp_path / "crontab_emulated.txt").write_text("* * * * * /path/to/logged_worker\n", encoding="utf-8")
    log_file = tmp_path / "logs" / "cron_calls.jsonl"
    state = AppState(tmp_path, log_file_path=log_file)
    job = state.get_jobs()[0]

    state.record_log(
        datetime(2026, 4, 26, 10, 2, 0).isoformat(timespec="seconds"),
        job,
        ExecutionResult(
            return_code=0,
            status="success",
            stdout_summary="summary out",
            stderr_summary="summary err",
            stdout="full stdout\nline 2",
            stderr="full stderr",
        ),
    )

    entries = [json.loads(line) for line in log_file.read_text(encoding="utf-8").splitlines()]
    assert entries[0]["job_name"] == "logged_worker"
    assert entries[0]["command"] == "/path/to/logged_worker"
    assert entries[0]["stdout"] == "full stdout\nline 2"
    assert entries[0]["stderr"] == "full stderr"
