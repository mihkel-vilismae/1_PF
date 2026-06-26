# V2 Playback Media Metadata Proof Matrix

Checkpoint: `v0.10.58` / B9.4.

## Covered proof claims

| Claim | Proof surface |
|---|---|
| image/video rows expose backend prepare | `tests/v2PlaybackMediaMetadataProof.test.js` renders one image row and one video row and requires two `v2-playback-queue-prepare-item` buttons. |
| non-media rows stay blocked | The same render test includes a `notes.txt` row and requires `Not playable` plus the non-media backend-prepare block message. |
| queue prepare request preserves metadata status | The queue insertion proof sends a media bridge request through existing `run-b3-5` / `POST /api/runtime/queue/prepare` and asserts `gpsStatus` and `addressStatus` survive in the request body. |
| missing GPS/address remains explicit | The missing metadata proof asserts `GPS missing` / `Address missing` labels and rejects fabricated address examples. |

## Boundaries

- This is still not a browser upload/import proof.
- This is not a real EXIF extraction proof.
- This is not an address overlay proof.
- Real address strings still belong to pipeline/geocode metadata, not browser-local fabrication.
