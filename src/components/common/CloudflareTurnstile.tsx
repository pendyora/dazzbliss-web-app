'use client';

/**
 * Cloudflare Turnstile — VISIBLE "managed" widget (auto-verify checkbox).
 *
 * Renders Cloudflare's managed widget inline in a form. In managed mode the
 * widget shows a small "Verifying you are human" box that ticks itself
 * automatically; an interactive challenge only appears for suspicious traffic.
 *
 * The token is handed back through `onVerify(token)` and is meant to be placed
 * into the form's submit payload as `cloudflareTurnstileToken`. The service
 * layer prefers a caller-supplied token and only falls back to the invisible
 * widget (src/utils/cloudflareTurnstile.ts) when none is provided — so a form
 * that renders this component never spins up a second hidden widget.
 *
 * Fail-open by design: if the site key is missing the component renders nothing
 * and the form still submits (the backend treats a missing token as a monitored
 * fail-open event). Parents can call `reset()` via ref to get a fresh token for
 * a retry (Turnstile tokens are single-use).
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: any;
  }
}

let scriptPromise: Promise<void> | null = null;

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

export interface CloudflareTurnstileHandle {
  /** Reset the widget to obtain a fresh, single-use token (e.g. before a retry). */
  reset: () => void;
}

interface CloudflareTurnstileProps {
  /** Called with a fresh token every time the widget verifies. */
  onVerify?: (token: string) => void;
  /** Called when the current token expires (parent should clear it). */
  onExpire?: () => void;
  /** Called when the widget errors out. */
  onError?: () => void;
  /** Optional Turnstile "action" label for analytics / server-side binding. */
  action?: string;
  /** 'light' | 'dark' | 'auto' (default 'light' — avoids the dark/black widget background). */
  theme?: 'light' | 'dark' | 'auto';
  /** 'normal' | 'flexible' | 'compact' (default 'flexible'). */
  size?: 'normal' | 'flexible' | 'compact';
  className?: string;
}

const CloudflareTurnstile = forwardRef<CloudflareTurnstileHandle, CloudflareTurnstileProps>(
  ({ onVerify, onExpire, onError, action, theme = 'light', size = 'flexible', className }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    // Keep the latest callbacks without forcing a re-render / re-mount of the widget.
    const cbRef = useRef({ onVerify, onExpire, onError });
    cbRef.current = { onVerify, onExpire, onError };

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          try {
            if (widgetIdRef.current !== null && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          } catch {
            /* fail-open: never throw from a reset */
          }
        },
      }),
      [],
    );

    useEffect(() => {
      // No site key configured — render nothing, form stays fail-open.
      if (!SITE_KEY) {
        return;
      }
      let cancelled = false;

      loadScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) {
            return;
          }
          // Avoid double-render (e.g. React strict-mode remount).
          if (widgetIdRef.current !== null) {
            return;
          }
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            appearance: 'always',
            theme,
            size,
            ...(action ? { action } : {}),
            callback: (token: string) => cbRef.current.onVerify?.(token),
            'expired-callback': () => cbRef.current.onExpire?.(),
            'timeout-callback': () => cbRef.current.onError?.(),
            'error-callback': () => {
              cbRef.current.onError?.();
              return true; // handled — do not surface Cloudflare's default error UI
            },
          });
        })
        .catch(() => {
          // Script blocked / failed — fail-open, form still submits.
          cbRef.current.onError?.();
        });

      return () => {
        cancelled = true;
        try {
          if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch {
          /* ignore cleanup errors */
        }
        widgetIdRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!SITE_KEY) {
      return null;
    }

    return <div ref={containerRef} className={className} />;
  },
);

CloudflareTurnstile.displayName = 'CloudflareTurnstile';

export default CloudflareTurnstile;
