-- Photo Frame canonical schema baseline
-- Based on: docs/CANONICAL_SCHEMA_PROPOSAL.md
-- Purpose: create the proposed canonical baseline schema in a safe, idempotent,
-- SQLite-compatible form for future migration and integration work.
-- Status: proposed baseline creation script; this does not assert that the schema
-- is already implemented in the current runtime.

PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS canonical_media_assets (
  media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_key TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  canonical_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_extension TEXT,
  file_size_bytes INTEGER,
  content_hash TEXT,
  captured_at TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  gps_altitude REAL,
  gps_status TEXT NOT NULL DEFAULT 'GPS_PENDING' CHECK (
    gps_status IN ('GPS_PENDING', 'GPS_FOUND', 'GPS_NOT_FOUND', 'GPS_FAILED')
  ),
  geocode_status TEXT NOT NULL DEFAULT 'GEOCODE_PENDING' CHECK (
    geocode_status IN ('GEOCODE_PENDING', 'GEOCODE_FOUND', 'GEOCODE_FAILED')
  ),
  address_text TEXT,
  address_cache_key TEXT,
  successful_gps_parser_method TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (address_cache_key) REFERENCES address_cache(address_cache_key)
);

CREATE TABLE IF NOT EXISTS media_asset_variants (
  variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL,
  variant_kind TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_extension TEXT,
  file_size_bytes INTEGER,
  width_px INTEGER,
  height_px INTEGER,
  duration_ms INTEGER,
  checksum TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(media_asset_id, variant_kind, file_path),
  FOREIGN KEY (media_asset_id) REFERENCES canonical_media_assets(media_asset_id)
);

CREATE TABLE IF NOT EXISTS address_cache (
  address_cache_key TEXT PRIMARY KEY,
  rounded_latitude REAL NOT NULL,
  rounded_longitude REAL NOT NULL,
  address_text TEXT NOT NULL,
  provider_name TEXT,
  provider_response_json TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parse_files_for_gps_queue (
  gps_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (
    status IN ('PENDING', 'PROCESSING', 'RETRY', 'RETRY_EXHAUSTED', 'COMPLETED', 'NO_GPS_FOUND')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  processing_started_at TEXT,
  processing_finished_at TEXT,
  successful_parser_method TEXT,
  failure_code TEXT,
  failure_message TEXT,
  claimed_by TEXT,
  lease_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (media_asset_id) REFERENCES canonical_media_assets(media_asset_id)
);

CREATE TABLE IF NOT EXISTS geocode_queue (
  geocode_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (
    status IN ('PENDING', 'PROCESSING', 'RETRY', 'RETRY_EXHAUSTED', 'COMPLETED')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  processing_started_at TEXT,
  processing_finished_at TEXT,
  geocode_provider TEXT,
  failure_code TEXT,
  failure_message TEXT,
  claimed_by TEXT,
  lease_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (media_asset_id) REFERENCES canonical_media_assets(media_asset_id)
);

CREATE TABLE IF NOT EXISTS slideshow_queue (
  slideshow_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('READY', 'FAILED')),
  failure_reason TEXT,
  sort_bucket TEXT,
  eligible_since TEXT,
  last_shown_datetime TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (media_asset_id) REFERENCES canonical_media_assets(media_asset_id)
);

CREATE TABLE IF NOT EXISTS runtime_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT,
  value_type TEXT NOT NULL DEFAULT 'text',
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS action_runs (
  action_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_name TEXT NOT NULL,
  stage_name TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('PROCESSING', 'WAITING_FOR_2FA', 'COMPLETED', 'FAILED')
  ),
  trigger_source TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  result_summary TEXT,
  error_code TEXT,
  error_message TEXT,
  correlation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_logs (
  system_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL,
  severity TEXT NOT NULL,
  component TEXT NOT NULL,
  event_type TEXT,
  message TEXT NOT NULL,
  payload_json TEXT,
  correlation_id TEXT,
  action_run_id INTEGER,
  FOREIGN KEY (action_run_id) REFERENCES action_runs(action_run_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_media_assets_asset_key
ON canonical_media_assets(asset_key);

CREATE INDEX IF NOT EXISTS idx_canonical_media_assets_gps_status
ON canonical_media_assets(gps_status);

CREATE INDEX IF NOT EXISTS idx_canonical_media_assets_geocode_status
ON canonical_media_assets(geocode_status);

CREATE INDEX IF NOT EXISTS idx_parse_gps_queue_status_next_attempt
ON parse_files_for_gps_queue(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_geocode_queue_status_next_attempt
ON geocode_queue(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_slideshow_queue_status_last_shown
ON slideshow_queue(status, last_shown_datetime);

CREATE INDEX IF NOT EXISTS idx_system_logs_occurred_at
ON system_logs(occurred_at);

CREATE INDEX IF NOT EXISTS idx_action_runs_stage_status
ON action_runs(stage_name, status);

INSERT OR IGNORE INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
VALUES
  ('current_media_asset_id', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('playback_runner_owner', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('playback_runner_lease_until', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('playback_runner_last_heartbeat', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('screen_power_state', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('screen_state_updated_at', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('screen_state_source', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('screen_worker_heartbeat_at', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('pipeline_stage', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql'),
  ('pipeline_stage_state', NULL, 'text', CURRENT_TIMESTAMP, 'database/schema.sql');

COMMIT;
