/**
 * Cookie-consent domain service.
 *
 * Single source of truth for:
 *  - the shape of a stored consent decision and the cookie it lives in;
 *  - reading / writing that decision (delegating raw cookie I/O to `@/utils/cookieStorage`);
 *  - purging tracker cookies when a category is withdrawn;
 *  - the Google Consent Mode v2 bridge (`gtag('consent', 'update', ...)`).
 *
 * Deliberately framework-free and SSR-safe, so it can be imported from React
 * components, plain utilities, or anything else. The React glue lives in
 * `@/context/CookieConsentContext`.
 *
 * A module-level snapshot of the decision is cached so the high-frequency
 * `hasConsent()` guard used by the GA4 / Meta Pixel event helpers does not have to
 * re-parse `document.cookie` on every tracked event.
 */
import { deleteCookie, getAllCookieNames, getCookie, setCookie } from '@/utils/cookieStorage';

/* -------------------------------------------------------------------------- */
/*                                  constants                                 */
/* -------------------------------------------------------------------------- */

/** The single first-party cookie holding the visitor's choice. */
export const CONSENT_COOKIE_NAME = 'site_cookie_consent' as const;

/**
 * Consent policy version. Bump whenever the categories, what they control, or the
 * banner copy materially change: a stored record with a different `version` is
 * treated as absent, so the banner reappears and re-collects consent.
 */
export const CONSENT_VERSION = 1 as const;

/**
 * Whether the visitor's choice actually gates tracking.
 *
 * `false` (current behaviour, by business decision): the banner and modal still
 * collect and store a choice, but it is cosmetic — every analytics and marketing
 * tag loads, every event fires, Consent Mode is always `granted`, and "Reject All"
 * purges nothing. Flip to `true` to restore real opt-in gating; `app/layout.tsx`
 * reads this too for the Consent Mode default.
 */
export const ENFORCE_COOKIE_CONSENT = false as const;

/** How long a decision is remembered (12 months — the GDPR-conventional maximum). */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */

/** The optional categories a visitor can toggle. "necessary" is always on. */
export type OptionalCategory = 'analytics' | 'marketing';

/** The category switches. `necessary` is always `true` and cannot be turned off. */
export interface ConsentPreferences {
  /** Strictly necessary cookies. Always true — the store cannot function without them. */
  necessary: true;
  /** GA4, Google Tag Manager analytics, Microsoft Clarity. */
  analytics: boolean;
  /** Meta Pixel, Google Ads conversion tracking and remarketing. */
  marketing: boolean;
}

/** How the visitor arrived at a decision. Useful for auditing. */
export type ConsentAction = 'accept_all' | 'reject_all' | 'save_preferences';

/** The record persisted in {@link CONSENT_COOKIE_NAME}. */
export interface ConsentRecord extends ConsentPreferences {
  /** Policy version this decision was captured under. */
  version: number;
  /** ISO-8601 timestamp of the decision. */
  updatedAt: string;
  /** What the visitor did to produce this record. */
  action: ConsentAction;
}

/* -------------------------------------------------------------------------- */
/*                              preference presets                            */
/* -------------------------------------------------------------------------- */

/** Everything optional OFF — the pre-consent default and the result of "Reject All". */
export const DENY_ALL: ConsentPreferences = Object.freeze({
  necessary: true,
  analytics: false,
  marketing: false,
});

/** Everything optional ON — the result of "Accept All". */
export const ALLOW_ALL: ConsentPreferences = Object.freeze({
  necessary: true,
  analytics: true,
  marketing: true,
});

/** Narrow an arbitrary value to {@link ConsentPreferences}, coercing to strict booleans. */
export function toPreferences(value: unknown): ConsentPreferences {
  const source = (value ?? {}) as Record<string, unknown>;
  return {
    necessary: true,
    analytics: source.analytics === true,
    marketing: source.marketing === true,
  };
}

/* -------------------------------------------------------------------------- */
/*                            tracker cookie cleanup                          */
/* -------------------------------------------------------------------------- */

/**
 * Cookie-name matchers per category, used to purge trackers when consent is
 * withdrawn. Patterns cover the vendors wired up today plus the ones most likely
 * to be added later, so a future pixel does not silently survive a withdrawal.
 */
