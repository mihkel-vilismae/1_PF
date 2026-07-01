// Models the View 0 test-page selector flow.
// The selector only changes terminal-demo state and writes no runtime data.
// It supports default route 0A and typed integer/character test routes.

export type View0TestSelectorStep = 'closed' | 'integer' | 'character' | 'routed';

export interface View0TestSelectorState {
  step: View0TestSelectorStep;
  selectedInteger: number | null;
  selectedCharacter: string | null;
  targetTestPage: string | null;
  draftInteger: string;
  draftCharacter: string;
  messages: string[];
}

// Creates the closed selector state shown when View 0 first opens.
export function createView0TestSelectorState(): View0TestSelectorState {
  return {
    step: 'closed',
    selectedInteger: null,
    selectedCharacter: null,
    targetTestPage: null,
    draftInteger: '',
    draftCharacter: '',
    messages: ['Press Enter to open the default test-page selector.']
  };
}

// Clones selector state so callers do not share mutable message arrays.
export function cloneView0TestSelectorState(state: View0TestSelectorState): View0TestSelectorState {
  return { ...state, messages: [...state.messages] };
}

// Opens the integer step of the View 0 selector.
export function openView0TestSelector(): View0TestSelectorState {
  return {
    step: 'integer',
    selectedInteger: null,
    selectedCharacter: null,
    targetTestPage: null,
    draftInteger: '',
    draftCharacter: '',
    messages: ['Test-page selector opened.', 'Integer step: type an integer or press Enter to accept default integer 0.']
  };
}

// Adds one digit to the selector's integer draft.
export function appendIntegerDigit(state: View0TestSelectorState, digit: string): View0TestSelectorState {
  const nextDraft = `${state.draftInteger}${digit}`.replace(/^0+(?=\d)/, '');
  return { ...state, draftInteger: nextDraft, messages: [`Integer input: ${nextDraft}.`, 'Press Enter to confirm the integer.'] };
}

// Records the one-character route suffix for the selector.
export function setCharacterInput(state: View0TestSelectorState, character: string): View0TestSelectorState {
  const selected = character.toUpperCase().slice(0, 1);
  return { ...state, draftCharacter: selected, messages: [`Character input: ${selected}.`, 'Press Enter to confirm the character.'] };
}

// Confirms the integer step, defaulting to 0 when no digit was typed.
export function acceptDefaultInteger(state: View0TestSelectorState): View0TestSelectorState {
  const selectedInteger = state.draftInteger === '' ? 0 : Number.parseInt(state.draftInteger, 10);
  const source = state.draftInteger === '' ? 'Default integer accepted' : 'Typed integer accepted';
  return {
    ...state,
    step: 'character',
    selectedInteger,
    messages: [`${source}: ${selectedInteger}.`, 'Character step: type a character or press Enter to accept default character A.']
  };
}

// Confirms the character step, defaulting to A and producing the route code.
export function acceptDefaultCharacterAndRoute(state: View0TestSelectorState): View0TestSelectorState {
  const selectedInteger = state.selectedInteger ?? 0;
  const selectedCharacter = (state.draftCharacter || 'A').toUpperCase().slice(0, 1);
  const source = state.draftCharacter === '' ? 'Default character accepted' : 'Typed character accepted';
  return {
    ...state,
    step: 'routed',
    selectedInteger,
    selectedCharacter,
    targetTestPage: `${selectedInteger}${selectedCharacter}`,
    messages: [`${source}: ${selectedCharacter}.`, `Navigated to test page ${selectedInteger}${selectedCharacter}.`]
  };
}
