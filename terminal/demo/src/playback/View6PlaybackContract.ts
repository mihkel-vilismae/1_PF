// Defines the View 6 fixture-backed playback contract.
// Queue-backed controls are visible but disabled in this slice.
// Enabled fixture controls generate real browser-renderable playback artifacts.

export type View6MediaType = 'image' | 'video';
export type View6PlaybackMode = 'html_browser' | 'fullscreen_no_overlay' | 'address_overlay';
export type View6PlaybackSource = 'future_queue' | 'fixture';

export interface View6PlaybackButtonContract {
  label: string;
  source: View6PlaybackSource;
  mediaType: View6MediaType;
  playbackMode: View6PlaybackMode;
  enabled: boolean;
}

export interface View6PlaybackFixtureContract {
  role: View6MediaType;
  sourcePath: string;
  fixturePath: string;
}

export const VIEW6_QUEUE_DISABLED_NOTICE =
  'Right now we are using hard-coded files, not using files from the playback queue table.';

export const view6QueuePlaybackButtons: readonly View6PlaybackButtonContract[] = [
  { label: 'Play queued images in HTML browser', source: 'future_queue', mediaType: 'image', playbackMode: 'html_browser', enabled: false },
  { label: 'Play queued videos in HTML browser', source: 'future_queue', mediaType: 'video', playbackMode: 'html_browser', enabled: false },
  { label: 'Play queued images full screen without overlay', source: 'future_queue', mediaType: 'image', playbackMode: 'fullscreen_no_overlay', enabled: false },
  { label: 'Play queued videos full screen without overlay', source: 'future_queue', mediaType: 'video', playbackMode: 'fullscreen_no_overlay', enabled: false },
  { label: 'Show queued images with address overlay', source: 'future_queue', mediaType: 'image', playbackMode: 'address_overlay', enabled: false },
  { label: 'Show queued videos with address overlay', source: 'future_queue', mediaType: 'video', playbackMode: 'address_overlay', enabled: false }
] as const;

export const view6FixturePlaybackButtons: readonly View6PlaybackButtonContract[] = [
  { label: 'Play fixture image in HTML browser', source: 'fixture', mediaType: 'image', playbackMode: 'html_browser', enabled: true },
  { label: 'Play fixture video in HTML browser', source: 'fixture', mediaType: 'video', playbackMode: 'html_browser', enabled: true },
  { label: 'Play fixture image full screen without overlay', source: 'fixture', mediaType: 'image', playbackMode: 'fullscreen_no_overlay', enabled: true },
  { label: 'Play fixture video full screen without overlay', source: 'fixture', mediaType: 'video', playbackMode: 'fullscreen_no_overlay', enabled: true },
  { label: 'Show fixture image with address overlay', source: 'fixture', mediaType: 'image', playbackMode: 'address_overlay', enabled: true },
  { label: 'Show fixture video with address overlay', source: 'fixture', mediaType: 'video', playbackMode: 'address_overlay', enabled: true }
] as const;

export const view6PlaybackFixtures: readonly View6PlaybackFixtureContract[] = [
  {
    role: 'image',
    sourcePath: 'generated_test_data/gps_valid/gps_valid_01.jpg',
    fixturePath: 'terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg'
  },
  {
    role: 'video',
    sourcePath: 'generated_test_data/gps_valid/gps_valid_video_02_tartu.mp4',
    fixturePath: 'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4'
  }
] as const;
