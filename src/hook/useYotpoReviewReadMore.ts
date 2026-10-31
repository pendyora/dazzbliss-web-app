'use client';

import { RefObject, useEffect } from 'react';

// Yotpo's SEO Page widget (the PDP "Site Reviews" / "Product Reviews" tabs)
// prints every review in full, so a long review pushes the rest of the list far
// down the page (worst on mobile). Yotpo exposes no word/height limit for this
// widget, and the markup is rendered by their own Vue app — so we clamp it from
// the outside: keep the first N words, and append a toggle that swaps back to
// the full text. Title and body are clamped independently (reviewers sometimes
// paste a whole review into the title field), each with its own toggle.
//
// Both tabs render into the same container and Yotpo re-renders it on tab
// switch and pagination, so the work is driven by a MutationObserver rather
// than done once. Clamped nodes are marked with PROCESSED_ATTR, so the passes
// triggered by our own DOM writes are no-ops and can't loop.
const TITLE_WORD_LIMIT = 15;
const CONTENT_WORD_LIMIT = 50;
const PROCESSED_ATTR = 'data-yotpo-clamped';
const TOGGLE_CLASS = 'yotpo-read-more-toggle';
const MORE_LABEL = 'Read More';
const LESS_LABEL = 'Read Less';

const CARD_SELECTOR = '.yotpo-review';
const TITLE_SELECTOR = '.yotpo-review-title';
const CONTENT_BOX_SELECTOR = '.yotpo-review-content';
// Yotpo's own read-more: for long reviews it ships a shortened preview in the
// DOM plus this link, and keeps the full text in its Vue state (never in the
// page). Where it appears, it has to stay in charge of expanding — our clamp
// would replace the preview with an even shorter cut and could then only ever
// restore the preview, not the real review.
const NATIVE_READ_MORE_SELECTOR = '.yotpo-read-more';
// Yotpo wraps the body text in `.yotpo-read-more-text`; fall back to the
// content box itself in case that inner wrapper ever goes away.
const CONTENT_SELECTORS = [`${CONTENT_BOX_SELECTOR} .yotpo-read-more-text`, CONTENT_BOX_SELECTOR];

type ClampedElement = HTMLElement & {
  yotpoFullHtml?: string;
  yotpoShortText?: string;
  yotpoExpanded?: boolean;
  yotpoToggle?: HTMLButtonElement;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean);

// Collapse/expand a clamped review. Expanding restores the original markup
// (Yotpo may put links/line breaks in there), collapsing writes plain text so
// no partial tag can be left open. Either write wipes the element's children,
// so the toggle is re-attached at the end of the copy afterwards — that is what
// keeps it on the same line the text finishes on.
//
// The current state is tracked on the element and re-applying it is a no-op:
// every write here is itself a mutation that runs the observer again, so
// writing unconditionally would ping-pong forever.
const setExpanded = (el: ClampedElement, expanded: boolean) => {
  if (el.yotpoExpanded === expanded || el.yotpoFullHtml === undefined || el.yotpoShortText === undefined) {
    return;
  }
  if (expanded) {
    el.innerHTML = el.yotpoFullHtml;
  } else {
    el.textContent = el.yotpoShortText;
  }
  el.yotpoExpanded = expanded;
  if (el.yotpoToggle) {
    el.appendChild(el.yotpoToggle);
  }
};

const createToggle = (el: ClampedElement) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = TOGGLE_CLASS;
  button.textContent = MORE_LABEL;
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    const expanded = !el.yotpoExpanded;
    setExpanded(el, expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? LESS_LABEL : MORE_LABEL;
  });
  return button;
};

const clamp = (el: ClampedElement, limit: number) => {
  if (el.getAttribute(PROCESSED_ATTR)) {
    return;
  }

  // Leave reviews Yotpo already truncated to Yotpo's own link (the stylesheet
  // puts that link inline at the end of the copy, same as ours).
  if (el.closest(CONTENT_BOX_SELECTOR)?.querySelector(NATIVE_READ_MORE_SELECTOR)) {
    el.setAttribute(PROCESSED_ATTR, 'native');
    return;
  }

  const words = countWords(el.textContent ?? '');
  if (words.length <= limit) {
    el.setAttribute(PROCESSED_ATTR, 'false');
    return;
  }

  el.yotpoFullHtml = el.innerHTML;
  el.yotpoShortText = `${words.slice(0, limit).join(' ')}…`;
  el.textContent = el.yotpoShortText;
  el.yotpoExpanded = false;
  el.yotpoToggle = createToggle(el);
  el.appendChild(el.yotpoToggle);
  el.setAttribute(PROCESSED_ATTR, 'true');
};

const processCard = (card: Element) => {
  const titleEl = card.querySelector<ClampedElement>(TITLE_SELECTOR);
  if (titleEl) {
    clamp(titleEl, TITLE_WORD_LIMIT);
  }

  const contentEl = CONTENT_SELECTORS.reduce<ClampedElement | null>((found, selector) => found ?? card.querySelector<ClampedElement>(selector), null);
  if (contentEl) {
    clamp(contentEl, CONTENT_WORD_LIMIT);
  }
};

export default function useYotpoReviewReadMore(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    const process = () => {
      root.querySelectorAll(CARD_SELECTOR).forEach(processCard);
    };

    process();
    const observer = new MutationObserver(process);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [containerRef]);
}
