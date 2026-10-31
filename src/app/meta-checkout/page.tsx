import React, { Suspense } from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import MetaCheckoutClient from './MetaCheckoutClient';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: `Checkout - ${BRAND.name} Jewelry Store`,
  description: `Complete your ${BRAND.name} jewelry purchase.`,
  robots: { index: false, follow: false },
};

export default function MetaCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <MetaCheckoutClient />
    </Suspense>
  );
}
