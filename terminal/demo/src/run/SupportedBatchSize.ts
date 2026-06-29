// Defines supported terminal Demo Mode batch sizes.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type SupportedBatchSize = 1 | 5;

export function toggleBatchSize(value: SupportedBatchSize): SupportedBatchSize {
  return value === 1 ? 5 : 1;
}

export function parseBatchSize(value: unknown): SupportedBatchSize {
  return Number(value) === 5 ? 5 : 1;
}
