'use client';
import React, { Suspense, useEffect, useRef } from 'react';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { Provider } from 'react-redux';

import CookieConsent from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { AppProvider } from '@/context/AppContext/AppProvider';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import useYotpo from '@/hook/useYotpo';
import { pageview as gaPageView } from '@/lib/analytics';
import store from '@/store';
import themeColors from '@/styles/theme-colors';
import { trackPageView } from '@/utils/metaPixel';

const AUTH_ROUTES = ['/login', '/createanaccount', '/forgotpassword', '/forgot-password'];

const AppProviderData = ({ children, initialHeaderMegaData, initialPromoData }: any) => {
  const pathname = usePathname();
  // Product pages skip the Suspense wrapper below: it streams the layout first, which fixes the
  // status at 200 before page.tsx can send its permanent redirect for an unavailable variation.
  const isProductPage = /^\/[^/]+\/premade\/?$/.test(pathname ?? '');
  const isFirstMount = useRef(true);
  const lastGaPath = useRef<string | null>(null);
  const isHomepage = pathname === '/';
  // Sign-in / sign-up / password screens render their own reduced header and footer (components/Auth/AuthShell).
  const isAuthPage = AUTH_ROUTES.includes(pathname ?? '');

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
  // Global antd colours follow the Atlantic palette (src/styles/theme-colors.js).
  const primary_color = themeColors.ink.DEFAULT;
  const secondary_color = themeColors.navy.DEFAULT;
  const prev_secondary_color = themeColors.line.strong;
  const customTheme = {
    token: {
      colorPrimary: primary_color,
      colorPrimaryBg: themeColors.mist,
      colorText: themeColors.ink.DEFAULT,
      colorBgBase: themeColors.paper,
      fontFamily: "'Libre Franklin', sans-serif",
      // colorBorder: "#BDBDBD", // Border color for inputs, cards, etc.
      colorSuccess: '#388E3C', // Success message or status color
      colorWarning: '#F57C00', // Warning message or status color
      colorError: themeColors.danger, // Error message or status color
      colorLink: themeColors.teal.DEFAULT, // Link color
      colorLinkHover: themeColors.navy.DEFAULT, // Link hover color
      // tableRowHoverBg: "#E0F7FA", // Hover color for table rows
      tableSelectedRowBg: '#A7FFEB', // Background color for selected table rows
      tableRowActiveBg: '#64FFDA', // Background color for active rows
      // colorTextHeading: "#2E7D32", // Heading text color
      colorBgContainer: themeColors.paper,
      borderRadius: 8, // Default border radius for components
    },
  };

  useYotpo(process.env.NEXT_PUBLIC_YOTPO_APP_KEY as string);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
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
                    scroll container, so the sticky header keeps working. */}
                <div className="relative overflow-x-clip">
                  {!isAuthPage && (
                    <Header
                      className={
                        isHomepage ? 'bg-transparent fixed top-0 left-0 right-0' : 'bg-transparent sticky top-0 [[data-header-static]_&]:!relative' // pages can opt out via useStaticHeader()
                      }
                      headerMetaData={initialHeaderMegaData}
                      promoStripData={initialPromoData}
                    />
                  )}
                  {isProductPage ? (
                    children
                  ) : (
                    <Suspense
                      fallback={
                        <div className="flex justify-center items-center h-[80vh] bg-ivory">
                          <div className="w-full flex justify-center items-center">
                            <LuLoader className="h-10 w-10 animate-spin text-primary" />
                          </div>
                        </div>
                      }
                    >
                      {children}
                    </Suspense>
                  )}
                  {!isAuthPage && <Footer className="overflow-x-hidden" />}
                </div>
              </AppProvider>
            </ConfigProvider>
          </AntdRegistry>
          {/* Consent-gated third-party tags, plus the banner and preferences modal. */}
          <CookieConsent />
        </CookieConsentProvider>
      </Provider>
    </ReactLenis>
  );
};

export default AppProviderData;
