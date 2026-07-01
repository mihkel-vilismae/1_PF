// Defines terminal layout vocabulary used by docs and proofs.
// Keep this file focused so future slices can stay below the 300 LOC target.

export const terminalLayoutVocabulary = [
  { term: 'View', definition: 'The whole full-screen terminal screen/state currently shown.' },
  { term: 'Pane', definition: 'A large top-level region inside a view.' },
  { term: 'Section', definition: 'A bordered block inside a pane.' },
  { term: 'Subsection', definition: 'A smaller logical block inside a section.' },
  { term: 'Modal', definition: 'A view-scoped overlay visible only when opened/enabled.' },
  { term: 'SectionHeader', definition: 'The visible title line of a section.' },
  { term: 'SectionBody', definition: 'The content area inside a section.' },
  { term: 'ViewKey', definition: 'A keyboard key that selects a terminal view when no modal owns input.' }
] as const;
