#!/usr/bin/env bash
set -euo pipefail

# Raspberry OS PhotoFrame ZIP extractor.
#
# Default workflow:
#   Put this script in: /home/mihkel/Download_chrome
#   Put exactly ONE PhotoFrame/PF ZIP next to it.
#   Run: ./unzip_latest_photoframe.sh
#
# Defaults:
#   ZIP search folder, no subfolders: /home/mihkel/Download_chrome
#   Target base folder:           /home/mihkel/Download_chrome/Photoframe_proofing
#   ZIP archive folder:           /home/mihkel/Download_chrome/zip_repo_archive

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required but was not found." >&2
  exit 1
fi

python3 - "$@" <<'PY'
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

DEFAULT_DOWNLOAD_DIR = Path("/home/mihkel/Download_chrome")
DEFAULT_TARGET_BASE = Path("/home/mihkel/Download_chrome/Photoframe_proofing")
DEFAULT_ARCHIVE_DIR = Path("/home/mihkel/Download_chrome/zip_repo_archive")
CUSTOM_VARIABLES_LOCATION = Path("/home/mihkel/Download_chrome/Photoframe_proofing/.env")

FILENAME_RE = re.compile(
    r"^(?P<project>PF[^/]*)--(?P<version>v\d+(?:\.\d+)+)(?:--.*)?\.zip$",
    re.IGNORECASE,
)
SAFE_FOLDER_RE = re.compile(r"[^A-Za-z0-9._-]+")


@dataclass(frozen=True)
class ParsedZip:
    zip_path: Path
    project: str
    version: str


@dataclass(frozen=True)
class PlannedPaths:
    folder_base_name: str
    suffix_text: str
    target_path: Path
    archive_path: Path


def sanitize_folder_name(value: str) -> str:
    cleaned = SAFE_FOLDER_RE.sub("_", value.strip().replace(" ", "_"))
    cleaned = cleaned.strip("._-")
    if not cleaned:
        raise ValueError("folder name became empty after sanitizing")
    return cleaned


def log_path(target_base: Path) -> Path:
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    return target_base / "logs" / f"unzip_latest_photoframe_{timestamp}.log"


def write_log(path: Path, lines: list[str]) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"log: {path}")
    except Exception as exc:
        fallback = Path.cwd() / f"unzip_latest_photoframe_error_{int(time.time())}.log"
        fallback.write_text("\n".join(lines + [f"log-write-fallback-reason: {exc}"]) + "\n", encoding="utf-8")
        print(f"log: {fallback}")


def press_any_key_then_exit(message: str, target_base: Path, code: int = 1) -> None:
    print(message)
    path = log_path(target_base)
    write_log(path, [
        f"time: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "status: error",
        f"message: {message}",
    ])
    if sys.stdin.isatty():
        try:
            import termios
            import tty
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        except Exception:
            input("Press Enter to exit...")
    raise SystemExit(code)


def die(message: str, code: int = 1) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(code)


def parse_zip_filename(zip_path: Path) -> ParsedZip:
    match = FILENAME_RE.match(zip_path.name)
    if not match:
        die(
            "ZIP filename does not match expected PhotoFrame format. "
            "Expected something like PF_login--v0.8.85--description-full_git.zip"
        )
    project = sanitize_folder_name(match.group("project"))
    version = match.group("version")
    return ParsedZip(zip_path=zip_path, project=project, version=version)


def list_zip_files_no_subfolders(download_dir: Path) -> list[Path]:
    if not download_dir.exists():
        die(f"download folder does not exist: {download_dir}")
    if not download_dir.is_dir():
        die(f"download path is not a folder: {download_dir}")
    return sorted(
        path for path in download_dir.iterdir()
        if path.is_file() and path.suffix.lower() == ".zip"
    )


def archive_name_for(zip_path: Path, suffix_text: str) -> str:
    if not suffix_text:
        return zip_path.name
    return f"{zip_path.stem}{suffix_text}{zip_path.suffix}"


def choose_incremented_paths(parsed: ParsedZip, target_base: Path, archive_dir: Path) -> PlannedPaths:
    target_base = target_base.expanduser().resolve()
    archive_dir = archive_dir.expanduser().resolve()
    folder_base_name = sanitize_folder_name(f"{parsed.project}_{parsed.version}")

    for number in range(0, 10000):
        suffix_text = "" if number == 0 else f"_{number}"
        target_path = target_base / f"{folder_base_name}{suffix_text}"
        archive_path = archive_dir / archive_name_for(parsed.zip_path, suffix_text)
        if not target_path.exists() and not archive_path.exists():
            return PlannedPaths(folder_base_name, suffix_text, target_path, archive_path)

    die("could not find a free numeric suffix under 10000")


