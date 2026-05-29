"""Provider registry for reverse-geocoding worker stages.

The registry builds the cache-first provider chain from environment settings
while leaving network/account providers disabled unless explicitly enabled.
"""

import os
from sqlite3 import Connection
from typing import Callable

from .geocode_address_cache_provider import AddressCacheGeocodeProvider
from .geocode_config import read_bool_env, read_provider_config, read_provider_order
from .geocode_http_providers import (
    GeoapifyGeocodeProvider,
    GoogleGeocodingProvider,
    MapboxGeocodingProvider,
    NominatimOsmGeocodeProvider,
    OpenCageGeocodeProvider,
    PeliasSelfHostedGeocodeProvider,
    PhotonKomootGeocodeProvider,
    PostcodesIoUkGeocodeProvider,
)
from .geocode_placeholder_provider import DeterministicPlaceholderGeocodeProvider
from .provider_contracts import ReverseGeocodeProvider


DEFAULT_REVERSE_GEOCODE_PROVIDER_ORDER = [
    "address_cache",
    "nominatim_osm",
    "photon_komoot",
    "postcodes_io_uk",
    "pelias_self_hosted",
    "opencage",
    "geoapify",
    "mapbox",
    "google_geocoding",
    "deterministic_placeholder",
]


def build_reverse_geocode_provider_factories(connection: Connection | None) -> dict[str, Callable[[], ReverseGeocodeProvider]]:
    """Builds provider constructors keyed by standardized provider id."""

    return {
        "address_cache": lambda: AddressCacheGeocodeProvider(connection),
        "nominatim_osm": lambda: NominatimOsmGeocodeProvider(
            read_provider_config("nominatim_osm", default_base_url="https://nominatim.openstreetmap.org/reverse"),
        ),
        "photon_komoot": lambda: PhotonKomootGeocodeProvider(
            read_provider_config("photon_komoot", default_base_url="https://photon.komoot.io/reverse"),
        ),
        "postcodes_io_uk": lambda: PostcodesIoUkGeocodeProvider(
            read_provider_config("postcodes_io_uk", default_base_url="https://api.postcodes.io/postcodes"),
        ),
        "pelias_self_hosted": lambda: PeliasSelfHostedGeocodeProvider(
            read_provider_config("pelias_self_hosted"),
        ),
        "opencage": lambda: OpenCageGeocodeProvider(
            read_provider_config("opencage", default_base_url="https://api.opencagedata.com/geocode/v1/json"),
        ),
        "geoapify": lambda: GeoapifyGeocodeProvider(
            read_provider_config("geoapify", default_base_url="https://api.geoapify.com/v1/geocode/reverse"),
        ),
        "mapbox": lambda: MapboxGeocodingProvider(
            read_provider_config("mapbox", default_base_url="https://api.mapbox.com/search/geocode/v6/reverse"),
        ),
        "google_geocoding": lambda: GoogleGeocodingProvider(
            read_provider_config("google_geocoding", default_base_url="https://maps.googleapis.com/maps/api/geocode/json"),
        ),
        "deterministic_placeholder": lambda: DeterministicPlaceholderGeocodeProvider(),
    }


def default_reverse_geocode_providers(connection: Connection | None = None) -> list[ReverseGeocodeProvider]:
    """Returns the configured cache-first reverse-geocode provider chain."""

    factories = build_reverse_geocode_provider_factories(connection)
    provider_order = read_provider_order(DEFAULT_REVERSE_GEOCODE_PROVIDER_ORDER)
    providers: list[ReverseGeocodeProvider] = []
    for provider_id in provider_order:
        if provider_id == "deterministic_placeholder" and not read_bool_env(
            os.environ,
            "GEOCODE_ALLOW_PLACEHOLDER_FALLBACK",
            True,
        ):
            continue
        factory = factories.get(provider_id)
        if factory is not None:
            providers.append(factory())
    return providers
