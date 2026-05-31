"""Offline GPS coordinate providers for media pipeline fallback parsing.

These providers read local sidecar metadata and conservative path/name hints only.
They do not call network services, do not require credentials, and only return GPS
coordinates when latitude/longitude values are explicitly present and valid.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any

from .provider_contracts import GpsProviderInput, GpsProviderResult

_LATITUDE_KEYS = ("latitude", "lat", "gpslatitude", "gps_latitude", "gpslat")
_LONGITUDE_KEYS = ("longitude", "lon", "lng", "gpslongitude", "gps_longitude", "gpslon", "gpslng")
_ALTITUDE_KEYS = ("altitude", "alt", "elevation", "gpsaltitude", "gps_altitude")
_NUMBER_PATTERN = r"[-+]?(?:\d+(?:\.\d+)?|\.\d+)"
_TOKEN_COORDINATE_PATTERN = re.compile(
    rf"(?:lat(?:itude)?|gpslat(?:itude)?)[^0-9+-]{{0,16}}(?P<lat>{_NUMBER_PATTERN}).{{0,48}}?"
    rf"(?:lon(?:gitude)?|lng|gpslon(?:gitude)?|gpslng)[^0-9+-]{{0,16}}(?P<lon>{_NUMBER_PATTERN})",
    re.IGNORECASE,
)
_REVERSED_TOKEN_COORDINATE_PATTERN = re.compile(
    rf"(?:lon(?:gitude)?|lng|gpslon(?:gitude)?|gpslng)[^0-9+-]{{0,16}}(?P<lon>{_NUMBER_PATTERN}).{{0,48}}?"
    rf"(?:lat(?:itude)?|gpslat(?:itude)?)[^0-9+-]{{0,16}}(?P<lat>{_NUMBER_PATTERN})",
    re.IGNORECASE,
)
_ALTITUDE_PATTERN = re.compile(rf"(?:alt(?:itude)?|elevation|gpsalt(?:itude)?)[^0-9+-]{{0,16}}(?P<alt>{_NUMBER_PATTERN})", re.IGNORECASE)
_GPS_PAIR_PATTERN = re.compile(rf"gps\s*[:=_ -](?P<lat>{_NUMBER_PATTERN})\s*[,;_ -]+(?P<lon>{_NUMBER_PATTERN})", re.IGNORECASE)


class JsonSidecarGpsProvider:
    """Reads explicit latitude/longitude values from local JSON sidecars."""

    provider_id = "json_sidecar"
    parser_method = "JSON_SIDECAR"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts JSON sidecar files near the canonical media asset."""

        for candidate in sidecar_candidates(provider_input.canonical_path, (".json", ".gps.json")):
            payload = read_json_mapping(candidate)
            if payload is None:
                continue
            coordinates = coordinates_from_mapping(payload)
            if coordinates is None:
                continue
            latitude, longitude, altitude = coordinates
            return GpsProviderResult.succeeded(
                self.provider_id,
                latitude,
                longitude,
                altitude,
                self.parser_method,
                {"parserMethod": self.parser_method, "sidecarPath": str(candidate)},
            )
        return GpsProviderResult.no_result(
            self.provider_id,
            "gps_json_sidecar_not_found",
            "No JSON sidecar with explicit GPS coordinates was found.",
        )


class XmpSidecarGpsProvider:
    """Reads explicit GPS coordinates from local XMP sidecar text."""

    provider_id = "xmp_sidecar"
    parser_method = "XMP_SIDECAR"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts XMP sidecar files near the canonical media asset."""

        for candidate in sidecar_candidates(provider_input.canonical_path, (".xmp", ".gps.xmp")):
            text = read_text(candidate)
            if text is None:
                continue
            coordinates = coordinates_from_text(text)
            if coordinates is None:
                continue
            latitude, longitude, altitude = coordinates
            return GpsProviderResult.succeeded(
                self.provider_id,
                latitude,
                longitude,
                altitude,
                self.parser_method,
                {"parserMethod": self.parser_method, "sidecarPath": str(candidate)},
            )
        return GpsProviderResult.no_result(
            self.provider_id,
            "gps_xmp_sidecar_not_found",
            "No XMP sidecar with explicit GPS coordinates was found.",
        )


class TextSidecarGpsProvider:
    """Reads explicit GPS coordinates from small local text sidecars."""

    provider_id = "text_sidecar"
    parser_method = "TEXT_SIDECAR"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts TXT sidecar files near the canonical media asset."""

        for candidate in sidecar_candidates(provider_input.canonical_path, (".txt", ".gps.txt")):
            text = read_text(candidate)
            if text is None:
                continue
            coordinates = coordinates_from_text(text)
            if coordinates is None:
                continue
            latitude, longitude, altitude = coordinates
            return GpsProviderResult.succeeded(
                self.provider_id,
                latitude,
                longitude,
                altitude,
                self.parser_method,
                {"parserMethod": self.parser_method, "sidecarPath": str(candidate)},
            )
        return GpsProviderResult.no_result(
            self.provider_id,
            "gps_text_sidecar_not_found",
            "No text sidecar with explicit GPS coordinates was found.",
        )