def choose_replace_paths(parsed: ParsedZip, target_base: Path, archive_dir: Path) -> PlannedPaths:
    target_base = target_base.expanduser().resolve()
    archive_dir = archive_dir.expanduser().resolve()
    folder_base_name = sanitize_folder_name(f"{parsed.project}_{parsed.version}")
    archive_path = archive_dir / parsed.zip_path.name
    if archive_path.exists():
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        archive_path = archive_dir / f"{parsed.zip_path.stem}_replaced_{timestamp}{parsed.zip_path.suffix}"
    return PlannedPaths(folder_base_name, "", target_base / folder_base_name, archive_path)


def usable_members(zf: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    members: list[zipfile.ZipInfo] = []
    for info in zf.infolist():
        name = info.filename.replace("\\", "/")
        if not name or name.endswith("/"):
            continue
        parts = PurePosixPath(name).parts
        if not parts:
            continue
        if parts[0] == "__MACOSX":
            continue
        if PurePosixPath(name).name == ".DS_Store":
            continue
        members.append(info)
    return members


def single_top_folder_to_strip(names: list[str]) -> str | None:
    top_parts: set[str] = set()
    has_file_at_zip_root = False
    for name in names:
        parts = PurePosixPath(name).parts
        if not parts:
            continue
        top_parts.add(parts[0])
        if len(parts) == 1:
            has_file_at_zip_root = True
    if len(top_parts) == 1 and not has_file_at_zip_root:
        return next(iter(top_parts))
    return None


def safe_relative_output_path(zip_name: str, strip_top: str | None) -> Path:
    pure = PurePosixPath(zip_name.replace("\\", "/"))
    if pure.is_absolute():
        die(f"unsafe absolute path inside ZIP: {zip_name}")
    if any(part == ".." for part in pure.parts):
        die(f"unsafe parent traversal inside ZIP: {zip_name}")

    parts = list(pure.parts)
    if strip_top is not None:
        if not parts or parts[0] != strip_top:
            die(f"unexpected ZIP root structure while stripping top folder: {zip_name}")
        parts = parts[1:]

    if not parts:
        die(f"empty output path after stripping ZIP root folder: {zip_name}")
    if any(part in ("", ".", "..") for part in parts):
        die(f"unsafe path component inside ZIP: {zip_name}")
    return Path(*parts)


def ensure_inside(base: Path, path: Path) -> None:
    base_resolved = base.resolve()
    path_resolved = path.resolve()
    try:
        path_resolved.relative_to(base_resolved)
    except ValueError:
        die(f"refusing to write outside target base: {path_resolved}")


def repo_marker_found(root: Path) -> bool:
    return any((root / marker).exists() for marker in ["package.json", "VERSION", "README.md", ".git"])


def extract(parsed: ParsedZip, paths: PlannedPaths, target_base: Path, dry_run: bool, replace: bool) -> Path:
    target_base = target_base.expanduser().resolve()
    staging_path = target_base / f".extracting_{paths.target_path.name}_{os.getpid()}_{int(time.time())}"

    print(f"project: {parsed.project}")
    print(f"version: {parsed.version}")
    if paths.suffix_text:
        print(f"suffix: {paths.suffix_text}")
    else:
        print("suffix: none")
    print(f"target: {paths.target_path}")
    print(f"archive target: {paths.archive_path}")
    print(f"custom variables location: {CUSTOM_VARIABLES_LOCATION}")

    ensure_inside(target_base, paths.target_path)
    ensure_inside(target_base, staging_path)

    with zipfile.ZipFile(parsed.zip_path) as zf:
        members = usable_members(zf)
        if not members:
            die("ZIP contains no usable files")

        names = [member.filename.replace("\\", "/") for member in members]
        strip_top = single_top_folder_to_strip(names)
        if strip_top:
            print(f"zip root: single top-level folder found, stripping: {strip_top}")
        else:
            print("zip root: repo files appear to be at ZIP root, no folder stripping needed")

        if dry_run:
            print("dry-run: no files extracted, zip not archived, folder not opened")
            return paths.target_path

        target_base.mkdir(parents=True, exist_ok=True)
        if staging_path.exists():
            shutil.rmtree(staging_path)
        staging_path.mkdir(parents=True)

        try:
            for member in members:
                rel = safe_relative_output_path(member.filename, strip_top)
                output_path = staging_path / rel
                ensure_inside(staging_path, output_path)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member) as src, output_path.open("wb") as dst:
                    shutil.copyfileobj(src, dst)

            if not repo_marker_found(staging_path):
                die("extracted files do not look like a repository root; expected package.json, VERSION, README.md, or .git")

            copy_custom_variables_file(staging_path, display_repo_folder=paths.target_path)

            if replace and paths.target_path.exists():
                archive_old_folder = target_base / f"{paths.folder_base_name}_superseded_{time.strftime('%Y%m%d_%H%M%S')}"
                ensure_inside(target_base, archive_old_folder)
                print(f"existing target moved to: {archive_old_folder}")
                paths.target_path.rename(archive_old_folder)
            elif paths.target_path.exists():
                die(f"target unexpectedly appeared before final move: {paths.target_path}")

            staging_path.rename(paths.target_path)
            print("done: extracted photoframe repo")
            print(f"repo folder: {paths.target_path}")
            return paths.target_path
        except Exception:
            shutil.rmtree(staging_path, ignore_errors=True)
            raise



