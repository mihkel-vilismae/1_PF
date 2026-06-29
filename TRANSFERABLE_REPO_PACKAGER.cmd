@echo off
setlocal EnableExtensions

rem TRANSFERABLE_REPO_PACKAGER.cmd
rem Copy this single file into the root of any Git repository.
rem Double-click it or run it from Command Prompt to create an automatically named ZIP.
rem The embedded pack_repo_zip.py and zip_ignore.json contents are stored below as readable text.
rem During execution, temporary helper files are created under %%TEMP%% and removed afterward.
rem The only normal output left in the target repository is the generated ZIP.

set "SCRIPT_DIR=%~dp0"
set "SELF=%~f0"
set "TEMP_PS1=%TEMP%\repo_zip_packager_%RANDOM%_%RANDOM%.ps1"

pushd "%SCRIPT_DIR%" >nul 2>nul
if errorlevel 1 (
  echo ERROR: Could not change to script directory: %SCRIPT_DIR%
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $self = $env:SELF; $out = $env:TEMP_PS1; $text = Get-Content -Raw -LiteralPath $self; $match = [regex]::Match($text, '(?ms)^# POWERSHELL_PAYLOAD_START\r?\n(?<body>.*)$'); if (-not $match.Success) { throw 'Missing readable PowerShell payload section.' }; [IO.File]::WriteAllText($out, $match.Groups['body'].Value, [Text.UTF8Encoding]::new($false))"
if errorlevel 1 (
  echo ERROR: Could not prepare temporary PowerShell runner.
  popd >nul 2>nul
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%TEMP_PS1%"
set "EXIT_CODE=%ERRORLEVEL%"

del "%TEMP_PS1%" >nul 2>nul
popd >nul 2>nul

exit /b %EXIT_CODE%

# POWERSHELL_PAYLOAD_START
$ErrorActionPreference = 'Stop'

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('repo_zip_packager_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

$packagerPath = Join-Path $tempRoot 'pack_repo_zip.py'
$ignorePath = Join-Path $tempRoot 'zip_ignore.json'

$packagerSource = @'
#!/usr/bin/env python3
"""
Repo ZIP Packager

Creates a ZIP archive of a repository while preserving .git history.

Behavior:
- Prints .git size and file count before git gc, after git gc, and after ZIP creation.
- Runs git gc --prune=now before packaging to compact Git storage.
- Warns when .git changes during ZIP creation after git gc.
- Includes .git/ by default.
- Excludes files ignored by .gitignore, using git check-ignore when available.
- Excludes additional files/folders/patterns from zip_ignore.json.
- Avoids packaging the output ZIP into itself.
- Does not create a manifest by default. A manifest can be requested explicitly.

Example:
    py pack_repo_zip.py --repo . --ignore-json zip_ignore.json
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import subprocess
import threading
import time
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class IgnoreConfig:
    files: tuple[str, ...]
    directories: tuple[str, ...]
    patterns: tuple[str, ...]


@dataclass(frozen=True)
class SizeSnapshot:
    total_bytes: int
    git_bytes: int
    git_file_count: int


DEFAULT_IGNORE_CONFIG = IgnoreConfig(
    files=(),
    directories=(),
    patterns=(
        "*.zip",
        "*.7z",
        "*.rar",
        "*.tar",
        "*.tar.gz",
        "*.tmp",
        "*.temp",
        "*.bak",
        "*.swp",
        "*.pyc",
        "*.pyo",
        "*.log",
        "log_*.log",
        ".DS_Store",
        "Thumbs.db",
    ),
)


class DynamicProgressLine:
    """Animate one console line using one, two, and three dots."""

    def __init__(self, message: str, interval_seconds: float = 1.0) -> None:
        self.message = message
        self.interval_seconds = interval_seconds
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._run, daemon=True)

    def _run(self) -> None:
        """Update one console line until the stop event is set."""
        dot_count = 1

        while not self.stop_event.is_set():
            dots = "." * dot_count
            print(f"\r{self.message}{dots}   ", end="", flush=True)
            dot_count = 1 if dot_count >= 3 else dot_count + 1
            self.stop_event.wait(self.interval_seconds)

    def __enter__(self) -> "DynamicProgressLine":
        """Start the animated progress line."""
        self.thread.start()
        return self

    def __exit__(self, exc_type: object, exc_value: object, traceback: object) -> None:
        """Stop the animation and replace it with a completed line."""
        self.stop_event.set()
        self.thread.join(timeout=2)
        print(f"\r{self.message} done.   ")


def normalize_zip_path(path: Path) -> str:
    """Return a ZIP-safe relative path using forward slashes."""
    return path.as_posix().strip("/")


def sanitize_filename_part(value: str, fallback: str) -> str:
    """Return a filesystem-safe filename component."""
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    cleaned = cleaned.strip("._-")
    return cleaned or fallback


def format_datetime(value: datetime) -> str:
    """Format a local datetime for human-readable console output."""
    return value.strftime("%Y-%m-%d %H:%M:%S")


def format_size(size_bytes: int) -> str:
    """Format a byte count as KB or MB for readable output."""
    size_kb = size_bytes / 1024
    size_mb = size_kb / 1024

    if size_mb >= 1:
        return f"{size_mb:.2f} MB"

    return f"{size_kb:.2f} KB"


def color_print(message: str, color: str | None = None) -> None:
    """Print a message with optional ANSI console color."""
    if color is None:
        print(message, flush=True)
        return

    color_codes = {
        "Green": "\033[92m",
        "Yellow": "\033[93m",
        "Red": "\033[91m",
    }

    reset_code = "\033[0m"
    color_code = color_codes.get(color)

    if color_code is None:
        print(message, flush=True)
        return

    print(f"{color_code}{message}{reset_code}", flush=True)


def directory_size_bytes(root: Path, excluded_paths: set[Path] | None = None) -> int:
    """Return the total file size under a directory."""
    if not root.exists():
        return 0

    excluded_resolved = {path.resolve() for path in excluded_paths or set()}
    total = 0

    for current_root, dir_names, file_names in os.walk(root):
        dir_names.sort()
        file_names.sort()
        current_path = Path(current_root)

        for file_name in file_names:
            file_path = current_path / file_name

            try:
                resolved_file = file_path.resolve()
            except OSError:
                continue

            if resolved_file in excluded_resolved:
                continue

            try:
                total += file_path.stat().st_size
            except OSError:
                continue

    return total


def directory_file_count(root: Path, excluded_paths: set[Path] | None = None) -> int:
    """Return the count of files under a directory."""
    if not root.exists():
        return 0

    excluded_resolved = {path.resolve() for path in excluded_paths or set()}
    total = 0

    for current_root, dir_names, file_names in os.walk(root):
        dir_names.sort()
        file_names.sort()
        current_path = Path(current_root)

        for file_name in file_names:
            file_path = current_path / file_name

            try:
                resolved_file = file_path.resolve()
            except OSError:
                continue

            if resolved_file in excluded_resolved:
                continue

            if file_path.is_file():
                total += 1

    return total


def capture_size_snapshot(repo_root: Path, output_zip_path: Path | None = None) -> SizeSnapshot:
    """Capture total repository size plus .git folder size and file count."""
    excluded_paths = {output_zip_path.resolve()} if output_zip_path is not None else set()
    git_root = repo_root / ".git"

    return SizeSnapshot(
        total_bytes=directory_size_bytes(repo_root, excluded_paths),
        git_bytes=directory_size_bytes(git_root),
        git_file_count=directory_file_count(git_root),
    )


def print_git_checkpoint(label: str, snapshot: SizeSnapshot) -> None:
    """Print one clearly named .git size and file-count checkpoint."""
    print(f"{label}:")
    print(f"- .git folder size: {format_size(snapshot.git_bytes)}")
    print(f"- .git file count: {snapshot.git_file_count}")


def describe_git_delta(before_snapshot: SizeSnapshot, after_snapshot: SizeSnapshot) -> str:
    """Return a compact size/count delta string between two .git checkpoints."""
    size_delta = after_snapshot.git_bytes - before_snapshot.git_bytes
    count_delta = after_snapshot.git_file_count - before_snapshot.git_file_count
    sign_size = "+" if size_delta >= 0 else "-"
    sign_count = "+" if count_delta >= 0 else "-"
    return (
        f"size {sign_size}{format_size(abs(size_delta))}, "
        f"files {sign_count}{abs(count_delta)}"
    )


def has_git_changed(before_snapshot: SizeSnapshot, after_snapshot: SizeSnapshot) -> bool:
    """Return True when .git size or file count changed between checkpoints."""
    return (
        before_snapshot.git_bytes != after_snapshot.git_bytes
        or before_snapshot.git_file_count != after_snapshot.git_file_count
    )


def wait_for_keypress() -> None:
    """Wait for one key press before closing the console."""
    if os.name == "nt":
        try:
            import msvcrt

            msvcrt.getch()
            return
        except Exception:
            pass

    try:
        input()
    except EOFError:
        pass


def read_version_value(repo_root: Path) -> str:
    """Read the root VERSION file, falling back safely when it is missing."""
    version_path = repo_root / "VERSION"
    if not version_path.exists() or not version_path.is_file():
        return "NO_VERSION"

    for line in version_path.read_text(encoding="utf-8", errors="replace").splitlines():
        value = line.strip()
        if value:
            return value

    return "NO_VERSION"


def build_default_output_zip_path(repo_root: Path) -> Path:
    """Build {project_root_folder}--v{VERSION}--{HH.MM.SS-DDMMYY}.zip."""
    repo_root = repo_root.resolve()
    project_folder = sanitize_filename_part(repo_root.name, "repo")
    version_value = sanitize_filename_part(read_version_value(repo_root), "NO_VERSION")
    creation_datetime = datetime.now().strftime("%H.%M.%S-%d%m%y")
    return repo_root / f"{project_folder}--v{version_value}--{creation_datetime}.zip"


def load_ignore_config(config_path: Path | None) -> IgnoreConfig:
    """Load optional JSON ignore rules."""
    if config_path is None:
        return DEFAULT_IGNORE_CONFIG

    if not config_path.exists():
        return DEFAULT_IGNORE_CONFIG

    with config_path.open("r", encoding="utf-8") as file:
        raw = json.load(file)

    return IgnoreConfig(
        files=tuple(str(item) for item in raw.get("files", [])),
        directories=tuple(str(item) for item in raw.get("directories", [])),
        patterns=tuple(str(item) for item in raw.get("patterns", [])),
    )


def is_inside_git_metadata(rel_path: str) -> bool:
    """Return True when a relative path belongs to .git metadata."""
    return rel_path == ".git" or rel_path.startswith(".git/")


def run_git_check_ignore(repo_root: Path, rel_path: str) -> bool:
    """
    Return True when Git says the path is ignored.

    .git metadata is intentionally never excluded by this check because this
    utility is designed to produce a ZIP that preserves repository history.
    """
    if is_inside_git_metadata(rel_path):
        return False

    try:
        result = subprocess.run(
            ["git", "check-ignore", "--quiet", "--", rel_path],
            cwd=repo_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def run_git_gc_prune_now(repo_root: Path) -> None:
    """Run Git garbage collection before packaging to compact repository metadata."""
    if not (repo_root / ".git").exists():
        raise FileNotFoundError("No .git folder found. This packager must be run from a Git repository root.")

    print("Running git gc --prune=now before packaging.")

    try:
        result = subprocess.run(
            ["git", "gc", "--prune=now"],
            cwd=repo_root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    except FileNotFoundError as error:
        raise FileNotFoundError("git.exe was not found on PATH. Install Git for Windows or add it to PATH.") from error

    if result.stdout.strip():
        print(result.stdout.strip())

    if result.returncode != 0:
        stderr = result.stderr.strip() or "git gc failed without stderr output."
        raise RuntimeError(f"git gc --prune=now failed with exit code {result.returncode}: {stderr}")

    if result.stderr.strip():
        print(result.stderr.strip())

    print("git gc --prune=now completed successfully.")


def path_matches_extra_ignore(rel_path: str, config: IgnoreConfig) -> bool:
    """Apply JSON ignore rules to a normalized relative path."""
    if is_inside_git_metadata(rel_path):
        return False

    path_parts = rel_path.split("/")

    for ignored_file in config.files:
        normalized = ignored_file.strip("/")
        if rel_path == normalized:
            return True

    for ignored_dir in config.directories:
        normalized = ignored_dir.strip("/")
        if not normalized:
            continue
        if normalized in path_parts:
            return True
        if rel_path == normalized or rel_path.startswith(f"{normalized}/"):
            return True

    for pattern in config.patterns:
        normalized = pattern.strip()
        if not normalized:
            continue
        if fnmatch.fnmatch(rel_path, normalized):
            return True
        if fnmatch.fnmatch(Path(rel_path).name, normalized):
            return True

    return False


def iter_repo_files(repo_root: Path) -> Iterable[Path]:
    """Yield files in deterministic order for stable ZIP output."""
    for current_root, dir_names, file_names in os.walk(repo_root):
        dir_names.sort()
        file_names.sort()
        current_path = Path(current_root)

        for file_name in file_names:
            yield current_path / file_name


def should_include_file(
    repo_root: Path,
    file_path: Path,
    output_zip_path: Path,
    config: IgnoreConfig,
) -> bool:
    """Return True when a file should be added to the output ZIP."""
    resolved_file = file_path.resolve()
    resolved_output = output_zip_path.resolve()

    if resolved_file == resolved_output:
        return False

    rel_path = normalize_zip_path(file_path.relative_to(repo_root))

    if path_matches_extra_ignore(rel_path, config):
        return False

    if run_git_check_ignore(repo_root, rel_path):
        return False

    return True


def write_manifest(manifest_path: Path, output_zip_path: Path, added: list[str], skipped_count: int) -> None:
    """Write a small packaging manifest for traceability."""
    manifest = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "output_zip": str(output_zip_path.resolve()),
        "files_added_count": len(added),
        "files_skipped_count": skipped_count,
        "includes_git_history": any(path == ".git/HEAD" or path.startswith(".git/") for path in added),
        "files_added": added,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def create_repo_zip(
    repo_root: Path,
    output_zip_path: Path,
    config: IgnoreConfig,
    manifest_path: Path | None,
) -> tuple[int, int]:
    """Create the ZIP and return added/skipped file counts."""
    repo_root = repo_root.resolve()
    output_zip_path = output_zip_path.resolve()

    if not repo_root.exists():
        raise FileNotFoundError(f"Repository path does not exist: {repo_root}")

    if not repo_root.is_dir():
        raise NotADirectoryError(f"Repository path is not a directory: {repo_root}")

    output_zip_path.parent.mkdir(parents=True, exist_ok=True)

    added: list[str] = []
    skipped_count = 0

    print("Creating ZIP archive.")

    with DynamicProgressLine("Scanning repository files"):
        with zipfile.ZipFile(output_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in iter_repo_files(repo_root):
                rel_path = normalize_zip_path(file_path.relative_to(repo_root))

                if should_include_file(repo_root, file_path, output_zip_path, config):
                    zip_file.write(file_path, rel_path)
                    added.append(rel_path)
                else:
                    skipped_count += 1

    print(f"Files added: {len(added)}")
    print(f"Files skipped: {skipped_count}")
    print("ZIP archive write completed.")

    if manifest_path is not None:
        with DynamicProgressLine("Writing manifest"):
            write_manifest(manifest_path, output_zip_path, added, skipped_count)

    return len(added), skipped_count


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the embedded packager."""
    parser = argparse.ArgumentParser(
        description="Create a repository ZIP with .git history while excluding .gitignore and JSON ignore matches."
    )
    parser.add_argument("--repo", default=".", help="Repository folder to package. Default: current directory.")
    parser.add_argument(
        "--out",
        default="",
        help=(
            "Output ZIP path. Default: auto-generate "
            "{project_root_folder}--v{VERSION}--{HH.MM.SS-DDMMYY}.zip using the root VERSION file."
        ),
    )
    parser.add_argument(
        "--ignore-json",
        default="zip_ignore.json",
        help="Additional JSON ignore config. Default: zip_ignore.json.",
    )
    parser.add_argument(
        "--manifest",
        nargs="?",
        const="",
        default="",
        help="Optional manifest output path. If omitted or provided without a value, manifest output is disabled.",
    )
    return parser.parse_args()


def print_final_report(
    start_datetime: datetime,
    start_perf: float,
    before_gc_snapshot: SizeSnapshot,
    after_gc_snapshot: SizeSnapshot,
    after_zip_snapshot: SizeSnapshot,
    output_zip_path: Path,
    success: bool,
) -> None:
    """Print the required final timing and clearly labeled size report."""
    end_datetime = datetime.now()
    elapsed_seconds = time.perf_counter() - start_perf
    final_color = "Green" if success else "Red"
    output_zip_size = output_zip_path.stat().st_size if output_zip_path.exists() else 0

    print("")
    color_print(f"Finished TRANSFERABLE_REPO_PACKAGER at {format_datetime(end_datetime)}.", final_color)
    color_print(f"Time taken: {elapsed_seconds:.2f} seconds.", final_color)
    color_print(f"Repository size before ZIP creation: {format_size(after_gc_snapshot.total_bytes)}.", final_color)
    color_print(f"Created ZIP size: {format_size(output_zip_size)}.", final_color)
    color_print("Git metadata checkpoints:", final_color)
    color_print(f"- before git gc: {format_size(before_gc_snapshot.git_bytes)}, {before_gc_snapshot.git_file_count} files.", final_color)
    color_print(f"- after git gc: {format_size(after_gc_snapshot.git_bytes)}, {after_gc_snapshot.git_file_count} files.", final_color)
    color_print(f"- after ZIP creation: {format_size(after_zip_snapshot.git_bytes)}, {after_zip_snapshot.git_file_count} files.", final_color)
    color_print(f"Git gc delta: {describe_git_delta(before_gc_snapshot, after_gc_snapshot)}.", final_color)
    color_print(f"ZIP creation delta: {describe_git_delta(after_gc_snapshot, after_zip_snapshot)}.", final_color)
    if has_git_changed(after_gc_snapshot, after_zip_snapshot):
        color_print("WARNING: .git changed during ZIP creation or ignore scanning.", "Yellow")
    color_print("Press any key to exit.", final_color)


def main() -> int:
    """Run the repo packaging flow and keep the console open with clear status output."""
    start_datetime = datetime.now()
    start_perf = time.perf_counter()

    color_print(f"Started TRANSFERABLE_REPO_PACKAGER at {format_datetime(start_datetime)}", "Green")

    args = parse_args()

    repo_root = Path(args.repo).resolve()
    output_zip_path = Path(args.out).resolve() if args.out else build_default_output_zip_path(repo_root)
    ignore_json_path = Path(args.ignore_json) if args.ignore_json else None
    manifest_path = Path(args.manifest) if args.manifest else None

    before_gc_snapshot = SizeSnapshot(total_bytes=0, git_bytes=0, git_file_count=0)
    after_gc_snapshot = SizeSnapshot(total_bytes=0, git_bytes=0, git_file_count=0)
    after_zip_snapshot = SizeSnapshot(total_bytes=0, git_bytes=0, git_file_count=0)

    try:
        print(f"Repository: {repo_root}")
        print(f"Filename to create: {output_zip_path.name}")
        print(f"Output ZIP path: {output_zip_path}")

        with DynamicProgressLine("Capturing .git checkpoint before git gc"):
            before_gc_snapshot = capture_size_snapshot(repo_root, output_zip_path)

        print_git_checkpoint(".git checkpoint before git gc", before_gc_snapshot)

        with DynamicProgressLine("Compacting Git database"):
            run_git_gc_prune_now(repo_root)

        with DynamicProgressLine("Capturing repository and .git checkpoint after git gc"):
            after_gc_snapshot = capture_size_snapshot(repo_root, output_zip_path)

        print(f"Repository size before ZIP creation: {format_size(after_gc_snapshot.total_bytes)}")
        print_git_checkpoint(".git checkpoint after git gc", after_gc_snapshot)
        print(f"Git gc delta: {describe_git_delta(before_gc_snapshot, after_gc_snapshot)}")

        with DynamicProgressLine("Loading ignore rules"):
            config = load_ignore_config(ignore_json_path)

        print("Ignore rules loaded.")
        print("Packaging will preserve .git history.")

        added_count, skipped_count = create_repo_zip(repo_root, output_zip_path, config, manifest_path)

        print("")
        print("Repo ZIP created successfully.")
        print(f"Created filename: {output_zip_path.name}")
        print(f"Output ZIP: {output_zip_path}")
        if output_zip_path.exists():
            print(f"Output ZIP size: {format_size(output_zip_path.stat().st_size)}")
        if manifest_path is not None:
            print(f"Manifest: {manifest_path.resolve()}")
        print(f"Files added: {added_count}")
        print(f"Files skipped: {skipped_count}")
        print("Calculating created ZIP size and post-ZIP .git checkpoint.")
        after_zip_snapshot = capture_size_snapshot(repo_root, output_zip_path)
        print_git_checkpoint(".git checkpoint after ZIP creation", after_zip_snapshot)
        print(f"ZIP creation delta: {describe_git_delta(after_gc_snapshot, after_zip_snapshot)}")
        if has_git_changed(after_gc_snapshot, after_zip_snapshot):
            color_print("WARNING: .git changed during ZIP creation or ignore scanning.", "Yellow")

        print_final_report(start_datetime, start_perf, before_gc_snapshot, after_gc_snapshot, after_zip_snapshot, output_zip_path, True)
        wait_for_keypress()
        return 0
    except Exception as error:
        color_print(f"ERROR: {error}", "Red")
        try:
            after_zip_snapshot = capture_size_snapshot(repo_root, output_zip_path)
        except Exception:
            after_zip_snapshot = after_gc_snapshot
        print_final_report(start_datetime, start_perf, before_gc_snapshot, after_gc_snapshot, after_zip_snapshot, output_zip_path, False)
        wait_for_keypress()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
'@

$ignoreJsonSource = @'
{
  "files": [
    "repo_package.zip",
    "packaged_repo.zip",
    "repo_zip_packager.zip",
    "repo_zip_packager_regen.zip",
    "CREATE_TRANSFERABLE.cmd",
    "pack_repo_zip.py",
    "zip_ignore.json",
    "repo_package_manifest.json"
  ],
  "directories": [
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".vscode",
    ".idea",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "tmp",
    "temp"
  ],
  "patterns": [
    "*.zip",
    "*.7z",
    "*.rar",
    "*.tar",
    "*.tar.gz",
    "*.tmp",
    "*.temp",
    "*.bak",
    "*.swp",
    "*.pyc",
    "*.pyo",
    "*.log",
    "log_*.log",
    "*.sqlite-wal",
    "*.sqlite-shm",
    ".DS_Store",
    "Thumbs.db"
  ]
}
'@

try {
  [IO.File]::WriteAllText($packagerPath, $packagerSource, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($ignorePath, $ignoreJsonSource, [Text.UTF8Encoding]::new($false))

  py $packagerPath --repo . --ignore-json $ignorePath
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Python packager exited with code $exitCode" -ForegroundColor Red
    Write-Host "Press any key to exit." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
  }

  exit $exitCode
} catch {
  Write-Host ""
  Write-Host "ERROR: TRANSFERABLE_REPO_PACKAGER failed before Python packaging could finish." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "Press any key to exit." -ForegroundColor Red
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
  exit 1
} finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}