/*
 * Public compatibility entrypoint for inspect-mode guide copy.
 * Feature-specific copy now lives in dashboard/inspect/guideCopy/* modules.
 */
import { ACTION_BACKEND_STATUS_COPY } from './guideCopy/backendStatusCopy.ts';
import { INIT_ACTION_TO_CODE } from './guideCopy/initActions.ts';
import {
  ACTION_INSPECT_COPY,
  CURRENT_TRUTH_VALUE_SOURCES,
  FALLBACK_INSPECT_DESCRIPTION,
  INSPECT_COPY,
  INSPECT_EYEBROWS,
  LAST_RUN_MODE_INSPECT_COPY,
} from './guideCopy/inspectCopy.ts';
import { ACTION_REALITY_COPY, VIEW_REALITY_COPY } from './guideCopy/realityCopy.ts';
import { BACKEND_STATUS_TITLES, REALITY_STATE_TITLES } from './guideCopy/stateTitles.ts';

export type GuideTitleMap = Record<string, string>;

export type GuideCopyEntry = {
  label: string;
  description: string;
};

export type GuideStateReasonEntry = {
  state: string;
  reason: string;
};

export type GuideCopyEntryMap = Record<string, GuideCopyEntry>;
export type GuideTextSourceMap = Record<string, string>;
export type GuideStateReasonMap = Record<string, GuideStateReasonEntry>;

export type InspectCopyMap = {
  logEntry: GuideCopyEntry;
  historyEntry: GuideCopyEntry;
  inactivityTimeout: GuideCopyEntry;
  dbTableDescription: string;
  dbPageDescriptions: Record<string, string>;
  simulationControls: Record<string, GuideCopyEntry | Record<string, GuideCopyEntry>>;
};

export {
  ACTION_BACKEND_STATUS_COPY,
  ACTION_INSPECT_COPY,
  ACTION_REALITY_COPY,
  BACKEND_STATUS_TITLES,
  CURRENT_TRUTH_VALUE_SOURCES,
  FALLBACK_INSPECT_DESCRIPTION,
  INIT_ACTION_TO_CODE,
  INSPECT_COPY,
  INSPECT_EYEBROWS,
  LAST_RUN_MODE_INSPECT_COPY,
  REALITY_STATE_TITLES,
  VIEW_REALITY_COPY,
};
