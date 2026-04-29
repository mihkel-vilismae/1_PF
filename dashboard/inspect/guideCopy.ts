import guideCopy from './guideCopy.json' with { type: 'json' };

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

export const REALITY_STATE_TITLES: GuideTitleMap = guideCopy.realityStateTitles;
export const BACKEND_STATUS_TITLES: GuideTitleMap = guideCopy.backendStatusTitles;
export const INIT_ACTION_TO_CODE: GuideTitleMap = guideCopy.initActionToCode;
export const INSPECT_EYEBROWS: GuideTitleMap = guideCopy.inspectEyebrows;
export const FALLBACK_INSPECT_DESCRIPTION: string = guideCopy.fallbackInspectDescription;
export const ACTION_INSPECT_COPY: GuideCopyEntryMap = guideCopy.actionInspectCopy;
export const LAST_RUN_MODE_INSPECT_COPY: GuideCopyEntryMap = guideCopy.lastRunModeInspectCopy;
export const CURRENT_TRUTH_VALUE_SOURCES: GuideTextSourceMap = guideCopy.currentTruthValueSources;
export const ACTION_REALITY_COPY: GuideStateReasonMap = guideCopy.actionRealityCopy;
export const VIEW_REALITY_COPY: GuideStateReasonMap = guideCopy.viewRealityCopy;
export const ACTION_BACKEND_STATUS_COPY: GuideStateReasonMap = guideCopy.actionBackendStatusCopy;
export const INSPECT_COPY: InspectCopyMap = guideCopy.inspectCopy;
