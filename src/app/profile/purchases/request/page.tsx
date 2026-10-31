import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Cancel or Return Items | ${BRAND.name} Jewelry`,
  description: `Request a cancellation or return for your ${BRAND.name} Jewelry order.`,
  robots: { index: false, follow: false },
};

export default function OrderRequestPage() {
  return <Page />;
}
