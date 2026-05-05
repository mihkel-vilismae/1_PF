type EventHistoryEntry = Record<string, unknown>;

type EventHistoryExportPayload = {
  exportedAt: string;
  source: 'Event history';
  count: number;
  logs: EventHistoryEntry[];
};

type ClipboardLike = {
  writeText: (text: string) => Promise<void>;
};

export function buildEventHistoryExportPayload(
  entries: EventHistoryEntry[] = [],
  exportedAt: string = new Date().toISOString(),
): EventHistoryExportPayload {
  const logs = toJsonValue(entries);
  return {
    exportedAt,
    source: 'Event history',
    count: logs.length,
    logs,
  };
}

export function formatEventHistoryExport(
  entries: EventHistoryEntry[] = [],
  exportedAt?: string,
): string {
  return JSON.stringify(buildEventHistoryExportPayload(entries, exportedAt), null, 2);
}

export async function copyEventHistoryExportToClipboard(
  entries: EventHistoryEntry[] = [],
  clipboard: ClipboardLike | undefined = globalThis.navigator?.clipboard,
): Promise<void> {
  if (!clipboard?.writeText) {
    throw new Error('Clipboard API is not available.');
  }

  await clipboard.writeText(formatEventHistoryExport(entries));
}

function toJsonValue(entries: EventHistoryEntry[]): EventHistoryEntry[] {
  return JSON.parse(JSON.stringify(entries));
}
