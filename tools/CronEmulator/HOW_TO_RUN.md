# How to Run CronEmulator

## Windows 11

### 1. Confirm Python is available

```powershell
python --version
```

Expected result: Python 3.10 or newer is shown.

### 2. Start the app

From the repository root:

```powershell
./start_scripts/start_win.ps1
```

Expected result: the Python HTTP dashboard starts and prints a local URL.

To load a specific crontab file:

```powershell
./start_scripts/start_win.ps1 C:\path\to\crontab.txt
```

To show help for available run parameters:

```powershell
./start_scripts/start_win.ps1 --help
```

To persist cron call logs, including command output:

```powershell
./start_scripts/start_win.ps1 C:\path\to\crontab.txt --log-file logs\cron_calls.jsonl
```

Alternative:

```cmd
start_win.cmd
```

The batch launcher also forwards run parameters:

```cmd
start_win.cmd C:\path\to\crontab.txt
start_win.cmd C:\path\to\crontab.txt --log-file logs\cron_calls.jsonl
start_win.cmd --help
```

### 3. Open the dashboard

Open:

```text
http://127.0.0.1:8765
```

Expected screen:

- Loaded file path at the top.
- Raw `crontab_emulated.txt` text in a terminal-like panel.
- Parsed cron job table.
- Runtime log panel.

### 4. Run tests

```powershell
python -m pytest
```

Expected result: all tests pass.

## Run parameters

- `crontab_file` — optional path to the crontab file to emulate. Defaults to `crontab_emulated.txt` in the project root.
- `--log-file` — optional path to a JSON Lines file that records each cron call with command, status, return code, stdout, and stderr.
- `-h`, `--help` — show help for available run parameters.

## Linux/macOS

The app is Windows-first but uses Python standard library modules, so it can also be started with:

```bash
python -m cronemulator.app
```

Run this from a shell where `src` is on `PYTHONPATH`, or install/edit as needed for your environment.
