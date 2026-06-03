"""
Validates the generated_test_data video fixture repair.
The checks focus on the documented Apple-style video mismatch from the handoff.
It verifies folder/file shape, manifest agreement, README path references, and media metadata.
It uses ffprobe when available and records clear failures instead of claiming unsupported proof.
Run this from the repository root after fixture generation or extraction.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DATASET_ROOT = Path("generated_test_data")
README_PATH = DATASET_ROOT / "README.md"
MANIFEST_PATH = DATASET_ROOT / "manifest.json"
EXPECTED_FIXTURES = {
    "videos_with_gps/apple_like_h264_mov_gps_tallinn.mov": True,
    "videos_with_gps/apple_like_h264_mov_gps_tokyo.mov": True,
    "videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4": True,
    "videos_no_gps/apple_like_h264_mov_no_gps.mov": False,
    "videos_no_gps/apple_like_h264_mp4_no_gps.mp4": False,
}
EXPECTED_DIRECTORIES = ("videos_with_gps", "videos_no_gps")


@dataclass
class CheckResult:
    """Stores one validation result and the message shown in proof logs."""

    ok: bool
    message: str


class Validator:
    """Collects validation results and prints a pass/fail proof summary."""

    def __init__(self) -> None:
        self.results: list[CheckResult] = []

    def check(self, condition: bool, message: str) -> None:
        """Append one check result without stopping later independent checks."""

        self.results.append(CheckResult(condition, message))

    def fail_count(self) -> int:
        """Return the number of failed checks collected so far."""

        return sum(1 for result in self.results if not result.ok)

    def print_summary(self) -> None:
        """Print all check results in a stable, greppable format."""

        for result in self.results:
            prefix = "PASS" if result.ok else "FAIL"
            print(f"[{prefix}] {result.message}")
        print(f"SUMMARY: {len(self.results) - self.fail_count()} passed, {self.fail_count()} failed")


def normalize_manifest_path(path_text: str) -> str:
    """Normalize Windows or POSIX manifest path separators for comparison."""

    return path_text.replace("\\", "/")


def sha256_file(path: Path) -> str:
    """Return the SHA-256 hex digest for one fixture file."""

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_manifest() -> dict[str, Any]:
    """Load manifest.json as a dictionary."""

    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def find_manifest_records(manifest: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Index manifest records by normalized relative path."""

    records: dict[str, dict[str, Any]] = {}
    for record in manifest.get("records", []):
        path_text = record.get("path")
        if isinstance(path_text, str):
            records[normalize_manifest_path(path_text)] = record
    return records