const TRACKER_COOKIE_PATTERNS: Record<OptionalCategory, readonly RegExp[]> = {
  analytics: [
    /^_ga/, // _ga, _ga_<container>
    /^_gid$/,
    /^_gat/, // _gat, _gat_gtag_<id>
    /^_clck$/, // Microsoft Clarity
    /^_clsk$/,
    /^CLID$/,
    /^_hj/, // Hotjar, if ever enabled
  ],
  marketing: [
    /^_gcl/, // Google Ads conversion linker: _gcl_au, _gcl_aw, _gcl_dc
    /^_fbp$/, // Meta Pixel
    /^_fbc$/,
    /^fr$/,
    /^IDE$/, // Google Ads remarketing
    /^test_cookie$/,
    /^__kla/, // Klaviyo
    /^_ttp$/, // TikTok
    /^_pin/, // Pinterest
  ],
};

/**
 * Delete every JS-visible tracker cookie belonging to the given categories.
 *
 * Called with the categories the visitor just turned OFF, so a partial opt-out
 * clears only the revoked vendors and leaves the still-allowed ones intact.
 */
export function purgeTrackerCookies(categories: readonly OptionalCategory[]): void {
  if (typeof document === 'undefined' || categories.length === 0) {
    return;
  }
  const patterns = categories.flatMap((category) => TRACKER_COOKIE_PATTERNS[category]);
  for (const name of getAllCookieNames()) {
    if (patterns.some((pattern) => pattern.test(name))) {
      deleteCookie(name);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              read / write record                           */
/* -------------------------------------------------------------------------- */

/**
 * Cached snapshot of the stored decision.
 *
 * `undefined` = not yet read from the cookie; `null` = read, and there is no valid
 * decision. Only this module writes the cookie, so the cache cannot go stale
 * within a tab.
 */
let cachedRecord: ConsentRecord | null | undefined;

/**
 * Read and validate the stored decision.
 *
 * Returns `null` — meaning "no decision, show the banner" — when the cookie is
 * absent, unparseable, or was written under a different {@link CONSENT_VERSION}.
 * A version mismatch is deliberately treated as absent so a policy change
 * re-prompts the visitor.
 */
export function readConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (cachedRecord !== undefined) {
    return cachedRecord;
  }

  const raw = getCookie(CONSENT_COOKIE_NAME);
  if (!raw) {
    cachedRecord = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CONSENT_VERSION) {
      cachedRecord = null;
      return null;
    }
    const action: ConsentAction =
      parsed.action === 'accept_all' || parsed.action === 'reject_all' || parsed.action === 'save_preferences' ? parsed.action : 'save_preferences';

    cachedRecord = {
      ...toPreferences(parsed),
      version: CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      action,
    };
    return cachedRecord;
  } catch {
    cachedRecord = null;
    return null;
  }
}

/** Persist a decision to the consent cookie and refresh the cached snapshot. */
export function writeConsent(record: ConsentRecord): void {
  cachedRecord = record;
  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(record), {
    maxAgeSeconds: CONSENT_MAX_AGE_SECONDS,
  });
}

/**
 * The category switches that actually drive tracking.
 *
 * While {@link ENFORCE_COOKIE_CONSENT} is off this is always {@link ALLOW_ALL},
 * whatever the visitor chose (or before they choose). Otherwise it is the stored
 * decision, falling back to {@link DENY_ALL}.
 */
export function getTrackingPreferences(record: ConsentPreferences | null = readConsent()): ConsentPreferences {
  if (!ENFORCE_COOKIE_CONSENT) {
    return ALLOW_ALL;
  }
  return record ? toPreferences(record) : DENY_ALL;
}

/**
 * Synchronous consent check for the analytics/marketing event helpers.
 *
 * Always true while {@link ENFORCE_COOKIE_CONSENT} is off. When enforced, returns
 * false until an explicit decision granting the category has been stored.
 */
export function hasConsent(category: OptionalCategory): boolean {
  return getTrackingPreferences()[category];
}

