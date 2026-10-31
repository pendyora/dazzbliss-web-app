import React, { Suspense } from 'react';

import { Metadata } from 'next';

import MetaCheckoutClient from './MetaCheckoutClient';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Checkout - Ashclair Jewelry Store',
  description: 'Complete your Ashclair jewelry purchase.',
  robots: { index: false, follow: false },
};

export default function MetaCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <MetaCheckoutClient />
    </Suspense>
  );
}
