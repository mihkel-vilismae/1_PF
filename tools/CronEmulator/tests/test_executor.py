import sys

from cronemulator.executor import run_command


def test_run_command_preserves_full_stdout():
    command = f'"{sys.executable}" -c "print(\'full output\')"'

    result = run_command(command)

    assert result.status == "success"
    assert result.stdout_summary == "full output"
    assert "full output" in result.stdout
