"""Provider contracts for GPS parsing and reverse geocoding workers.

The worker stages use these small Python contracts so future providers can be
added without changing dashboard/frontend behavior or queue persistence rules.
"""

from dataclasses import dataclass, field
from typing import Any, Protocol

GPS_PROVIDER_STATUS_SUCCEEDED = "SUCCEEDED"
GPS_PROVIDER_STATUS_NO_RESULT = "NO_RESULT"
GPS_PROVIDER_STATUS_FAILED = "FAILED"
GPS_PROVIDER_STATUS_SKIPPED = "SKIPPED"

GEOCODE_PROVIDER_STATUS_SUCCEEDED = "SUCCEEDED"
GEOCODE_PROVIDER_STATUS_NO_RESULT = "NO_RESULT"
GEOCODE_PROVIDER_STATUS_FAILED = "FAILED"
GEOCODE_PROVIDER_STATUS_SKIPPED = "SKIPPED"


@dataclass(frozen=True)
class GpsProviderInput:
    """Carries the canonical media path into a GPS metadata provider."""

    canonical_path: str


@dataclass(frozen=True)
class GpsProviderResult:
    """Normalizes one GPS provider attempt for worker-stage fallback logic."""

    provider_id: str
    status: str
    latitude: float | None = None
    longitude: float | None = None
    altitude: float | None = None
    parser_method: str | None = None
    failure_code: str | None = None
    message: str | None = None
    provider_response: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def succeeded(
        cls,
        provider_id: str,
        latitude: float,
        longitude: float,
        altitude: float | None,
        parser_method: str,
        provider_response: dict[str, Any] | None = None,
    ) -> "GpsProviderResult":
        """Builds a successful GPS provider result with parsed coordinates."""

        return cls(
            provider_id=provider_id,
            status=GPS_PROVIDER_STATUS_SUCCEEDED,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            parser_method=parser_method,
            provider_response=provider_response or {},
        )

    @classmethod
    def no_result(cls, provider_id: str, failure_code: str, message: str) -> "GpsProviderResult":
        """Builds a no-result GPS attempt without treating it as a crash."""

        return cls(
            provider_id=provider_id,
            status=GPS_PROVIDER_STATUS_NO_RESULT,
            failure_code=failure_code,
            message=message,
        )

    @classmethod
    def failed(cls, provider_id: str, failure_code: str, message: str) -> "GpsProviderResult":
        """Builds a failed GPS attempt with sanitized failure details."""

        return cls(
            provider_id=provider_id,
            status=GPS_PROVIDER_STATUS_FAILED,
            failure_code=failure_code,
            message=message,
        )


class GpsProvider(Protocol):
    """Defines the pluggable contract for future GPS metadata providers."""

    provider_id: str

    def parse_gps(self, provider_input: GpsProviderInput) -> GpsProviderResult:
        """Attempts to parse GPS metadata from one canonical media asset."""


@dataclass(frozen=True)
class ReverseGeocodeInput:
    """Carries GPS coordinates into a reverse-geocoding provider."""

    latitude: float
    longitude: float
    language_code: str = "en"


@dataclass(frozen=True)
class ReverseGeocodeResult:
    """Normalizes one reverse-geocode provider attempt for fallback logic."""

    provider_id: str
    status: str
    address_text: str | None = None
    address_cache_key: str | None = None
    rounded_latitude: float | None = None
    rounded_longitude: float | None = None
    language_code: str = "en"
    failure_code: str | None = None
    message: str | None = None
    provider_response: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def succeeded(
        cls,
        provider_id: str,
        address_text: str,
        address_cache_key: str,
        rounded_latitude: float,
        rounded_longitude: float,
        language_code: str,
        provider_response: dict[str, Any] | None = None,
    ) -> "ReverseGeocodeResult":
        """Builds a successful reverse-geocode result with cache metadata."""

        return cls(
            provider_id=provider_id,
            status=GEOCODE_PROVIDER_STATUS_SUCCEEDED,
            address_text=address_text,
            address_cache_key=address_cache_key,
            rounded_latitude=rounded_latitude,
            rounded_longitude=rounded_longitude,
            language_code=language_code,
            provider_response=provider_response or {},
        )

    @classmethod
    def no_result(cls, provider_id: str, failure_code: str, message: str) -> "ReverseGeocodeResult":
        """Builds a no-result geocoder attempt without fabricating an address."""

        return cls(
            provider_id=provider_id,
            status=GEOCODE_PROVIDER_STATUS_NO_RESULT,
            failure_code=failure_code,
            message=message,
        )

    @classmethod
    def failed(cls, provider_id: str, failure_code: str, message: str) -> "ReverseGeocodeResult":
        """Builds a failed geocoder attempt with sanitized failure details."""

        return cls(
            provider_id=provider_id,
            status=GEOCODE_PROVIDER_STATUS_FAILED,
            failure_code=failure_code,
            message=message,
        )


class ReverseGeocodeProvider(Protocol):
    """Defines the pluggable contract for future reverse-geocode providers."""

    provider_id: str

    def reverse_geocode(self, provider_input: ReverseGeocodeInput) -> ReverseGeocodeResult:
        """Attempts to resolve one coordinate pair to an address."""
