/*
 * Compatibility entrypoint for backend-status inspect metadata helpers.
 * The detailed element classification logic lives in feature modules.
 */
import { createDescribeBackendStatusElement } from './backendStatusMetadata/describeBackendStatusElement.ts';

export function createBackendStatusMetadataHelpers({ getState, getTransitHasLiveTraffic }) {
  return {
    describeBackendStatusElement: createDescribeBackendStatusElement({ getState, getTransitHasLiveTraffic }),
  };
}
