'use client';
import React, { Suspense, useEffect, useRef } from 'react';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { usePathname } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { Provider } from 'react-redux';

import Breadcrumb from '@/components/Breadcrumb';
import CookieConsent from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { AppProvider } from '@/context/AppContext/AppProvider';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import useYotpo from '@/hook/useYotpo';
import { pageview as gaPageView } from '@/lib/analytics';
import store from '@/store';
import { trackPageView } from '@/utils/metaPixel';

const AppProviderData = ({ children, initialHeaderMegaData, initialPromoData }: any) => {
  const pathname = usePathname();
  // Product pages skip the Suspense wrapper below: it streams the layout first, which fixes the
  // status at 200 before page.tsx can send its permanent redirect for an unavailable variation.
  const isProductPage = /^\/[^/]+\/premade\/?$/.test(pathname ?? '');
  const isFirstMount = useRef(true);
  const lastGaPath = useRef<string | null>(null);

  useEffect(() => {
    // Both tags report the FIRST page view themselves, from their own init snippet
    // in <Trackers/>. That snippet runs whenever the tag mounts — on load for a
    // returning visitor, or the moment consent is granted for a new one — so it is
    // the only thing that can time the initial page_view correctly. This effect
    // therefore reports route CHANGES only, and skips the first mount for both.
    if (isFirstMount.current) {
      isFirstMount.current = false;
      lastGaPath.current = pathname;
      return;
    }
    trackPageView();
    // Guard against the same path reporting twice.
    if (lastGaPath.current !== pathname) {
      lastGaPath.current = pathname;
      gaPageView();
    }
  }, [pathname]);
  const primary_color = '#17381d';
  const secondary_color = '#818d64';
  const prev_secondary_color = '#c5ccb4';
  const customTheme = {
    token: {
      colorPrimary: primary_color, // Primary color (for buttons, active links, etc.)
      colorPrimaryBg: '#E8F5E9', // Background color for primary elements
      colorText: '#212121', // Default text color
      colorBgBase: '#FAFAFA', // Background color for the application
      // colorBorder: "#BDBDBD", // Border color for inputs, cards, etc.
      colorSuccess: '#388E3C', // Success message or status color
      colorWarning: '#F57C00', // Warning message or status color
      colorError: '#D32F2F', // Error message or status color
      colorLink: '#1976D2', // Link color
      colorLinkHover: '#1565C0', // Link hover color
      // tableRowHoverBg: "#E0F7FA", // Hover color for table rows
      tableSelectedRowBg: '#A7FFEB', // Background color for selected table rows
      tableRowActiveBg: '#64FFDA', // Background color for active rows
      // colorTextHeading: "#2E7D32", // Heading text color
      colorBgContainer: '#FFFFFF', // Background for containers (like cards)
      borderRadius: 8, // Default border radius for components
    },
  };

  useYotpo(process.env.NEXT_PUBLIC_YOTPO_APP_KEY as string);

  return (
    <Provider store={store}>
      <CookieConsentProvider>
        <AntdRegistry>
          <ConfigProvider
            // On a failed submit, scroll the first invalid field into view and focus it, so a
            // validation error below the fold (city, zip) isn't a silently dead submit button.
            // `center` keeps the field clear of the sticky header.
            form={{ scrollToFirstError: { behavior: 'smooth', block: 'center', focus: true } }}
            theme={{
              token: customTheme.token,
              components: {
                Button: {
                  controlHeight: 45,
                  // colorText: '#ffffff',
                  borderRadius: 0,
                  colorPrimary: secondary_color,
                  algorithm: true, // Enable algorithm
                },
                Input: {
                  controlHeight: 38,
                  colorPrimary: prev_secondary_color,
                  borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
                DatePicker: {
                  controlHeight: 38,
                  colorPrimary: prev_secondary_color,
                  borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
                Radio: {
                  controlHeight: 38,
                  // colorPrimary: '#818d64',
                  colorPrimary: secondary_color,
                  borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
                Select: {
                  controlHeight: 38,
                  colorPrimary: prev_secondary_color,
                  borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
                Slider: {
                  // controlHeight: 38,
                  // colorBgBase: '#818d64',
                  // colorBgContainer: '#818d64',
                  colorPrimary: secondary_color,
                  // colorPrimary: '#17381d',
                  borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
                Checkbox: {
                  // controlHeight: 38,
                  colorPrimary: secondary_color,
                  // borderRadius: 0,
                  algorithm: true, // Enable algorithm
                },
              },
            }}
          >
            <AppProvider>
              {/* overflow-x-clip contains any section (e.g. populated Swiper carousels)
                  that renders a few px wider than the viewport, so the page never gets a
                  horizontal scrollbar. `clip` — not `hidden` — because it does NOT create a
                  scroll container, so the mobile `sm:sticky` header keeps working. */}
              <div className="relative overflow-x-clip">
                {/* The header deliberately carries no `overflow-x-hidden`: with `overflow-y` left
                    visible the browser computes it to `auto`, which turns the header into a scroll
                    container and clips the absolutely-positioned mega-menu panel. The
                    `overflow-x-clip` wrapper above already contains page-level horizontal overflow. */}
                <Header className="bg-white sm:sticky sm:top-0" headerMetaData={initialHeaderMegaData} promoStripData={initialPromoData} />
                <Breadcrumb />
                {isProductPage ? (
                  children
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-[80vh] bg-white">
                        <div className="w-full flex justify-center items-center">
                          <LuLoader className="h-10 w-10 animate-spin text-primary" />
                        </div>
                      </div>
                    }
                  >
                    {children}
                  </Suspense>
                )}
                <Footer className="overflow-x-hidden" />
              </div>
            </AppProvider>
          </ConfigProvider>
        </AntdRegistry>
        {/* Consent-gated third-party tags, plus the banner and preferences modal. */}
        <CookieConsent />
      </CookieConsentProvider>
    </Provider>
  );
};

export default AppProviderData;
