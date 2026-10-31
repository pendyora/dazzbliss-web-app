import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: 'Diamonds',
  description: `${BRAND.name} - ${BRAND.tagline}`,
  // ogTitle:'...'
};

export default function DiamondPage() {
  return <Page />;
}
