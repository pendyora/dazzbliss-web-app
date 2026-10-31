import React, { ReactNode } from 'react';
import 'react-quill/dist/quill.snow.css';
import '@/styles/tailwind.css';
import '../styles/index.css';
import '../styles/font.css';
import '../styles/antd.css';

import ScrollArrow from '@/components/ScrollArrow';
import { ENFORCE_COOKIE_CONSENT } from '@/services/cookieConsent';
import { decrypt } from '@/utils/enc-decy';

import AppProviderData from './AppProvider';

import type { Metadata } from 'next';

// DAZZBLISS: search engines stay out until NEXT_PUBLIC_ALLOW_INDEXING=true (set it only on the live site).
// Pages inherit this; robots.ts blocks crawling with the same switch.
const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

export const metadata: Metadata = {
  robots: ALLOW_INDEXING ? undefined : { index: false, follow: false, googleBot: { index: false, follow: false } },
};

async function getHeaderData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mega-menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.status === 200) {
      return decrypt(data.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

async function getPromoData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promotional-strips`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const resData = decrypt(data.data);
      return resData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

async function RootLayout({ children }: { children: ReactNode }) {
  // Independent requests, and each helper already returns null on failure, so load them together.
  const [initialHeaderMegaData, initialPromoData] = await Promise.all([getHeaderData(), getPromoData()]);
  const optionalConsentDefault = ENFORCE_COOKIE_CONSENT ? 'denied' : 'granted';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Castoro&display=swap" rel="stylesheet" />
        {/* Google Consent Mode v2 — DEFAULT.
            This is a plain inline script so it is guaranteed to execute before any
            Google tag, which is what makes the default binding. While
            ENFORCE_COOKIE_CONSENT is off every storage type starts 'granted', so
            tracking runs regardless of the banner choice. When enforced, every
            optional type starts 'denied' (only functionality and security are
            granted) and the provider replays a 'consent' 'update' on opt-in. */}
        {/* DAZZBLISS: disabled — old client's ID, enable with Dazzbliss's own.
            The previous version moved Microsoft Clarity, Google Ads (gtag AW-…), Meta Pixel and the AMP
            <amp-analytics> tag into `@/components/CookieConsent/Trackers`, gated on cookie consent. */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: '${optionalConsentDefault}',
                ad_user_data: '${optionalConsentDefault}',
                ad_personalization: '${optionalConsentDefault}',
                analytics_storage: '${optionalConsentDefault}',
                personalization_storage: '${optionalConsentDefault}',
                functionality_storage: 'granted',
                security_storage: 'granted',
                wait_for_update: 500
              });`,
          }}
        ></script>

        {/* AMP Analytics runtime — disabled (DAZZBLISS: disabled — old client's ID, enable with Dazzbliss's own)
        <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
        */}
      </head>

      <body>
        <AppProviderData initialHeaderMegaData={initialHeaderMegaData} initialPromoData={initialPromoData}>
          {children}
        </AppProviderData>
        <ScrollArrow />

        {/* The site-wide <amp-analytics> Google Ads tag that used to sit here is a
            marketing tag, so it moved into `@/components/CookieConsent/Trackers`
            where it renders only with marketing consent. The AMP runtime loader
            above is disabled for Dazzbliss along with it. */}

        {/* OnWebChat — disabled
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var onWebChat={ar:[], set: function(a,b){if (typeof onWebChat_==='undefined'){this.ar.
              push([a,b]);}else{onWebChat_.set(a,b);}},get:function(a){return(onWebChat_.get(a));},
              w:(function(){ var ga=document.createElement('script'); ga.type = 'text/javascript';
              ga.async=1;ga.src=('https:'==document.location.protocol?'https:':'http:') +
              '//www.onwebchat.com/clientchat/f5879e3080f533c29068efd87f699142';var s=
              document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);})()}
              `,
          }}
        ></script>
        */}
      </body>
    </html>
  );
}
export default RootLayout;
