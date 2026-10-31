import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: `Your Bag${BRAND.titleSuffix}`,
  description: `Review the pieces in your ${BRAND.name} bag. Secure checkout.`,
  // ogTitle:'...'
};

export default function CartPage() {
  return <Page />;
}
