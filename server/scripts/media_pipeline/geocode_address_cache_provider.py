"""Address-cache reverse-geocode provider for the media pipeline.

This provider checks the local SQLite address_cache table before any network
providers so repeated photo locations do not call external services again.
"""

from sqlite3 import Connection

from .geocode_placeholder_provider import build_address_cache_key
from .provider_contracts import ReverseGeocodeInput, ReverseGeocodeResult


class AddressCacheGeocodeProvider:
    """Resolves coordinates from the local address_cache table when possible."""

    provider_id = "address_cache"

    def __init__(self, connection: Connection | None):
        """Stores the active SQLite connection used by the worker stage."""

        self.connection = connection

    def reverse_geocode(self, provider_input: ReverseGeocodeInput) -> ReverseGeocodeResult:
        """Returns a cached address or a no-result outcome on cache miss."""

        if self.connection is None:
            return ReverseGeocodeResult.no_result(
                self.provider_id,
                "address_cache_unavailable",
                "Address cache lookup was not available for this worker run.",
            )

        cache_key, rounded_latitude, rounded_longitude = build_address_cache_key(
            provider_input.latitude,
            provider_input.longitude,
        )
        row = self.connection.execute(
            """
            SELECT address_text, provider_name, provider_response_json, language_code
            FROM address_cache
            WHERE address_cache_key = ? AND language_code = ?
            LIMIT 1
            """,
            (cache_key, provider_input.language_code),
        ).fetchone()
        if row is None:
            return ReverseGeocodeResult.no_result(
                self.provider_id,
                "address_cache_miss",
                "No cached address was found for the coordinate pair.",
            )

        return ReverseGeocodeResult.succeeded(
            self.provider_id,
            row["address_text"],
            cache_key,
            rounded_latitude,
            rounded_longitude,
            row["language_code"] or provider_input.language_code,
            {
                "cache_key": cache_key,
                "cached_provider_name": row["provider_name"],
                "source": "address_cache",
            },
        )
