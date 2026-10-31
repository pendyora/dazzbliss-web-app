import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Create an Account${BRAND.titleSuffix}`,
  description: `Join ${BRAND.name} for faster checkout, order tracking and a wishlist on every device.`,
  // ogTitle:'...'
};

export default function CREATEANACCOUNTPage() {
  return <Page />;
}
