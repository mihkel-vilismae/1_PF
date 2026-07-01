// Handles View 0 selector input and shared action logging.
// The controller is terminal-demo local and does not call workers or cron.
// It produces route evidence for default and custom test pages.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { writeTerminalActionLog } from '../run/TerminalActionLogWriter.js';
import {
  acceptDefaultCharacterAndRoute,
  acceptDefaultInteger,
  appendIntegerDigit,
  openView0TestSelector,
  setCharacterInput,
  type View0TestSelectorState
} from './View0TestSelectorState.js';

export interface View0EnterResult {
  selector: View0TestSelectorState;
  activeTestPageCode: string | null;
  messages: string[];
}

// Logs the operator opening View 0 from the terminal view map.
export function writeView0Opened(boundary: RuntimeBoundaryState): string {
  return writeTerminalActionLog({
    boundary,
    event: {
      source: 'terminal-demo',
      view: '0',
      action: 'view0_opened',
      branchFeature: 'view0_map_testing',
      button: '0',
      inputSequence: ['0'],
      noCron: true,
      result: 'VIEW0_OPENED',
      messages: ['map and testing - view 0 opened']
    }
  }).message;
}

// Applies typed digit/letter input while the View 0 selector owns input.
export function handleView0SelectorInput(input: { selector: View0TestSelectorState; key: string }): View0EnterResult {
  if (input.selector.step === 'integer' && /^\d$/.test(input.key)) {
    const selector = appendIntegerDigit(input.selector, input.key);
    return { selector, activeTestPageCode: null, messages: selector.messages };
  }
  if (input.selector.step === 'character' && /^[A-Z]$/.test(input.key)) {
    const selector = setCharacterInput(input.selector, input.key);
    return { selector, activeTestPageCode: null, messages: selector.messages };
  }
  return { selector: input.selector, activeTestPageCode: null, messages: input.selector.messages };
}

// Advances the View 0 selector on Enter and logs each completed step.
export function handleView0DefaultEnter(input: {
  boundary: RuntimeBoundaryState;
  selector: View0TestSelectorState;
}): View0EnterResult {
  if (input.selector.step === 'closed' || input.selector.step === 'routed') {
    const selector = openView0TestSelector();
    const log = writeView0Event(input.boundary, 'view0_test_selector_opened', ['0', 'Enter'], 'TEST_SELECTOR_OPENED');
    return { selector, activeTestPageCode: null, messages: [...selector.messages, log] };
  }

  if (input.selector.step === 'integer') {
    const selectedInteger = input.selector.draftInteger === '' ? 0 : Number.parseInt(input.selector.draftInteger, 10);
    const selector = acceptDefaultInteger(input.selector);
    const log = writeView0Event(input.boundary, 'view0_test_integer_selected', integerSequence(input.selector), 'TEST_INTEGER_READY', { selectedInteger });
    return { selector, activeTestPageCode: null, messages: [...selector.messages, log] };
  }

  const selector = acceptDefaultCharacterAndRoute(input.selector);
  const log = writeView0Event(input.boundary, 'view0_test_page_route_completed', routeSequence(input.selector), 'TEST_PAGE_ROUTE_READY', {
    selectedInteger: selector.selectedInteger,
    selectedCharacter: selector.selectedCharacter,
    targetTestPage: selector.targetTestPage
  });
  return { selector, activeTestPageCode: selector.targetTestPage, messages: [...selector.messages, log] };
}

// Builds the route input sequence through integer confirmation.
function integerSequence(selector: View0TestSelectorState): string[] {
  return ['0', 'Enter', ...selector.draftInteger.split(''), 'Enter'];
}

// Builds the complete route input sequence through character confirmation.
function routeSequence(selector: View0TestSelectorState): string[] {
  return ['0', 'Enter', ...selector.draftInteger.split(''), 'Enter', ...selector.draftCharacter.split(''), 'Enter'];
}

// Writes one View 0 route event to the shared terminal action log.
function writeView0Event(boundary: RuntimeBoundaryState, action: string, inputSequence: string[], result: string, extra: Record<string, unknown> = {}): string {
  return writeTerminalActionLog({
    boundary,
    event: {
      source: 'terminal-demo',
      view: '0',
      action,
      branchFeature: 'view0_map_testing',
      button: 'Enter',
      inputSequence,
      noCron: true,
      result,
      messages: [`View 0 test route event: ${action}.`],
      ...extra
    }
  }).message;
}