def copy_custom_variables_file(repo_folder: Path, source_path: Path = CUSTOM_VARIABLES_LOCATION, display_repo_folder: Path | None = None) -> Path:
    source = source_path.expanduser().resolve()
    if not source.exists():
        die(f"custom variables file missing: {source}")
    if not source.is_file():
        die(f"custom variables path is not a file: {source}")

    target = repo_folder / ".env"
    ensure_inside(repo_folder, target)
    shutil.copy2(source, target)
    display_target = (display_repo_folder / ".env") if display_repo_folder is not None else target
    print(f"copied custom variables: {source} -> {display_target}")
    return target

def archive_zip(zip_path: Path, archive_path: Path) -> Path:
    archive_path = archive_path.expanduser().resolve()
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    if archive_path.exists():
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        archive_path = archive_path.parent / f"{archive_path.stem}_archive_collision_{timestamp}{archive_path.suffix}"
    shutil.move(str(zip_path), str(archive_path))
    print(f"archived zip: {archive_path}")
    return archive_path


def gui_environment_available() -> bool:
    return bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))


def launch_first_available(label: str, command_variants: list[list[str]]) -> bool:
    if not gui_environment_available():
        print(f"{label}: skipped, no GUI DISPLAY/WAYLAND_DISPLAY detected")
        return False

    for command in command_variants:
        executable = command[0]
        if shutil.which(executable) is None:
            continue
        try:
            subprocess.Popen(
                command,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            print(f"{label}: opened using {' '.join(command)}")
            return True
        except Exception as exc:
            print(f"{label}: failed using {' '.join(command)}: {exc}")
    print(f"{label}: no supported opener found")
    return False


def open_repo_folder(repo_folder: Path) -> None:
    repo_folder_str = str(repo_folder)

    launch_first_available("terminal", [
        ["lxterminal", f"--working-directory={repo_folder_str}"],
        ["x-terminal-emulator", f"--working-directory={repo_folder_str}"],
        ["xfce4-terminal", f"--working-directory={repo_folder_str}"],
        ["mate-terminal", f"--working-directory={repo_folder_str}"],
        ["gnome-terminal", f"--working-directory={repo_folder_str}"],
        ["konsole", "--workdir", repo_folder_str],
        ["qterminal", "--workdir", repo_folder_str],
    ])

    launch_first_available("file explorer", [
        ["pcmanfm", repo_folder_str],
        ["pcmanfm-qt", repo_folder_str],
        ["xdg-open", repo_folder_str],
    ])


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Extract the single PhotoFrame ZIP from /home/mihkel/Download_chrome.")
    parser.add_argument("--download-dir", type=Path, default=DEFAULT_DOWNLOAD_DIR)
    parser.add_argument("--target-base", type=Path, default=DEFAULT_TARGET_BASE)
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_ARCHIVE_DIR)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--replace", action="store_true", help="Replace the exact base folder instead of using numeric suffixes.")
    parser.add_argument("--no-open", action="store_true", help="Do not open terminal or file explorer after extraction.")
    args = parser.parse_args(argv)

    download_dir = args.download_dir.expanduser().resolve()
    target_base = args.target_base.expanduser()
    archive_dir = args.archive_dir.expanduser()

    zip_files = list_zip_files_no_subfolders(download_dir)
    zip_count = len(zip_files)

    if zip_count == 0:
        die(f"0 zips found in {download_dir}")

    if zip_count > 1:
        message = "error, implement fix for 'more than one zip', please press any key to log and exit"
        press_any_key_then_exit(message, target_base, code=2)

    print("1 zip found")
    parsed = parse_zip_filename(zip_files[0])
    paths = choose_replace_paths(parsed, target_base, archive_dir) if args.replace else choose_incremented_paths(parsed, target_base, archive_dir)
    repo_folder = extract(parsed, paths, target_base, dry_run=args.dry_run, replace=args.replace)

    if args.dry_run:
        return 0

    archive_zip(parsed.zip_path, paths.archive_path)

    if args.no_open:
        print("open: skipped because --no-open was used")
    else:
        open_repo_folder(repo_folder)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
PY
