// Defines terminal Demo Mode state and initial state factories.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoPlaybackSelectedItem } from '../playback/DemoPlaybackStatusRepository.js';

export type RuntimeMode = 'mock-demo' | 'demo';
export type MediaType = 'image' | 'video';
export type IndexedStatus = 'no' | 'yes';
export type GpsStatus = 'not parsed' | 'missing' | 'invalid' | 'valid';
export type GeocodeStatus = 'not run' | 'resolved' | 'failed' | 'skipped';
export type QueueStatus = 'not queued' | 'enqueued' | 'not eligible';
export type StageStatus = 'Idle' | 'Started' | 'Finished' | 'Error';
export type WorkerStatus = 'Waiting' | 'Started' | 'Finished' | 'Disabled' | 'Error';
export type SupportedBatchSize = 1 | 5;

export interface PlaybackQueueRow {
  queueId: string;
  rowNumber: number | null;
  fileName: string;
  relativePath: string;
  type: MediaType;
  address: string;
  status: string;
  source: string;
}

export interface MediaRow {
  rowNumber: number;
  fileName: string;
  relativePath?: string;
  type: MediaType;
  indexed: IndexedStatus;
  gps: GpsStatus;
  geocode: GeocodeStatus;
  queue: QueueStatus;
  address: string;
}

export interface StagePanelRow {
  name: 'Download' | 'Index' | 'GPS parser' | 'Geocode' | 'Queue';
  status: StageStatus;
  details: string;
}

export interface WorkerPanelRow {
  name: 'Regular state worker' | 'Playback worker' | 'On-off worker';
  status: WorkerStatus;
  lastCalled: string;
  lastEvent: string;
}

export interface ActionItemState {
  key: string;
  label: string;
  enabled: boolean;
  info: string;
  active: boolean;
  done: boolean;
}

export interface CurrentRunState {
  title: string;
  lines: string[];
}

export type LogPanelHitboxId = 'area-a-log-panel' | 'area-a-collapse-toggle' | 'area-b-command-plan' | 'area-c-preview';

export interface TerminalMouseHitbox {
  id: LogPanelHitboxId;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RealTimeLogPanelState {
  title: string;
  lines: string[];
  collapsed: boolean;
  focused: boolean;
  scrollOffset: number;
  visibleRows: number;
  hitboxes: TerminalMouseHitbox[];
}

export interface PlaybackState {
  runPlaybackEnabled: boolean;
  info: string;
  imageDurationSeconds: 1 | 5 | 10;
  selectedItem: DemoPlaybackSelectedItem | null;
  selectedStatus: 'waiting' | 'selected' | 'skipped' | 'failed' | 'unknown';
  selectedSourcePath: string;
  selectedMessages: string[];
  fullScreenEnabled: boolean;
  fullScreenInfo: string;
}

export interface ScreenOnOffState {
  keyboardEnabled: boolean;
  mouseEnabled: boolean;
  pirSensorEnabled: boolean;
  info: string;
}

export interface DemoTerminalState {
  version: string;
  runtimeMode: RuntimeMode;
  dataMode: 'mock_state' | 'real_demo_truth';
  runtimeBoundary: RuntimeBoundaryState;
  banner: string;
  warning: string;
  selectedBatchSize: SupportedBatchSize;
  mediaRows: MediaRow[];
  playbackQueueRows: PlaybackQueueRow[];
  actions: ActionItemState[];
  currentRun: CurrentRunState;
  realTimeLog: RealTimeLogPanelState;
  rpiStages: StagePanelRow[];
  rpiWorkers: WorkerPanelRow[];
  playback: PlaybackState;
  screenOnOff: ScreenOnOffState;
}
