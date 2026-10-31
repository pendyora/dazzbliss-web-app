import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: `Secure Checkout${BRAND.titleSuffix}`,
  description: `Complete your ${BRAND.name} order. Secure checkout.`,
  // ogTitle:'...'
};

export default function CartsigninPage() {
  return <Page />;
}
