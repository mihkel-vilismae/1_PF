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
