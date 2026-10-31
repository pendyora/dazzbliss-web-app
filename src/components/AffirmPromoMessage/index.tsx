'use client';

import { useEffect, useRef, useState } from 'react';

interface AffirmPromoMessageProps {
  /** Amount in cents, USD. */
  amountInCents: number;
  pageType?: string;
  className?: string;
}

// Affirm "as low as" promo line — same message the PDP shows under the price.
export default function AffirmPromoMessage({ amountInCents, pageType = 'cart', className = '' }: AffirmPromoMessageProps) {
  const affirmMessageRef = useRef<HTMLParagraphElement | null>(null);
  // Affirm only quotes USD. Read after mount so the server and first client render agree.
  const [isUsd, setIsUsd] = useState(false);
  useEffect(() => {
    setIsUsd((localStorage.getItem('currency') || 'USD') === 'USD');
  }, []);
  const visible = isUsd && amountInCents >= 5000;

  // Affirm injects the whole promo sentence — including the "Learn more" wording — into the
  // <p> at runtime, so it cannot be changed in markup. Watch the node and swap that text for a
  // round info icon whenever the SDK renders or refreshes it.
  useEffect(() => {
    const el = affirmMessageRef.current;
    if (!el) {
      return;
    }
    const swapLearnMore = () => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        const text = node.nodeValue ?? '';
        if (/learn\s*more/i.test(text)) {
          const icon = document.createElement('span');
          icon.className = 'affirm-info-icon';
          icon.setAttribute('role', 'img');
          icon.setAttribute('aria-label', 'Learn more about Affirm');
          icon.title = 'Learn more about Affirm';
          icon.textContent = 'i';
          node.nodeValue = text.replace(/learn\s*more/i, '').replace(/\s+/g, ' ');
          node.parentNode?.insertBefore(icon, node.nextSibling);
          return;
        }
        node = walker.nextNode();
      }
    };
    swapLearnMore();
    const observer = new MutationObserver(swapLearnMore);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [amountInCents, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    // Retry refresh a few times — SDK may still be loading
    const tryRefresh = () => {
      if (typeof (window as any).affirm?.ui?.refresh === 'function') {
        (window as any).affirm.ui.refresh();
        return true;
      }
      return false;
    };
    if (!tryRefresh()) {
      const timer = setTimeout(tryRefresh, 1000);
      return () => clearTimeout(timer);
    }
  }, [amountInCents, visible]);

  useEffect(() => {
    if ((window as any).affirm?.checkout) {
      return;
    }

    const affirmPublicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
    const affirmJsUrl = process.env.NEXT_PUBLIC_AFFIRM_JS_URL;
    if (!affirmPublicKey || !affirmJsUrl) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-affirm-sdk="true"]');
    if (existingScript) {
      setTimeout(() => {
        if (typeof (window as any).affirm?.ui?.refresh === 'function') {
          (window as any).affirm.ui.refresh();
        }
      }, 500);
      return;
    }

    const _affirm_config = {
      public_api_key: affirmPublicKey,
      script: affirmJsUrl,
    };
    (function (m: any, g: any, n: any, d: any, a: any, e: any, h: any, c: any) {
      const b = m[n] || {},
        k = document.createElement(e),
        p = document.getElementsByTagName(e)[0],
        l = function (a: any, b: any, c: any) {
          return function (...args: unknown[]) {
            a[b]._.push([c, args]);
          };
        };
      b[d] = l(b, d, 'set');
      const f = b[d];
      b[n] = function (...args: unknown[]) {
        f.apply(b, args);
      };
      b[n]._ = [];
      f._ = [];
      b[n + '_' + d] = l(b, n, 'init');
      b[a] = l(b, a, 'set');
      b[h] = l(b, h, 'set');
      k.async = !0;
      k.src = c[e];
      k.dataset.affirmSdk = 'true';
      p.parentNode.insertBefore(k, p);
      delete c[e];
      f(c);
      m[n] = b;
    })(window, 0, 'affirm', 'checkout', 'ui', 'script', 'ready', _affirm_config);

    setTimeout(() => {
      if (typeof (window as any).affirm?.ui?.refresh === 'function') {
        (window as any).affirm.ui.refresh();
      }
    }, 500);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <p
      key={amountInCents}
      ref={affirmMessageRef}
      className={`affirm-as-low-as affirm-promo-message ${className}`}
      data-page-type={pageType}
      data-amount={amountInCents}
    />
  );
}
