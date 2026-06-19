/** Geocode provider selection matrix for real-provider proof setup. */
export const GEOCODE_PROVIDER_SELECTION_MATRIX = Object.freeze([
  { provider_id: 'nominatim_osm', type: 'public_no_key', required_env: ['GEOCODE_NOMINATIM_OSM_ENABLED', 'GEOCODE_NOMINATIM_OSM_USER_AGENT'], recommended_for_first_run: true, notes: 'Public provider; configure a contact/user-agent before real proofing.' },
  { provider_id: 'photon_komoot', type: 'public_no_key', required_env: ['GEOCODE_PHOTON_KOMOOT_ENABLED'], recommended_for_first_run: false, notes: 'Public provider; useful as secondary no-key option.' },
  { provider_id: 'postcodes_io_uk', type: 'public_no_key_region_limited', required_env: ['GEOCODE_POSTCODES_IO_UK_ENABLED'], recommended_for_first_run: false, notes: 'UK-focused provider; not ideal for Tallinn fixture.' },
  { provider_id: 'pelias_self_hosted', type: 'self_hosted', required_env: ['GEOCODE_PELIAS_SELF_HOSTED_ENABLED', 'GEOCODE_PELIAS_SELF_HOSTED_BASE_URL'], recommended_for_first_run: false, notes: 'Requires self-hosted Pelias base URL.' },
  { provider_id: 'opencage', type: 'api_key', required_env: ['GEOCODE_OPENCAGE_ENABLED', 'GEOCODE_OPENCAGE_API_KEY'], recommended_for_first_run: false, notes: 'API-key provider; do not include key values in proof artifacts.' },
  { provider_id: 'geoapify', type: 'api_key', required_env: ['GEOCODE_GEOAPIFY_ENABLED', 'GEOCODE_GEOAPIFY_API_KEY'], recommended_for_first_run: false, notes: 'API-key provider; do not include key values in proof artifacts.' },
  { provider_id: 'mapbox', type: 'access_token', required_env: ['GEOCODE_MAPBOX_ENABLED', 'GEOCODE_MAPBOX_ACCESS_TOKEN'], recommended_for_first_run: false, notes: 'Access-token provider; do not include token values in proof artifacts.' },
  { provider_id: 'google_geocoding', type: 'api_key', required_env: ['GEOCODE_GOOGLE_GEOCODING_ENABLED', 'GEOCODE_GOOGLE_GEOCODING_API_KEY'], recommended_for_first_run: false, notes: 'API-key provider; do not include key values in proof artifacts.' },
]);

export function providerIdsFromMatrix() {
  return GEOCODE_PROVIDER_SELECTION_MATRIX.map((provider) => provider.provider_id).sort();
}

export function findGeocodeProvider(providerId) {
  return GEOCODE_PROVIDER_SELECTION_MATRIX.find((provider) => provider.provider_id === providerId) ?? null;
}

export function buildGeocodeProviderSelectionGuide({ preferredProviderId = 'nominatim_osm' } = {}) {
  const preferred = findGeocodeProvider(preferredProviderId) ?? findGeocodeProvider('nominatim_osm');
  return {
    preferred_provider_id: preferred?.provider_id ?? null,
    supported_provider_ids: providerIdsFromMatrix(),
    provider_matrix: GEOCODE_PROVIDER_SELECTION_MATRIX,
    global_required_env: ['PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true', 'PF_GEOCODE_CHAIN_PROOF_PROVIDER=<provider_id>'],
    secret_boundary: 'Provider keys/tokens/user credentials must be configured only in local/private env and must not be written to proof artifacts.',
    first_run_recommendation: preferred ? `Start with ${preferred.provider_id} if it is acceptable for the target fixture and configured according to provider policy.` : 'Choose one supported provider id.',
  };
}
