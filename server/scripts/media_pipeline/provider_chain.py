"""Fallback-chain helpers for media pipeline provider attempts.

These runners keep provider order explicit and stop after the first successful
usable result while preserving sanitized failure/no-result details.
"""

from collections.abc import Iterable

from .provider_contracts import (
    GPS_PROVIDER_STATUS_FAILED,
    GPS_PROVIDER_STATUS_NO_RESULT,
    GPS_PROVIDER_STATUS_SUCCEEDED,
    GEOCODE_PROVIDER_STATUS_FAILED,
    GEOCODE_PROVIDER_STATUS_NO_RESULT,
    GEOCODE_PROVIDER_STATUS_SUCCEEDED,
    GpsProvider,
    GpsProviderInput,
    GpsProviderResult,
    ReverseGeocodeInput,
    ReverseGeocodeProvider,
    ReverseGeocodeResult,
)


def run_gps_provider_chain(provider_input: GpsProviderInput, providers: Iterable[GpsProvider]) -> GpsProviderResult:
    """Runs GPS providers in order and returns the first successful result."""

    last_result: GpsProviderResult | None = None
    for provider in providers:
        try:
            result = provider.parse_gps(provider_input)
        except Exception as error:
            result = GpsProviderResult.failed(provider.provider_id, "gps_extract_failed", str(error))
        if result.status == GPS_PROVIDER_STATUS_SUCCEEDED:
            return result
        if result.status in (GPS_PROVIDER_STATUS_NO_RESULT, GPS_PROVIDER_STATUS_FAILED):
            last_result = result

    if last_result is not None:
        return last_result
    return GpsProviderResult.no_result(
        "provider_chain",
        "gps_provider_unavailable",
        "No GPS providers were configured for the media asset.",
    )


def run_reverse_geocode_provider_chain(
    provider_input: ReverseGeocodeInput,
    providers: Iterable[ReverseGeocodeProvider],
) -> ReverseGeocodeResult:
    """Runs reverse-geocode providers in order and returns the first success."""

    last_result: ReverseGeocodeResult | None = None
    for provider in providers:
        try:
            result = provider.reverse_geocode(provider_input)
        except Exception as error:
            result = ReverseGeocodeResult.failed(provider.provider_id, "geocode_failed", str(error))
        if result.status == GEOCODE_PROVIDER_STATUS_SUCCEEDED:
            return result
        if result.status in (GEOCODE_PROVIDER_STATUS_NO_RESULT, GEOCODE_PROVIDER_STATUS_FAILED):
            last_result = result

    if last_result is not None:
        return last_result
    return ReverseGeocodeResult.no_result(
        "provider_chain",
        "geocode_provider_unavailable",
        "No reverse-geocode providers were configured for the coordinate pair.",
    )
