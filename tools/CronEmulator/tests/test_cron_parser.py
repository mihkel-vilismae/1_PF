from cronemulator.cron_parser import infer_job_name, parse_crontab_text


def test_parse_default_crontab_rows():
    text = """*/10 * * * * /path/to/regular_stage_worker
* * * * * /path/to/playback_worker
*/3 * * * * /path/to/screen_on_off_worker
"""
    jobs = parse_crontab_text(text)
    assert [job.job_name for job in jobs] == [
        "regular_stage_worker",
        "playback_worker",
        "screen_on_off_worker",
    ]
    assert [job.readable_timing for job in jobs] == [
        "Every 10 minutes",
        "Every minute",
        "Every 3 minutes",
    ]
    assert all(job.valid for job in jobs)


def test_comments_and_blank_lines_are_ignored():
    jobs = parse_crontab_text("# comment\n\n* * * * * /tmp/a\n")
    assert len(jobs) == 1
    assert jobs[0].job_name == "a"


def test_invalid_row_is_preserved():
    jobs = parse_crontab_text("bad row\n")
    assert len(jobs) == 1
    assert jobs[0].valid is False
    assert jobs[0].raw_row == "bad row"
    assert jobs[0].error


def test_job_name_inference_handles_windows_paths():
    assert infer_job_name(r"C:\tools\playback_worker.cmd --flag") == "playback_worker.cmd"
