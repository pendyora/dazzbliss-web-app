'use client';

import React, { useEffect } from 'react';

import { YotpoReviewsRefresh } from '@/hook/useYotpo';
import { useAppSelector } from '@/store';

import PDPPage from './PDPPage';

export default function ProductPageSpecificProductPage({ selectionRoute }: { selectionRoute?: any }) {
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

  // Reviews, suggestions and details are sections of PDPPage, so its sticky section bar spans them all.
  return (
    <div className="w-full bg-paper">
      <PDPPage selectionRoute={selectionRoute} />
    </div>
  );
}
