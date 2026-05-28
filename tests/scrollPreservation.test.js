/*
 * Guards scroll preservation for full dashboard root re-renders.
 * These focused tests use small DOM-like fakes so they stay fast and browser-free.
 * The behavior prevents marked modal, log, and history containers from jumping to top.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  captureScrollSnapshot,
  restoreScrollSnapshot,
} from '../dashboard/services/scrollPreservation.ts';

class FakeElement {
  constructor(key, scrollTop = 0, scrollLeft = 0) {
    this.key = key;
    this.scrollTop = scrollTop;
    this.scrollLeft = scrollLeft;
  }

  // Emulates the DOM getAttribute call used by the scroll helper.
  getAttribute(name) {
    if (name !== 'data-scroll-preserve') {
      return null;
    }
    return this.key;
  }
}

class FakeRoot {
  constructor(elements) {
    this.elements = elements;
  }

  // Returns all explicitly marked fake elements for preservation helper tests.
  querySelectorAll(selector) {
    assert.equal(selector, '[data-scroll-preserve]');
    return this.elements;
  }
}

test('captures marked scroll container positions by stable key', () => {
  const root = new FakeRoot([
    new FakeElement('modal-detail', 120, 5),
    new FakeElement('history-panel', 42, 0),
  ]);

  const snapshot = captureScrollSnapshot(root);

  assert.deepEqual(snapshot.containers.get('modal-detail'), { scrollTop: 120, scrollLeft: 5 });
  assert.deepEqual(snapshot.containers.get('history-panel'), { scrollTop: 42, scrollLeft: 0 });
});

test('restores marked scroll positions after replacement nodes are rendered', () => {
  const before = new FakeRoot([
    new FakeElement('modal-detail', 180, 11),
    new FakeElement('terminal-log', 77, 3),
  ]);
  const snapshot = captureScrollSnapshot(before);
  const afterModal = new FakeElement('modal-detail', 0, 0);
  const afterTerminal = new FakeElement('terminal-log', 0, 0);
  const after = new FakeRoot([afterModal, afterTerminal]);

  restoreScrollSnapshot(after, snapshot);

  assert.equal(afterModal.scrollTop, 180);
  assert.equal(afterModal.scrollLeft, 11);
  assert.equal(afterTerminal.scrollTop, 77);
  assert.equal(afterTerminal.scrollLeft, 3);
});

test('ignores unmarked or missing replacement containers safely', () => {
  const before = new FakeRoot([
    new FakeElement('', 100, 0),
    new FakeElement('existing-log', 66, 6),
  ]);
  const snapshot = captureScrollSnapshot(before);
  const unrelated = new FakeElement('different-log', 0, 0);

  restoreScrollSnapshot(new FakeRoot([unrelated]), snapshot);

  assert.equal(snapshot.containers.has(''), false);
  assert.equal(unrelated.scrollTop, 0);
  assert.equal(unrelated.scrollLeft, 0);
});