class FilenameGpsProvider:
    """Reads explicit coordinate tokens from the media file name only."""

    provider_id = "filename_coordinates"
    parser_method = "FILENAME_COORDINATES"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts conservative latitude/longitude patterns in the file name."""

        name = Path(provider_input.canonical_path).name
        coordinates = coordinates_from_text(name)
        if coordinates is None:
            return GpsProviderResult.no_result(
                self.provider_id,
                "gps_filename_coordinates_not_found",
                "No explicit GPS coordinate tokens were found in the file name.",
            )
        latitude, longitude, altitude = coordinates
        return GpsProviderResult.succeeded(
            self.provider_id,
            latitude,
            longitude,
            altitude,
            self.parser_method,
            {"parserMethod": self.parser_method},
        )


class PathGpsProvider:
    """Reads explicit coordinate tokens from parent folder names only."""

    provider_id = "path_coordinates"
    parser_method = "PATH_COORDINATES"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts conservative latitude/longitude patterns in directory names."""

        path = Path(provider_input.canonical_path)
        parent_text = " ".join(part for part in path.parent.parts if part not in (path.anchor, "/"))
        coordinates = coordinates_from_text(parent_text)
        if coordinates is None:
            return GpsProviderResult.no_result(
                self.provider_id,
                "gps_path_coordinates_not_found",
                "No explicit GPS coordinate tokens were found in the parent path.",
            )
        latitude, longitude, altitude = coordinates
        return GpsProviderResult.succeeded(
            self.provider_id,
            latitude,
            longitude,
            altitude,
            self.parser_method,
            {"parserMethod": self.parser_method},
        )


def sidecar_candidates(canonical_path: str, suffixes: Iterable[str]) -> list[Path]:
    """Returns ordered sidecar paths without requiring any file to exist."""

    media_path = Path(canonical_path)
    candidates: list[Path] = []
    for suffix in suffixes:
        candidates.append(Path(f"{media_path}{suffix}"))
        candidates.append(media_path.with_suffix(suffix))
    unique_candidates: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        if candidate not in seen:
            seen.add(candidate)
            unique_candidates.append(candidate)
    return unique_candidates


def read_json_mapping(path: Path) -> Mapping[str, Any] | None:
    """Reads a JSON object from disk and returns None for absent/invalid files."""

    if not path.exists() or not path.is_file():
        return None
    try:
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, Mapping) else None


def read_text(path: Path) -> str | None:
    """Reads a small text sidecar and returns None for absent/unreadable files."""

    if not path.exists() or not path.is_file():
        return None
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def coordinates_from_mapping(payload: Mapping[str, Any]) -> tuple[float, float, float | None] | None:
    """Extracts coordinates from common flat, nested, or GeoJSON-like objects."""

    flattened = flatten_mapping(payload)
    latitude = first_float(flattened, _LATITUDE_KEYS)
    longitude = first_float(flattened, _LONGITUDE_KEYS)
    altitude = first_float(flattened, _ALTITUDE_KEYS)

    if latitude is None or longitude is None:
        coordinates = payload.get("coordinates")
        if isinstance(coordinates, list | tuple) and len(coordinates) >= 2:
            longitude = value_to_float(coordinates[0])
            latitude = value_to_float(coordinates[1])
            if len(coordinates) >= 3:
                altitude = value_to_float(coordinates[2])

    return valid_coordinates(latitude, longitude, altitude)


def coordinates_from_text(text: str) -> tuple[float, float, float | None] | None:
    """Extracts coordinates from explicit lat/lon text tokens."""

    match = _TOKEN_COORDINATE_PATTERN.search(text) or _REVERSED_TOKEN_COORDINATE_PATTERN.search(text) or _GPS_PAIR_PATTERN.search(text)
    if match is None:
        return None
    altitude_match = _ALTITUDE_PATTERN.search(text)
    altitude = value_to_float(altitude_match.group("alt")) if altitude_match else None
    return valid_coordinates(value_to_float(match.group("lat")), value_to_float(match.group("lon")), altitude)


def flatten_mapping(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Flattens nested mapping keys into lowercase lookup names."""

    flattened: dict[str, Any] = {}
    stack: list[Mapping[str, Any]] = [payload]
    while stack:
        current = stack.pop()
        for key, value in current.items():
            normalized_key = re.sub(r"[^a-z0-9]", "", str(key).lower())
            flattened[normalized_key] = value
            if isinstance(value, Mapping):
                stack.append(value)
    return flattened


def first_float(payload: Mapping[str, Any], keys: Iterable[str]) -> float | None:
    """Returns the first parseable float for any normalized key alias."""

    for key in keys:
        normalized_key = re.sub(r"[^a-z0-9]", "", key.lower())
        if normalized_key in payload:
            value = value_to_float(payload[normalized_key])
            if value is not None:
                return value
    return None


def value_to_float(value: Any) -> float | None:
    """Converts numeric-looking metadata values to floats without raising."""

    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        match = re.search(_NUMBER_PATTERN, value.strip())
        if match:
            try:
                return float(match.group(0))
            except ValueError:
                return None
    return None


def valid_coordinates(
    latitude: float | None,
    longitude: float | None,
    altitude: float | None = None,
) -> tuple[float, float, float | None] | None:
    """Validates coordinate bounds before allowing a provider success."""

    if latitude is None or longitude is None:
        return None
    if latitude < -90.0 or latitude > 90.0 or longitude < -180.0 or longitude > 180.0:
        return None
    return (latitude, longitude, altitude)
