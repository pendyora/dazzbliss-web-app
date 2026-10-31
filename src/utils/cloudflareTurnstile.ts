'use client';

/**
 * Cloudflare Turnstile — invisible / auto-execute integration.
 *
 * A single hidden widget is lazily created the first time a token is requested
 * and re-used (reset + execute) for every subsequent submission. Nothing is
 * shown to the user unless Cloudflare decides an interactive challenge is
 * required for suspicious traffic ("interaction-only" appearance).
 *
 * getCloudflareTurnstileToken() NEVER throws and NEVER blocks: on any problem (script
 * blocked, widget error, timeout, expiry) it resolves to `null`. The backend
 * treats a missing/invalid token as a monitored, fail-open event, so a broken
 * Turnstile can never take down a live form. Concurrent callers are serialized
 * because a single widget can only run one challenge at a time.
 */

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Read the site key ONLY from the environment (.env). No key is hardcoded here.
const SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '';

// Generous timeout: covers the rare case where an interactive challenge is
// shown and the user needs a moment. On timeout we resolve null (fail-open).
const TOKEN_TIMEOUT_MS = 20000;

declare global {
  interface Window {
    turnstile?: any;
  }
}

let scriptPromise: Promise<void> | null = null;
let widgetPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let container: HTMLElement | null = null;
let pendingResolve: ((token: string | null) => void) | null = null;
let queue: Promise<unknown> = Promise.resolve();

const settle = (token: string | null) => {
  const resolve = pendingResolve;
  pendingResolve = null;
  if (resolve) {
    resolve(token);
  }
};

const loadScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'));
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        return resolve();
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile script failed to load'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const ensureWidget = (): Promise<void> => {
  if (widgetId !== null) {
    return Promise.resolve();
  }
  if (widgetPromise) {
    return widgetPromise;
  }

  widgetPromise = (async () => {
    await loadScript();
    if (!window.turnstile) {
      throw new Error('turnstile unavailable');
    }

    if (!container) {
      container = document.createElement('div');
      // Keep it out of the layout but available for a challenge modal if needed.
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.left = '0';
      container.style.width = '0';
      container.style.height = '0';
      container.style.overflow = 'hidden';
      container.style.zIndex = '2147483647';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }

    widgetId = window.turnstile.render(container, {
      sitekey: SITE_KEY,
      execution: 'execute',
      appearance: 'interaction-only',
      retry: 'never',
      callback: (token: string) => settle(token),
      'error-callback': () => {
        settle(null);
        return true;
      },
      'expired-callback': () => settle(null),
      'timeout-callback': () => settle(null),
    });
  })();

  return widgetPromise;
};

const runOnce = (): Promise<string | null> =>
  new Promise<string | null>((resolve) => {
    let done = false;
    const finish = (token: string | null) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timer);
      resolve(token);
    };
    const timer = setTimeout(() => finish(null), TOKEN_TIMEOUT_MS);

    pendingResolve = finish;
    try {
      window.turnstile.reset(widgetId);
      window.turnstile.execute(widgetId, { action: 'submit' });
    } catch {
      finish(null);
    }
  });

/**
 * Get a fresh Turnstile token. Resolves to a token string, or `null` if one
 * could not be obtained for any reason. Safe to call from any form submit
 * handler — it never rejects and never blocks the user.
 */
export const getCloudflareTurnstileToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }
  // No site key configured in the env — skip silently (backend fails open).
  if (!SITE_KEY) {
    return null;
  }

  const run = async (): Promise<string | null> => {
    try {
      await ensureWidget();
      if (widgetId === null || !window.turnstile) {
        return null;
      }
      return await runOnce();
    } catch {
      return null;
    }
  };

  const result = queue.then(run, run);
  // Keep the queue alive even if this run somehow rejects (it shouldn't).
  queue = result.catch(() => null);
  return result;
};

/**
 * Resolve the Turnstile token for a request.
 *
 * When a form renders the VISIBLE managed widget (components/common/CloudflareTurnstile),
 * it already holds a token and passes it in as `supplied` — we use that directly so a
 * second, hidden widget is never created. When no token is supplied (background calls
 * such as cart-merge that have no form UI), we fall back to the invisible auto widget.
 */
export const resolveCloudflareTurnstileToken = async (supplied?: string | null): Promise<string | null> => {
  if (typeof supplied === 'string' && supplied.length > 0) {
    return supplied;
  }
  return getCloudflareTurnstileToken();
};
