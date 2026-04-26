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

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Packaging failed with exit code %EXIT_CODE%.
  pause
)

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
import subprocess
import sys
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
import re
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class IgnoreConfig:
    files: tuple[str, ...]
    directories: tuple[str, ...]
    patterns: tuple[str, ...]


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


def normalize_zip_path(path: Path) -> str:
    """Return a ZIP-safe relative path using forward slashes."""
    return path.as_posix().strip("/")


def sanitize_filename_part(value: str, fallback: str) -> str:
    """Return a filesystem-safe filename component."""
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    cleaned = cleaned.strip("._-")
    return cleaned or fallback


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
    """Build {project_root_folder}_{creation_datetime}_{VERSION}.zip."""
    repo_root = repo_root.resolve()
    project_folder = sanitize_filename_part(repo_root.name, "repo")
    version_value = sanitize_filename_part(read_version_value(repo_root), "NO_VERSION")
    creation_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
    return repo_root / f"{project_folder}_{creation_datetime}_{version_value}.zip"


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

    with zipfile.ZipFile(output_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in iter_repo_files(repo_root):
            rel_path = normalize_zip_path(file_path.relative_to(repo_root))

            if should_include_file(repo_root, file_path, output_zip_path, config):
                zip_file.write(file_path, rel_path)
                added.append(rel_path)
            else:
                skipped_count += 1

    if manifest_path is not None:
        write_manifest(manifest_path, output_zip_path, added, skipped_count)

    return len(added), skipped_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a repository ZIP with .git history while excluding .gitignore and JSON ignore matches."
    )
    parser.add_argument("--repo", default=".", help="Repository folder to package. Default: current directory.")
    parser.add_argument(
        "--out",
        default="",
        help=(
            "Output ZIP path. Default: auto-generate "
            "{project_root_folder}_{YYYYMMDD_HHMMSS}_{VERSION}.zip using the root VERSION file."
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


def main() -> int:
    args = parse_args()

    repo_root = Path(args.repo)
    output_zip_path = Path(args.out) if args.out else build_default_output_zip_path(repo_root)
    ignore_json_path = Path(args.ignore_json) if args.ignore_json else None
    manifest_path = Path(args.manifest) if args.manifest else None

    try:
        config = load_ignore_config(ignore_json_path)
        added_count, skipped_count = create_repo_zip(repo_root, output_zip_path, config, manifest_path)

        print("Repo ZIP created successfully.")
        print(f"Repository: {repo_root.resolve()}")
        print(f"Output ZIP: {output_zip_path.resolve()}")
        if manifest_path is not None:
            print(f"Manifest: {manifest_path.resolve()}")
        print(f"Files added: {added_count}")
        print(f"Files skipped: {skipped_count}")
        return 0
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
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
    "TRANSFERABLE_REPO_PACKAGER.cmd",
    "CREATE_TRASNFERABLE.cmd",
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
  exit $LASTEXITCODE
} finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