def ffprobe(path: Path) -> dict[str, Any]:
    """Run ffprobe and return parsed JSON metadata for one fixture."""

    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        str(path),
    ]
    completed = subprocess.run(command, check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


def get_video_stream(probe: dict[str, Any]) -> dict[str, Any] | None:
    """Return the first video stream from ffprobe output."""

    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "video":
            return stream
    return None


def get_audio_stream(probe: dict[str, Any]) -> dict[str, Any] | None:
    """Return the first audio stream from ffprobe output."""

    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "audio":
            return stream
    return None


def has_location_tag(probe: dict[str, Any]) -> bool:
    """Detect QuickTime-style location metadata in format tags."""

    tags = probe.get("format", {}).get("tags", {})
    return any("location" in key.lower() for key in tags)


def check_filesystem(validator: Validator) -> None:
    """Validate repaired directory shape and expected fixture files."""

    validator.check(DATASET_ROOT.is_dir(), "generated_test_data exists as a directory")
    validator.check(README_PATH.is_file(), "generated_test_data/README.md exists")
    validator.check(MANIFEST_PATH.is_file(), "generated_test_data/manifest.json exists")
    for relative in EXPECTED_DIRECTORIES:
        path = DATASET_ROOT / relative
        validator.check(path.is_dir(), f"{relative} is a directory")
        validator.check(not path.is_file(), f"{relative} is not a file")
    for relative in EXPECTED_FIXTURES:
        path = DATASET_ROOT / relative
        validator.check(path.is_file(), f"{relative} exists as a file")
        validator.check(path.exists() and path.stat().st_size > 0, f"{relative} is non-empty")


def check_manifest(validator: Validator, manifest: dict[str, Any]) -> None:
    """Validate manifest summary, arguments, records, sizes, and hashes."""

    records = find_manifest_records(manifest)
    summary = manifest.get("summary", {})
    arguments = manifest.get("arguments", {})
    validator.check(summary.get("videos_with_gps") == 3, "manifest summary videos_with_gps is 3")
    validator.check(summary.get("videos_no_gps") == 2, "manifest summary videos_no_gps is 2")
    validator.check(arguments.get("include_videos") is True, "manifest arguments.include_videos is true")
    validator.check(arguments.get("video_gps_count") == 3, "manifest arguments.video_gps_count is 3")
    validator.check(arguments.get("video_no_gps_count") == 2, "manifest arguments.video_no_gps_count is 2")
    for relative, expect_location in EXPECTED_FIXTURES.items():
        record = records.get(relative)
        path = DATASET_ROOT / relative
        validator.check(record is not None, f"manifest record exists for {relative}")
        if record and path.exists():
            validator.check(record.get("size_bytes") == path.stat().st_size, f"manifest size matches {relative}")
            validator.check(record.get("sha256") == sha256_file(path), f"manifest sha256 matches {relative}")
            validator.check(record.get("location_tag_present") is expect_location, f"manifest location flag matches {relative}")


def check_readme_paths(validator: Validator) -> None:
    """Validate that README code-span fixture paths point to existing files or directories."""

    text = README_PATH.read_text(encoding="utf-8")
    expected_mentions = [*EXPECTED_FIXTURES.keys(), "videos_with_gps/", "videos_no_gps/"]
    for mention in expected_mentions:
        validator.check(mention in text, f"README mentions {mention}")

    path_mentions = sorted(set(re.findall(r"`([^`]+/)`|`([^`]+\.(?:mov|mp4|json))`", text)))
    for dir_match, file_match in path_mentions:
        mention = dir_match or file_match
        if mention == "manifest.json":
            path = MANIFEST_PATH
        else:
            path = DATASET_ROOT / mention.rstrip("/")
        validator.check(path.exists(), f"README path exists: {mention}")


def check_media(validator: Validator) -> None:
    """Validate media metadata for repaired fixtures through ffprobe."""

    validator.check(shutil.which("ffprobe") is not None, "ffprobe is available")
    if shutil.which("ffprobe") is None:
        return
    for relative, expect_location in EXPECTED_FIXTURES.items():
        path = DATASET_ROOT / relative
        if not path.is_file():
            continue
        try:
            probe = ffprobe(path)
        except (subprocess.CalledProcessError, json.JSONDecodeError) as exc:
            validator.check(False, f"ffprobe parses {relative}: {exc}")
            continue
        video = get_video_stream(probe)
        audio = get_audio_stream(probe)
        duration = float(probe.get("format", {}).get("duration", "0") or 0)
        format_name = str(probe.get("format", {}).get("format_name", ""))
        expected_container = "mov,mp4" if relative.endswith(".mov") else "mp4"
        validator.check(video is not None, f"{relative} has a video stream")
        validator.check(audio is not None, f"{relative} has an audio stream")
        if video:
            validator.check(video.get("codec_name") == "h264", f"{relative} video codec is h264")
            validator.check(video.get("codec_tag_string") == "avc1", f"{relative} video codec tag is avc1")
            validator.check(video.get("width") == 640 and video.get("height") == 360, f"{relative} resolution is 640x360")
        if audio:
            validator.check(audio.get("codec_name") == "aac", f"{relative} audio codec is aac")
        validator.check(abs(duration - 2.0) <= 0.15, f"{relative} duration is close to 2.00 seconds")
        validator.check(expected_container in format_name, f"{relative} container family matches extension")
        validator.check(has_location_tag(probe) is expect_location, f"{relative} GPS/no-GPS location tag semantics match")


def main() -> int:
    """Run all generated_test_data repair validation checks."""

    validator = Validator()
    check_filesystem(validator)
    manifest = load_manifest() if MANIFEST_PATH.exists() else {}
    check_manifest(validator, manifest)
    check_readme_paths(validator)
    check_media(validator)
    validator.print_summary()
    return 1 if validator.fail_count() else 0


if __name__ == "__main__":
    sys.exit(main())
