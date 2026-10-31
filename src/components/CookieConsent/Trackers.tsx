'use client';

/**
 * Trackers — the ONLY place third-party analytics/marketing tags are allowed to load.
 *
 * Each tag is mounted on its category's effective tracking switch
 * (`trackingPreferences`). While `ENFORCE_COOKIE_CONSENT` is off in
 * `@/services/cookieConsent`, both switches are always on, so every tag loads for
 * every visitor regardless of the banner choice. When enforced, tags mount only on
 * the visitor's opt-in:
 *   analytics → GA4 (gtag.js), Google Tag Manager, Microsoft Clarity
 *   marketing → Google Ads conversion + remarketing (gtag.js), Meta Pixel, Klaviyo onsite
 *
 * Because every tag is conditionally rendered, nothing is fetched or executed
 * before the visitor opts in. Google Consent Mode v2 (defaulted to `denied` in
 * `app/layout.tsx`) is the belt-and-braces second layer: even once a Google tag is
 * present, it writes no cookies until the provider replays a granted `update`.
 *
 * These tags previously lived unconditionally in `app/layout.tsx`. They were moved
 * here so consent gates them; the IDs below default to exactly the values that
 * were hardcoded there, so behaviour after consent is unchanged.
 */
import React, { useEffect } from 'react';

import Script from 'next/script';

import useCookieConsent from '@/hook/useCookieConsent';
import { isKlaviyoEnabled } from '@/lib/klaviyo';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-MB1EBYGV3G';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17230998076';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '714491101467345';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'qwosyewy41';
/** Optional — no GTM container is configured today; set the env var to enable it. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const KLAVIYO_PUBLIC_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY || '';

const CLARITY_SCRIPT_ATTR = 'data-microsoft-clarity';

type ClarityWindow = Window & {
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
};

/**
 * Inject Clarity via useEffect — not next/script.
 *
 * next/script requires an `id`, and `id="clarity"` collides with Clarity's
 * `window.clarity` global (browsers expose element ids on `window`). Even with a
 * different id, conditional afterInteractive scripts are unreliable once consent
 * flips mid-session. Manual injection matches the old layout head snippet and
 * overwrites a stale non-function `window.clarity` left by a prior bad load.
 */
function MicrosoftClarity({ projectId }: { projectId: string }): null {
  useEffect(() => {
    const w = window as ClarityWindow;

    // Browsers expose id="clarity" as a live window.clarity → DOM node binding.
    // Remove every leftover node (not only <script>) so the queue can stick.
    document.querySelectorAll('#clarity, #microsoft-clarity').forEach((node) => node.remove());

    // Always ensure the stub exists — including React Strict Mode remounts where
    // the tag <script> is already in the DOM and we would otherwise return early.
    if (typeof w.clarity !== 'function') {
      // Match Clarity's official queue shape: push `arguments`, not a rest array.
      const clarity = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params
        (clarity.q = clarity.q || []).push(arguments);
      } as NonNullable<ClarityWindow['clarity']>;
      clarity.q = [];
      w.clarity = clarity;
    }

    if (document.querySelector(`script[${CLARITY_SCRIPT_ATTR}]`)) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    script.setAttribute(CLARITY_SCRIPT_ATTR, projectId);
    document.head.appendChild(script);
  }, [projectId]);

  return null;
}

export default function Trackers(): JSX.Element | null {
  const { ready, trackingPreferences } = useCookieConsent();

  // Nothing until the stored decision has been read.
  if (!ready) {
    return null;
  }

  const { analytics, marketing } = trackingPreferences;
  const needsGtag = analytics || marketing;

  return (
    <>
      {/* Google tag library — shared by GA4 and Google Ads, loaded once when either is granted. */}
      {needsGtag && (
        <>
          <Script
            id="gtag-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics ? GA4_ID : GOOGLE_ADS_ID}`}
          />
          <Script
            id="gtag-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${analytics ? `gtag('config', '${GA4_ID}');` : ''}
                ${marketing ? `gtag('config', '${GOOGLE_ADS_ID}');` : ''}
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager — analytics. Only when a container ID is configured. */}
      {analytics && GTM_ID && (
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
      )}

      {/* Microsoft Clarity — analytics. */}
      {analytics && <MicrosoftClarity projectId={CLARITY_ID} />}

      {/* Meta Pixel — marketing. The init fires its own PageView, which is why
          AppProvider only reports subsequent route changes. */}
      {marketing && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Klaviyo onsite — marketing. Powers `Viewed Product` / Browse Abandonment.
          `_learnq` is stubbed before the script so events fired by a PDP that renders
          ahead of this afterInteractive script are queued rather than dropped. */}
      {marketing && isKlaviyoEnabled() && (
        <>
          <Script id="klaviyo-queue" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: 'window._learnq = window._learnq || [];' }} />
          <Script id="klaviyo-onsite" strategy="afterInteractive" src={`https://static.klaviyo.com/onsite/js/${KLAVIYO_PUBLIC_KEY}/klaviyo.js`} />
        </>
      )}

      {/* Site-wide AMP Google Ads tag — marketing. Moved here verbatim from the
          <body> of app/layout.tsx so it is gated like every other marketing tag. */}
      {marketing && (
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <amp-analytics type="gtag" data-credentials="include">
                <script type="application/json">
                  {
                    "vars": {
                      "gtag_id": "AW-172306",
                      "config": {
                        "${GOOGLE_ADS_ID}": {
                          "groups": "default"
                        }
                      }
                    },
                    "triggers": {}
                  }
                </script>
              </amp-analytics>`,
          }}
        />
      )}
    </>
  );
}
