import statusRegistry from './v2ImplementationStatus.json' with { type: 'json' };

export type V2ImplementationStatusName = 'done' | 'in-progress' | 'not-implemented';

export type V2ImplementationStatusElement = {
  id: string;
  label: string;
  status: V2ImplementationStatusName;
  summary: string;
  requiresProofRunner: boolean;
  requiresLiveTarget: boolean;
  claimAllowedBeforeProof: boolean;
  proofCommand: string;
};

export type V2ImplementationStatusRegistry = {
  schemaVersion: number;
  scope: 'v2-only';
  sourceDocument: string;
  legend: Record<V2ImplementationStatusName, { label: string; color: string; meaning: string }>;
  proofGatePolicy?: {
    label: string;
    defaultClaimAllowedBeforeProof: boolean;
    meaning: string;
    allowedPreProofClaims: string[];
  };
  elements: V2ImplementationStatusElement[];
};

export const V2_IMPLEMENTATION_STATUS_REGISTRY = statusRegistry as V2ImplementationStatusRegistry;

export function getV2ImplementationStatusElement(id: string): V2ImplementationStatusElement | null {
  return V2_IMPLEMENTATION_STATUS_REGISTRY.elements.find((element) => element.id === id) ?? null;
}

export function getV2PageStatusId(route: string): string {
  return `v2.page.${route}`;
}

export function getV2BlockStatusId(blockId: string): string {
  return `v2.block.${blockId}`;
}
