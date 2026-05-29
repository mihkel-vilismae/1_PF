"""Deterministic placeholder geocoder used by the backend media pipeline.

The current geocode behavior is intentionally kept as a labeled placeholder
provider until a later slice adds configured real reverse-geocoding providers.
"""

from .provider_contracts import ReverseGeocodeInput, ReverseGeocodeResult


def build_address_cache_key(latitude: float, longitude: float) -> tuple[str, float, float]:
    """Builds the current rounded coordinate cache key for an address lookup."""

    rounded_latitude = round(float(latitude), 5)
    rounded_longitude = round(float(longitude), 5)
    return (
        f"{rounded_latitude:.5f},{rounded_longitude:.5f}",
        rounded_latitude,
        rounded_longitude,
    )


def build_placeholder_address(latitude: float, longitude: float) -> str:
    """Builds the existing deterministic placeholder address string."""

    rounded_latitude = round(float(latitude), 5)
    rounded_longitude = round(float(longitude), 5)
    return f"Lat: {rounded_latitude:.5f}, Lon: {rounded_longitude:.5f}"


class DeterministicPlaceholderGeocodeProvider:
    """Formats coordinates as a stable placeholder address for current workers."""

    provider_id = "deterministic_placeholder"

    def reverse_geocode(self, provider_input: ReverseGeocodeInput) -> ReverseGeocodeResult:
        """Returns the current deterministic placeholder geocode result."""

        cache_key, rounded_latitude, rounded_longitude = build_address_cache_key(
            provider_input.latitude,
            provider_input.longitude,
        )
        address_text = build_placeholder_address(provider_input.latitude, provider_input.longitude)
        return ReverseGeocodeResult.succeeded(
            self.provider_id,
            address_text,
            cache_key,
            rounded_latitude,
            rounded_longitude,
            provider_input.language_code,
            {"address_text": address_text, "cache_key": cache_key},
        )


def default_reverse_geocode_providers() -> list[DeterministicPlaceholderGeocodeProvider]:
    """Returns geocode providers in the current default fallback order."""

    return [DeterministicPlaceholderGeocodeProvider()]
