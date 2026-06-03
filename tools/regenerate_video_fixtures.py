"""
Regenerates the repaired Apple-style video fixture subset.
The script is intentionally narrow: it only touches videos_with_gps/ and videos_no_gps/.
It uses ffmpeg to create small synthetic H.264/AAC proof fixtures with optional location tags.
The fixtures are parser/proof data only and must not be described as real iPhone captures.
Run this from the repository root, then run tools/verify_generated_test_data.py.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

DATASET_ROOT = Path("generated_test_data")


@dataclass(frozen=True)
class VideoFixtureSpec:
    """Describes one deterministic synthetic video fixture to generate."""

    relative_path: str
    color: str
    location: str | None


FIXTURES = [
    VideoFixtureSpec(
        "videos_with_gps/apple_like_h264_mov_gps_tallinn.mov",
        "blue",
        "+59.4370+024.7536+000.000/",
    ),
    VideoFixtureSpec(
        "videos_with_gps/apple_like_h264_mov_gps_tokyo.mov",
        "green",
        "+35.6762+139.6503+000.000/",
    ),
    VideoFixtureSpec(
        "videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4",
        "red",
        "+40.7128-074.0060+000.000/",
    ),
    VideoFixtureSpec("videos_no_gps/apple_like_h264_mov_no_gps.mov", "yellow", None),
    VideoFixtureSpec("videos_no_gps/apple_like_h264_mp4_no_gps.mp4", "purple", None),
]


def prepare_fixture_directories() -> None:
    """Replace only the two known blocker paths with directories when needed."""

    for relative in ("videos_with_gps", "videos_no_gps"):
        path = DATASET_ROOT / relative
        if path.exists() and not path.is_dir():
            path.unlink()
        path.mkdir(parents=True, exist_ok=True)


def run_ffmpeg(spec: VideoFixtureSpec) -> None:
    """Generate one small H.264/AAC fixture with optional QuickTime location metadata."""

    output_path = DATASET_ROOT / spec.relative_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        f"color=c={spec.color}:s=640x360:d=2:r=30",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=880:duration=2:sample_rate=44100",
        "-shortest",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-profile:v",
        "baseline",
        "-level",
        "3.0",
        "-tag:v",
        "avc1",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
    ]
    if spec.location:
        command.extend(
            [
                "-metadata",
                f"location={spec.location}",
                "-metadata",
                f"com.apple.quicktime.location.ISO6709={spec.location}",
            ]
        )
    command.extend(["-movflags", "use_metadata_tags+faststart", str(output_path)])
    subprocess.run(command, check=True)


def main() -> None:
    """Regenerate the exact repaired fixture subset."""

    prepare_fixture_directories()
    for spec in FIXTURES:
        run_ffmpeg(spec)


if __name__ == "__main__":
    main()
