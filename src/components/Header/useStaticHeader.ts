'use client';
import { useEffect } from 'react';

/**
 * Opts the current page out of the sticky site header (e.g. the product listing page, which has its own
 * sticky filter bar). Sets `data-header-static` on <html>; AppProvider's header class reacts to it.
 */
export default function useStaticHeader() {
  useEffect(() => {
    document.documentElement.setAttribute('data-header-static', '');
    return () => document.documentElement.removeAttribute('data-header-static');
  }, []);
}
