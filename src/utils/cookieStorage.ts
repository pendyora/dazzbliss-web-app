/**
 * Low-level, SSR-safe browser cookie primitives.
 *
 * This module knows nothing about consent — it only reads, writes and expires
 * cookies. The consent domain logic lives in `@/services/cookieConsent`.
 *
 * Every function no-ops (or returns a neutral value) when `document` is
 * unavailable, so these helpers are safe to import from anywhere, including
 * modules that run during a server render.
 */

/** True only in a browser with a usable cookie jar. */
const hasDocument = (): boolean => typeof document !== 'undefined';

/** Escape a string so it can be safely interpolated into a RegExp source. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Read a cookie value, URL-decoded. Returns null when absent or unreadable. */
export function getCookie(name: string): string | null {
  if (!hasDocument()) {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Options accepted by {@link setCookie}. */
export interface SetCookieOptions {
  /** Lifetime in seconds. Omit for a session cookie. */
  maxAgeSeconds?: number;
  /** Defaults to `/` so the cookie is visible site-wide. */
  path?: string;
  /** Defaults to `Lax` — correct for a first-party consent record. */
  sameSite?: 'Lax' | 'Strict' | 'None';
}

/**
 * Write a first-party cookie.
 *
 * `Secure` is added automatically on HTTPS. It is intentionally omitted on plain
 * `http://` so local development over http still works (browsers reject `Secure`
 * cookies on insecure origins other than localhost).
 */
export function setCookie(name: string, value: string, options: SetCookieOptions = {}): void {
  if (!hasDocument()) {
    return;
  }
  const { maxAgeSeconds, path = '/', sameSite = 'Lax' } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (typeof maxAgeSeconds === 'number') {
    cookie += `; Max-Age=${Math.floor(maxAgeSeconds)}`;
  }
  if (typeof location !== 'undefined' && location.protocol === 'https:') {
    cookie += '; Secure';
  }
  document.cookie = cookie;
}

/**
 * Build the `Domain` values to target when expiring a cookie.
 *
 * A third-party tag may have written its cookie host-only (no `Domain`) or on any
 * parent domain, and JavaScript cannot read back which — so we expire across all
 * plausible variants. For `www.shop.example.com` this yields `''` (host-only),
 * the exact host, and every parent domain with and without a leading dot.
 */
function domainVariants(hostname: string): string[] {
  const variants = new Set<string>(['', hostname]);
  const labels = hostname.split('.');
  for (let i = 0; i < labels.length - 1; i += 1) {
    const domain = labels.slice(i).join('.');
    variants.add(domain);
    variants.add(`.${domain}`);
  }
  return Array.from(variants);
}

/**
 * Expire a cookie across every plausible Domain/Path combination.
 *
 * Only JS-visible, non-`HttpOnly` cookies can be removed this way — which covers
 * every analytics/marketing cookie we need to purge on consent withdrawal.
 */
export function deleteCookie(name: string): void {
  if (!hasDocument()) {
    return;
  }
  const hostname = typeof location !== 'undefined' ? location.hostname : '';
  const pathname = typeof location !== 'undefined' ? location.pathname : '/';
  const paths = Array.from(new Set<string>(['/', pathname]));
  const expiry = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';

  for (const domain of domainVariants(hostname)) {
    for (const path of paths) {
      let cookie = `${name}=; ${expiry}; Path=${path}; SameSite=Lax`;
      if (domain) {
        cookie += `; Domain=${domain}`;
      }
      document.cookie = cookie;
    }
  }
}

/** Every cookie name currently readable from JavaScript. */
export function getAllCookieNames(): string[] {
  if (!hasDocument()) {
    return [];
  }
  return document.cookie
    .split(';')
    .map((pair) => pair.split('=')[0].trim())
    .filter(Boolean);
}
