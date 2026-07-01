# Terminal Demo View 6 Fixture Playback Contract OpenSpec

## Scope

View `6` is no longer a blank shell. It renders a fixture-backed playback contract page while keeping real playback deferred.

The page must show:

- `QUEUE-BACKED PLAYBACK - FUTURE DISABLED`;
- `Right now we are using hard-coded files, not using files from the playback queue table.`;
- six disabled future queue-backed buttons;
- `FIXTURE-BACKED PLAYBACK - CURRENT ENABLED`;
- six enabled fixture-backed buttons;
- fixture paths copied under `terminal/demo/test_data/playback_fixtures/`.

## Fixture Files

| Fixture | Source |
|---|---|
| `terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg` | `generated_test_data/gps_valid/gps_valid_01.jpg` |
| `terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4` | `generated_test_data/gps_valid/gps_valid_video_02_tartu.mp4` |

## Non-Claims

This slice does not launch browser playback, fullscreen playback, address-overlay playback, worker execution, queue execution, auth, DB writes, cron, or hardware behavior.
