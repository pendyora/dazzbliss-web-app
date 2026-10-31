import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Your orders${BRAND.titleSuffix}`,
  description: `Track and view your ${BRAND.name} orders.`,
  // ogTitle:'...'
};

export default function MyPurchases() {
  return <Page />;
}
