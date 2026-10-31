import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Search${BRAND.titleSuffix}`,
  description: `Search ${BRAND.name} fine jewelry: rings, earrings, necklaces, bracelets and diamonds.`,
  // ogTitle:'...'
};

export default function SEARCHPage() {
  return <Page />;
}
