import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';
import '../../../styles/font.css';
import '../../../styles/tailwind.css';
import '../../../styles/index.css';

export const metadata: Metadata = {
  title: `Confirming Your PayPal Payment${BRAND.titleSuffix}`,
  description: 'Please wait while we confirm your PayPal payment and complete your order.',
  // A transient step in the checkout, never something a search engine should surface.
  robots: { index: false, follow: false },
};

export default function PayPalReturnRoute() {
  return <Page />;
}
