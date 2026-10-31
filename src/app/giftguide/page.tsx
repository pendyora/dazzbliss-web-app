import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
  // ogTitle:'...'
};

export default function GIFTGUIDEPage() {
  return <Page />;
}
