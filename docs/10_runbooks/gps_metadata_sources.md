# GPS metadata sources runbook

Estonian timestamp: 30.05.2026, 21:20 EEST

## Purpose

This runbook shows the local/offline coordinate sources accepted by the GPS parsing provider chain. It is operator-facing and documentation-only. It does not change worker behavior, database schema, queue behavior, endpoint contracts, or dashboard UI.

The GPS stage remains honest: coordinates are accepted only when latitude and longitude are explicitly present and within valid bounds. The worker must not infer coordinates from unrelated numbers and must not fabricate GPS data.

## Current provider order

The GPS stage tries providers in this order:

```text
exif
json_sidecar
xmp_sidecar
text_sidecar
filename_coordinates
path_coordinates
```

| Order | Provider ID | Parser method | Source | When to use |
| ---: | --- | --- | --- | --- |
| 1 | `exif` | `EXIF` | Embedded image EXIF GPS metadata through Pillow. | Normal camera/photo metadata. |
| 2 | `json_sidecar` | `JSON_SIDECAR` | Adjacent `.json` / `.gps.json` files. | Metadata exports from tools or hand-authored test fixtures. |
| 3 | `xmp_sidecar` | `XMP_SIDECAR` | Adjacent `.xmp` / `.gps.xmp` files. | Photo tools that export XMP sidecars. |
| 4 | `text_sidecar` | `TEXT_SIDECAR` | Adjacent `.txt` / `.gps.txt` files. | Simple local notes or test fixtures. |
| 5 | `filename_coordinates` | `FILENAME_COORDINATES` | Explicit coordinate tokens in the media filename. | Last-resort operator naming convention. |
| 6 | `path_coordinates` | `PATH_COORDINATES` | Explicit coordinate tokens in parent folder names. | Album/folder-level coordinate convention. |

## Sidecar naming rules

Sidecar providers look for files beside the media file. For a media file like:

```text
photos/tartu_trip_001.jpg
```

Expected sidecar examples include:

```text
photos/tartu_trip_001.jpg.gps.json
photos/tartu_trip_001.gps.json
photos/tartu_trip_001.json
photos/tartu_trip_001.jpg.gps.xmp
photos/tartu_trip_001.gps.xmp
photos/tartu_trip_001.xmp
photos/tartu_trip_001.jpg.gps.txt
photos/tartu_trip_001.gps.txt
photos/tartu_trip_001.txt
```

Keep sidecars local to the media file. Do not put secrets, account data, or unrelated metadata in these files.

## JSON sidecar examples

Flat latitude/longitude keys:

```json
{
  "latitude": 58.37763,
  "longitude": 26.72901
}
```

Short keys:

```json
{
  "lat": 58.37763,
  "lon": 26.72901
}
```

Nested GPS object:

```json
{
  "gps": {
    "latitude": 58.37763,
    "longitude": 26.72901
  }
}
```

GeoJSON-like coordinate order:

```json
{
  "type": "Point",
  "coordinates": [26.72901, 58.37763]
}
```

GeoJSON commonly stores coordinates as `[longitude, latitude]`. Do not swap the values unless the format is explicitly documented.

## XMP sidecar examples

Simple explicit tags:

```xml
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description GPSLatitude="58.37763" GPSLongitude="26.72901" />
  </rdf:RDF>
</x:xmpmeta>
```

Text tokens inside XMP are also acceptable when they are explicit:

```xml
<gps>
  lat=58.37763
  lon=26.72901
</gps>
```

## Text sidecar examples

Line-based tokens:

```text
lat=58.37763
lon=26.72901
```

Comma-separated tokens:

```text
latitude: 58.37763, longitude: 26.72901
```

GPS tuple token:

```text
gps: 58.37763, 26.72901
```

The parser should only use explicit GPS/latitude/longitude tokens. A text file with random numbers should not become a GPS success.

## Filename coordinate examples

Use explicit `lat` and `lon` tokens in the filename:

```text
IMG_0001_lat_58.37763_lon_26.72901.jpg
IMG_0001_lat=58.37763_lon=26.72901.jpg
IMG_0001_gps_58.37763_26.72901.jpg
```

Avoid vague filenames like:

```text
IMG_58_37763_26_72901.jpg
```

Those values are not explicit enough and should not be treated as coordinates.

## Path coordinate examples

Use explicit coordinate tokens in a parent folder name:

```text
photos/lat_58.37763_lon_26.72901/IMG_0001.jpg
photos/tartu_gps_58.37763_26.72901/IMG_0001.jpg
```

Path coordinates are the last fallback because folder-level coordinates may apply to many images. Prefer embedded EXIF or sidecar metadata when possible.

## Bounds and validation

| Field | Valid range |
| --- | --- |
| Latitude | `-90` to `90` |
| Longitude | `-180` to `180` |

Invalid, missing, or malformed values must result in no GPS success for that provider. They should not silently become `0,0` or placeholder coordinates.

## Verification steps

1. Start from a clean copy of the current baseline.
2. Put one test media file in the configured download/media path.
3. Add exactly one metadata source for the method being tested.
4. Run Index so the file enters the GPS queue.
5. Run GPS parser.
6. Check the endpoint response, backend log, and database row.
7. Confirm the expected provider/method is visible in sanitized evidence where available.
8. Remove the sidecar/name/path test data before testing another method.

## Evidence table

Use this table when recording PC/runtime results.

| Method | Test media path | Metadata file/path/name used | Expected coordinates | Stage result | DB evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| EXIF |  | Embedded EXIF |  |  |  |  |
| JSON sidecar |  |  |  |  |  |  |
| XMP sidecar |  |  |  |  |  |  |
| Text sidecar |  |  |  |  |  |  |
| Filename coordinates |  |  |  |  |  |  |
| Path coordinates |  |  |  |  |  |  |

## What this runbook does not prove

| Not proven | Reason |
| --- | --- |
| HEIC/video metadata coverage | Those require explicit future fixtures/providers. |
| Address quality | GPS parsing only produces coordinates; geocoding is a separate stage. |
| Real iCloudPD download success | Download/auth is a separate provider boundary. |
| Raspberry playback recovery | This runbook only covers GPS coordinate extraction sources. |