/* -------------------------------------------------------------------------- */
/*                          Google Consent Mode v2 bridge                     */
/* -------------------------------------------------------------------------- */

/** A permissive view of the gtag queue (`window.gtag` is typed narrowly in `@/lib/analytics`). */
type LooseGtag = (...args: unknown[]) => void;

interface GtagWindow {
  dataLayer?: unknown[];
  gtag?: LooseGtag;
}

/** Ensure a `gtag` queue shim exists. Idempotent; the real snippet in the layout normally wins. */
function ensureGtag(): LooseGtag | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as unknown as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== 'function') {
    w.gtag = function gtag(...args: unknown[]): void {
      w.dataLayer!.push(args);
    };
  }
  return w.gtag;
}

/**
 * Replay the visitor's choice as a Consent Mode v2 `update`.
 *
 * `gtag()` is just a `dataLayer` push, so this is safe to call before any Google
 * tag has loaded — the tag replays the queue on load. That is exactly why the
 * layout sets every signal to `denied` by default first.
 */
export function applyConsentMode(preferences: ConsentPreferences): void {
  const gtag = ensureGtag();
  if (!gtag) {
    return;
  }
  const granted = (on: boolean): 'granted' | 'denied' => (on ? 'granted' : 'denied');

  gtag('consent', 'update', {
    ad_storage: granted(preferences.marketing),
    ad_user_data: granted(preferences.marketing),
    ad_personalization: granted(preferences.marketing),
    analytics_storage: granted(preferences.analytics),
    personalization_storage: granted(preferences.analytics),
    functionality_storage: 'granted',
    security_storage: 'granted',
  });
}

/**
 * Push a `cookie_consent_update` event so Google Tag Manager triggers (and any
 * future tag configured there) can react the moment consent changes.
 */
export function pushConsentDataLayerEvent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }
  const w = window as unknown as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'cookie_consent_update',
    consent_analytics: preferences.analytics,
    consent_marketing: preferences.marketing,
  });
}

/* -------------------------------------------------------------------------- */
/*                              decision commands                             */
/* -------------------------------------------------------------------------- */

/** Build a fresh record for a decision. Pure — does not touch storage. */
function buildRecord(action: ConsentAction, preferences: ConsentPreferences): ConsentRecord {
  return {
    ...toPreferences(preferences),
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    action,
  };
}

/**
 * Commit a decision: persist it, purge the cookies of any category that just went
 * from allowed to denied, and replay the result to Consent Mode + the dataLayer.
 *
 * While {@link ENFORCE_COOKIE_CONSENT} is off, the decision is still stored (so the
 * banner stays dismissed and the modal remembers its toggles), but nothing is
 * purged and Consent Mode / the dataLayer always receive "everything granted".
 *
 * This is the single write path — the context calls nothing else.
 */
export function commitConsent(action: ConsentAction, preferences: ConsentPreferences): ConsentRecord {
  const previous = readConsent();
  const record = buildRecord(action, preferences);

  writeConsent(record);

  if (ENFORCE_COOKIE_CONSENT) {
    // Purge only what was withdrawn. On a first-ever "Reject All" there is no
    // previous record, so treat every denied category as newly withdrawn.
    const withdrawn = (['analytics', 'marketing'] as const).filter((category) => !record[category] && (previous ? previous[category] : true));
    purgeTrackerCookies(withdrawn);
  }

  const tracking = getTrackingPreferences(record);
  applyConsentMode(tracking);
  pushConsentDataLayerEvent(tracking);

  return record;
}

/** "Accept All" — grant every optional category. */
export function acceptAllConsent(): ConsentRecord {
  return commitConsent('accept_all', ALLOW_ALL);
}

/**
 * "Reject All" — records a deny-all choice. While {@link ENFORCE_COOKIE_CONSENT} is
 * off this is a dummy action: it only dismisses the banner, tracking continues.
 */
export function rejectAllConsent(): ConsentRecord {
  return commitConsent('reject_all', DENY_ALL);
}

/** "Save Preferences" — commit an explicit per-category choice from the modal. */
export function saveConsentPreferences(preferences: ConsentPreferences): ConsentRecord {
  return commitConsent('save_preferences', preferences);
}
