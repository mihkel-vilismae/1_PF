"""EXIF GPS provider used by the backend media pipeline.

This module contains the current built-in GPS behavior as a pluggable provider
so additional GPS metadata providers can be added later without worker rewrites.
"""

from PIL import Image
from PIL.ExifTags import Base

from .provider_contracts import GpsProviderInput, GpsProviderResult


def convert_gps_coordinate(parts: tuple[float, float, float], ref: str) -> float:
    """Converts EXIF degrees/minutes/seconds GPS values into decimal degrees."""

    degrees = float(parts[0])
    minutes = float(parts[1])
    seconds = float(parts[2])
    value = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ("S", "W"):
        value *= -1.0
    return value


class ExifGpsProvider:
    """Reads embedded EXIF GPS coordinates from image files using Pillow."""

    provider_id = "exif"
    parser_method = "EXIF"

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts to parse EXIF GPS coordinates from the canonical file."""

        try:
            gps_data = extract_exif_gps_from_file(provider_input.canonical_path)
        except Exception as error:
            return GpsProviderResult.failed(self.provider_id, "gps_extract_failed", str(error))
        if gps_data is None:
            return GpsProviderResult.no_result(
                self.provider_id,
                "gps_not_found",
                "No EXIF GPS coordinates were found in the media asset.",
            )
        return GpsProviderResult.succeeded(
            self.provider_id,
            gps_data["latitude"],
            gps_data["longitude"],
            gps_data["altitude"],
            self.parser_method,
            {"parserMethod": self.parser_method},
        )


def extract_exif_gps_from_file(file_path: str) -> dict | None:
    """Returns the current EXIF GPS payload shape, or None when absent."""

    with Image.open(file_path) as image:
        exif = image.getexif()
        if not exif:
            return None
        try:
            gps_ifd = exif.get_ifd(Base.GPSInfo)
        except KeyError:
            return None
        if not gps_ifd:
            return None

        latitude_parts = gps_ifd.get(2)
        latitude_ref = gps_ifd.get(1)
        longitude_parts = gps_ifd.get(4)
        longitude_ref = gps_ifd.get(3)
        altitude = gps_ifd.get(6)
        if not latitude_parts or not latitude_ref or not longitude_parts or not longitude_ref:
            return None

        latitude = convert_gps_coordinate(latitude_parts, latitude_ref)
        longitude = convert_gps_coordinate(longitude_parts, longitude_ref)
        altitude_value = float(altitude) if altitude is not None else None
        return {
            "latitude": latitude,
            "longitude": longitude,
            "altitude": altitude_value,
            "parserMethod": "EXIF",
        }


def default_gps_providers() -> list[ExifGpsProvider]:
    """Returns GPS providers in the current default fallback order."""

    return [ExifGpsProvider()]
