/*
 * Captures and restores dashboard scroll positions across full-root re-renders.
 * The helper only preserves elements with explicit data-scroll-preserve keys.
 * It keeps the existing render architecture intact while preventing user scroll jumps.
 * Browser viewport scroll is preserved when the DOM environment exposes window scroll APIs.
 */

type ScrollPosition = {
  scrollTop: number;
  scrollLeft: number;
};

export type ScrollSnapshot = {
  containers: Map<string, ScrollPosition>;
  viewport: ScrollPosition | null;
};

const SCROLL_PRESERVE_ATTRIBUTE = 'data-scroll-preserve';
const SCROLL_PRESERVE_SELECTOR = `[${SCROLL_PRESERVE_ATTRIBUTE}]`;

// Reads the stable preservation key from a marked scroll container.
function getScrollPreserveKey(element: Element): string | null {
  const value = element.getAttribute(SCROLL_PRESERVE_ATTRIBUTE);
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}

// Captures the current browser viewport scroll when running in a browser-like environment.
function captureViewportScroll(): ScrollPosition | null {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return null;
  }

  return {
    scrollTop: Number(browserWindow.scrollY ?? 0),
    scrollLeft: Number(browserWindow.scrollX ?? 0),
  };
}

// Restores browser viewport scroll without throwing in non-browser test environments.
function restoreViewportScroll(position: ScrollPosition | null): void {
  const browserWindow = globalThis.window;
  if (!browserWindow || !position || typeof browserWindow.scrollTo !== 'function') {
    return;
  }

  browserWindow.scrollTo(position.scrollLeft, position.scrollTop);
}

// Captures marked scroll container positions before a full dashboard re-render.
export function captureScrollSnapshot(root: ParentNode | null | undefined): ScrollSnapshot {
  const containers = new Map<string, ScrollPosition>();
  if (!root) {
    return {
      containers,
      viewport: captureViewportScroll(),
    };
  }

  root.querySelectorAll(SCROLL_PRESERVE_SELECTOR).forEach((element) => {
    const key = getScrollPreserveKey(element);
    if (!key) {
      return;
    }

    containers.set(key, {
      scrollTop: Number((element as HTMLElement).scrollTop ?? 0),
      scrollLeft: Number((element as HTMLElement).scrollLeft ?? 0),
    });
  });

  return {
    containers,
    viewport: captureViewportScroll(),
  };
}

// Restores marked scroll container positions after the dashboard DOM is rebuilt.
export function restoreScrollSnapshot(root: ParentNode | null | undefined, snapshot: ScrollSnapshot | null | undefined): void {
  if (!snapshot) {
    return;
  }

  restoreViewportScroll(snapshot.viewport);

  if (!root || snapshot.containers.size === 0) {
    return;
  }

  root.querySelectorAll(SCROLL_PRESERVE_SELECTOR).forEach((element) => {
    const key = getScrollPreserveKey(element);
    if (!key || !snapshot.containers.has(key)) {
      return;
    }

    const position = snapshot.containers.get(key);
    if (!position) {
      return;
    }

    (element as HTMLElement).scrollTop = position.scrollTop;
    (element as HTMLElement).scrollLeft = position.scrollLeft;
  });
}

// Re-runs restoration on the next animation frame so browser layout changes cannot undo the immediate restore.
export function restoreScrollSnapshotAfterLayout(root: ParentNode | null | undefined, snapshot: ScrollSnapshot | null | undefined): void {
  restoreScrollSnapshot(root, snapshot);

  const browserWindow = globalThis.window;
  if (!browserWindow || typeof browserWindow.requestAnimationFrame !== 'function') {
    return;
  }

  browserWindow.requestAnimationFrame(() => restoreScrollSnapshot(root, snapshot));
}
