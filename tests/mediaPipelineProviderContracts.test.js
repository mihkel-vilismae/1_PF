// Verifies backend-only media pipeline provider contracts.
// The tests execute the Python provider modules directly so GPS/geocode
// fallback behavior can evolve without involving frontend/dashboard code.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

// Runs a Python script from the repository root and returns parsed JSON output.
function runPythonJson(script) {
  const result = spawnSync(pythonCommand, ['-c', script, repoRoot], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `Python script failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return JSON.parse(result.stdout);
}

test('media pipeline provider chains fall back to later successful providers', () => {
  const payload = runPythonJson(`
import json
import os
import sys

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.provider_chain import run_gps_provider_chain, run_reverse_geocode_provider_chain
from media_pipeline.provider_contracts import (
    GpsProviderInput,
    GpsProviderResult,
    ReverseGeocodeInput,
    ReverseGeocodeResult,
)

class NoGpsProvider:
    provider_id = 'no_gps'

    def parse_gps(self, provider_input):
        return GpsProviderResult.no_result(self.provider_id, 'gps_not_found', 'No GPS here.')

class SuccessfulGpsProvider:
    provider_id = 'fixture_gps'

    def parse_gps(self, provider_input):
        return GpsProviderResult.succeeded(self.provider_id, 58.37762, 26.72901, None, 'FIXTURE')

class FailedGeocodeProvider:
    provider_id = 'failed_geocoder'

    def reverse_geocode(self, provider_input):
        return ReverseGeocodeResult.failed(self.provider_id, 'provider_error', 'Provider failed safely.')

class SuccessfulGeocodeProvider:
    provider_id = 'fixture_geocoder'

    def reverse_geocode(self, provider_input):
        return ReverseGeocodeResult.succeeded(
            self.provider_id,
            'Fixture address',
            '58.37762,26.72901',
            58.37762,
            26.72901,
            provider_input.language_code,
            {'address_text': 'Fixture address', 'cache_key': '58.37762,26.72901'},
        )

gps_result = run_gps_provider_chain(GpsProviderInput('/tmp/missing.jpg'), [NoGpsProvider(), SuccessfulGpsProvider()])
geocode_result = run_reverse_geocode_provider_chain(
    ReverseGeocodeInput(58.37762, 26.72901),
    [FailedGeocodeProvider(), SuccessfulGeocodeProvider()],
)
print(json.dumps({
    'gps_provider_id': gps_result.provider_id,
    'gps_status': gps_result.status,
    'gps_parser_method': gps_result.parser_method,
    'geocode_provider_id': geocode_result.provider_id,
    'geocode_status': geocode_result.status,
    'geocode_address': geocode_result.address_text,
}))
`);

  assert.deepEqual(payload, {
    gps_provider_id: 'fixture_gps',
    gps_status: 'SUCCEEDED',
    gps_parser_method: 'FIXTURE',
    geocode_provider_id: 'fixture_geocoder',
    geocode_status: 'SUCCEEDED',
    geocode_address: 'Fixture address',
  });
});

test('sqlite admin helper wrappers preserve current EXIF and placeholder output', () => {
  const payload = runPythonJson(`
import json
import os
import sys
import tempfile

from PIL import Image, TiffImagePlugin
from PIL.ExifTags import Base

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from sqlite_admin import build_placeholder_address, extract_exif_gps


def rat(a, b):
    return TiffImagePlugin.IFDRational(a, b)


def to_deg(value):
    value = abs(float(value))
    degrees = int(value)
    minutes_float = (value - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return (rat(degrees, 1), rat(minutes, 1), rat(int(round(seconds * 10000)), 10000))

with tempfile.TemporaryDirectory() as temp_dir:
    file_path = os.path.join(temp_dir, 'gps.jpg')
    image = Image.new('RGB', (16, 16), (255, 0, 0))
    exif = Image.Exif()
    exif[Base.GPSInfo] = {
        1: 'N',
        2: to_deg(58.377625),
        3: 'E',
        4: to_deg(26.729006),
        6: rat(12345, 100),
    }
    image.save(file_path, exif=exif)
    gps = extract_exif_gps(file_path)

print(json.dumps({
    'parser_method': gps['parserMethod'],
    'latitude': round(gps['latitude'], 6),
    'longitude': round(gps['longitude'], 6),
    'altitude': gps['altitude'],
    'address': build_placeholder_address(58.377625, 26.729006),
}))
`);

  assert.deepEqual(payload, {
    parser_method: 'EXIF',
    latitude: 58.377625,
    longitude: 26.729006,
    altitude: 123.45,
    address: 'Lat: 58.37763, Lon: 26.72901',
  });
});

test('reverse geocode registry keeps cache first and account providers disabled by default', () => {
  const payload = runPythonJson(`
import json
import os
import sys

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.geocode_provider_registry import default_reverse_geocode_providers
from media_pipeline.provider_chain import run_reverse_geocode_provider_chain
from media_pipeline.provider_contracts import ReverseGeocodeInput

for key in list(os.environ.keys()):
    if key.startswith('GEOCODE_'):
        os.environ.pop(key)

providers = default_reverse_geocode_providers()
result = run_reverse_geocode_provider_chain(ReverseGeocodeInput(58.377625, 26.729006), providers)
print(json.dumps({
    'provider_ids': [provider.provider_id for provider in providers],
    'result_provider': result.provider_id,
    'result_status': result.status,
    'address': result.address_text,
}))
`);

  assert.deepEqual(payload.provider_ids, [
    'address_cache',
    'nominatim_osm',
    'photon_komoot',
    'postcodes_io_uk',
    'pelias_self_hosted',
    'opencage',
    'geoapify',
    'mapbox',
    'google_geocoding',
    'deterministic_placeholder',
  ]);
  assert.equal(payload.result_provider, 'deterministic_placeholder');
  assert.equal(payload.result_status, 'SUCCEEDED');
  assert.equal(payload.address, 'Lat: 58.37763, Lon: 26.72901');
});

test('address cache provider resolves before placeholder and network providers', () => {
  const payload = runPythonJson(`
import json
import os
import sqlite3
import sys

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.geocode_provider_registry import default_reverse_geocode_providers
from media_pipeline.provider_chain import run_reverse_geocode_provider_chain
from media_pipeline.provider_contracts import ReverseGeocodeInput

connection = sqlite3.connect(':memory:')
connection.row_factory = sqlite3.Row
connection.execute('''
    CREATE TABLE address_cache (
        address_cache_key TEXT PRIMARY KEY,
        rounded_latitude REAL,
        rounded_longitude REAL,
        address_text TEXT,
        provider_name TEXT,
        provider_response_json TEXT,
        language_code TEXT,
        created_at TEXT,
        updated_at TEXT
    )
''')
connection.execute('''
    INSERT INTO address_cache (
        address_cache_key, rounded_latitude, rounded_longitude, address_text,
        provider_name, provider_response_json, language_code, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (
    '58.37763,26.72901', 58.37763, 26.72901, 'Cached Tartu address',
    'nominatim_osm', '{}', 'en', 'now', 'now'
))
connection.commit()

for key in list(os.environ.keys()):
    if key.startswith('GEOCODE_'):
        os.environ.pop(key)

result = run_reverse_geocode_provider_chain(
    ReverseGeocodeInput(58.377625, 26.729006),
    default_reverse_geocode_providers(connection),
)
print(json.dumps({
    'provider': result.provider_id,
    'status': result.status,
    'address': result.address_text,
    'cached_provider_name': result.provider_response.get('cached_provider_name'),
}))
`);

  assert.deepEqual(payload, {
    provider: 'address_cache',
    status: 'SUCCEEDED',
    address: 'Cached Tartu address',
    cached_provider_name: 'nominatim_osm',
  });
});

test('GPS provider chain reads offline sidecar and path coordinate fallbacks', () => {
  const payload = runPythonJson(`
import json
import os
import sys
import tempfile
from pathlib import Path

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.gps_exif_provider import default_gps_providers
from media_pipeline.provider_chain import run_gps_provider_chain
from media_pipeline.provider_contracts import GpsProviderInput


def parse(path):
    result = run_gps_provider_chain(GpsProviderInput(str(path)), default_gps_providers())
    return {
        'provider': result.provider_id,
        'status': result.status,
        'method': result.parser_method,
        'latitude': round(result.latitude, 6) if result.latitude is not None else None,
        'longitude': round(result.longitude, 6) if result.longitude is not None else None,
        'altitude': result.altitude,
    }

with tempfile.TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)

    json_media = root / 'json-photo.jpg'
    json_media.write_bytes(b'not an image')
    (root / 'json-photo.jpg.json').write_text(
        json.dumps({'location': {'latitude': 58.377625, 'longitude': 26.729006, 'altitude': 123.45}}),
        encoding='utf-8',
    )

    xmp_media = root / 'xmp-photo.jpg'
    xmp_media.write_bytes(b'not an image')
    (root / 'xmp-photo.xmp').write_text(
        '<rdf:Description exif:GPSLatitude="58.377626" exif:GPSLongitude="26.729007" exif:GPSAltitude="124.45" />',
        encoding='utf-8',
    )

    text_media = root / 'text-photo.jpg'
    text_media.write_bytes(b'not an image')
    (root / 'text-photo.gps.txt').write_text('lat=58.377627 lon=26.729008 altitude=125.45', encoding='utf-8')

    filename_media = root / 'IMG_lat_58.377628_lon_26.729009.jpg'
    filename_media.write_bytes(b'not an image')

    path_dir = root / 'album_lat_58.377629_lon_26.729010'
    path_dir.mkdir()
    path_media = path_dir / 'plain.jpg'
    path_media.write_bytes(b'not an image')

    print(json.dumps({
        'provider_ids': [provider.provider_id for provider in default_gps_providers()],
        'json': parse(json_media),
        'xmp': parse(xmp_media),
        'text': parse(text_media),
        'filename': parse(filename_media),
        'path': parse(path_media),
    }))
`);

  assert.deepEqual(payload.provider_ids, [
    'exif',
    'json_sidecar',
    'xmp_sidecar',
    'text_sidecar',
    'filename_coordinates',
    'path_coordinates',
  ]);
  assert.deepEqual(payload.json, {
    provider: 'json_sidecar',
    status: 'SUCCEEDED',
    method: 'JSON_SIDECAR',
    latitude: 58.377625,
    longitude: 26.729006,
    altitude: 123.45,
  });
  assert.deepEqual(payload.xmp, {
    provider: 'xmp_sidecar',
    status: 'SUCCEEDED',
    method: 'XMP_SIDECAR',
    latitude: 58.377626,
    longitude: 26.729007,
    altitude: 124.45,
  });
  assert.deepEqual(payload.text, {
    provider: 'text_sidecar',
    status: 'SUCCEEDED',
    method: 'TEXT_SIDECAR',
    latitude: 58.377627,
    longitude: 26.729008,
    altitude: 125.45,
  });
  assert.deepEqual(payload.filename, {
    provider: 'filename_coordinates',
    status: 'SUCCEEDED',
    method: 'FILENAME_COORDINATES',
    latitude: 58.377628,
    longitude: 26.729009,
    altitude: null,
  });
  assert.deepEqual(payload.path, {
    provider: 'path_coordinates',
    status: 'SUCCEEDED',
    method: 'PATH_COORDINATES',
    latitude: 58.377629,
    longitude: 26.72901,
    altitude: null,
  });
});
