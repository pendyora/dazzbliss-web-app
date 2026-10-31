'use client';

import React, { useEffect, useState } from 'react';

import Faqs from '@/app/faqs/Faqs';
import OurCollabrations from '@/app/homepage/OurCollabrations';
import WhyAllorya from '@/components/WhyAllorya';
import { YotpoReviewsRefresh } from '@/hook/useYotpo';
import { YouMayAlsoLike } from '@/page';
import InspiredByCommunityClient from '@/page/InspiredByCommunity/InspiredByCommunityClient';
import { apiGetCmsContent } from '@/services/masterService';
import { useAppSelector } from '@/store';

import Faqwithvideo from './Components/Faqwithvideo';
import PDPPage from './PDPPage';
import YotpoReiew from './yotpoReiew';

export default function ProductPageSpecificProductPage({ selectionRoute }: { selectionRoute?: any }) {
  const [faqs, setFaqs] = useState<any[]>([]);
  // The Yotpo widget's product-id is keyed off the selected product's `code`.
  const productCode = useAppSelector((state) => state.products?.selectedProduct?.product_details?.code);
  // useEffect(() => {
  //   const disableInspect = (event: any) => {
  //     if (
  //       (event.ctrlKey && event.shiftKey && event.keyCode === 73) || // Ctrl+Shift+I (Windows/Linux)
  //       (event.metaKey && event.altKey && event.keyCode === 73) || // ⌘+Option+I (macOS)
  //       (event.ctrlKey && event.shiftKey && event.keyCode === 74) || // Ctrl+Shift+J (Windows/Linux)
  //       (event.metaKey && event.altKey && event.keyCode === 74) || // ⌘+Option+J (macOS)
  //       (event.ctrlKey && event.keyCode === 85) || // Ctrl+U (Windows/Linux)
  //       (event.metaKey && event.keyCode === 85) || // ⌘+U (macOS)
  //       (event.ctrlKey && event.shiftKey && event.keyCode === 67) || // Ctrl+Shift+C (Windows/Linux)
  //       (event.metaKey && event.altKey && event.keyCode === 67) || // ⌘+Option+C (macOS)
  //       (event.metaKey && event.ctrlKey && event.shiftKey && event.keyCode === 67) || // ⌘+Ctrl+Shift+C (macOS)
  //       event.keyCode === 123 // F12 (Windows/Linux)
  //     ) {
  //       event.preventDefault();
  //       return false;
  //     }
  //   };
  //   const detectDevTools = () => {
  //     const before = new Date().getTime();
  //     // eslint-disable-next-line no-debugger
  //     debugger; // This forces DevTools to slow down
  //     const after = new Date().getTime();

  //     if (after - before > 100) {
  //       // If DevTools slows execution
  //       alert('DevTools is disabled on this site!');
  //       window.location.href = '/'; // Redirect to blank page
  //     }
  //   };
  //   // Auto-check DevTools every 500ms
  //   setInterval(() => {
  //     detectDevTools();
  //   }, 500);

  //   // Disable Right-Click
  //   document.addEventListener('contextmenu', (e) => e.preventDefault());
  //   document.addEventListener('keydown', disableInspect);

  //   // Transparent Overlay (Stops Element Inspection)
  //   const overlay = document.createElement('div');
  //   overlay.style.position = 'fixed';
  //   overlay.style.top = '0';
  //   overlay.style.left = '0';
  //   overlay.style.width = '100vw';
  //   overlay.style.height = '100vh';
  //   overlay.style.zIndex = '999999';
  //   overlay.style.background = '#fff';
  //   overlay.style.pointerEvents = 'none'; // Blocks mouse events
  //   // document.body.appendChild(overlay);
  //   return () => {
  //     document.removeEventListener('contextmenu', (e) => e.preventDefault());
  //     document.removeEventListener('keydown', disableInspect);
  //   };
  // }, []);

  // Re-run on every product change, not just the first mount. When navigating
  // between products the PDP route stays the same and only the query param
  // changes, so this component is never unmounted — a mount-only ([]) effect
  // would never fire again, leaving the Yotpo widget stuck on the first product
  // (no ratings API call, blank reviews). Keying on the product `code` re-scans
  // the Yotpo widgets whenever the shown product actually changes.
  useEffect(() => {
    if (!productCode) {
      return;
    }
    YotpoReviewsRefresh();
  }, [productCode]);

  useEffect(() => {
    let isMounted = true;
    const loadFaqs = async () => {
      try {
        // CMS type 2 = FAQs (same source as the /faqs page).
        const response: any = await apiGetCmsContent(2);
        const cms = response?.data?.data;
        const parsed = cms?.content ? JSON.parse(cms.content) : [];
        if (isMounted && Array.isArray(parsed)) {
          setFaqs(parsed.filter((item: any) => item?.question));
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };
    loadFaqs();
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="w-full bg-[#ffffff]">
      <div className=" flex flex-col  items-center  lg:mt-[10px] md:mt-0 lg:gap-[60px] md:gap-[58px] sm:gap-0 sm:mt-0">
        <PDPPage selectionRoute={selectionRoute} />
        <div className="flex flex-col mt-0 gap-[55px] self-stretch lg:gap-[76px] md:gap-[57px] sm:gap-3">
          <YotpoReiew />

          <YouMayAlsoLike />

          {/* <OurCollabrations /> */}

          {/* The live feed ends with its own bottom padding; the static gallery it falls back to
              has none, so it gets the same padding here before the FAQ band. */}
          <InspiredByCommunityClient borderColorClass="border-[#E5E9DB]" fallbackClassName="pb-10 md:pb-8 sm:pb-0" showTopBorder={false} />

          {/* The Instagram section above already ends with its own bottom padding, so the parent
              stack gap is cancelled on desktop/tablet to avoid a tall white band before the FAQs. */}
          <div className="-mt-[55px] lg:-mt-[76px] md:-mt-[57px] sm:mt-0">
            <Faqwithvideo />
          </div>

          {/* {faqs.length > 0 && (
            <div className="-mb-[60px] md:-mb-[45px] sm:mb-0">
              <Faqs content={faqs} variant="pdp" />
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
