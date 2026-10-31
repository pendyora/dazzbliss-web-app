import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: 'Jewelry Care Tips for Diamond Rings & Fine Jewelry',
  description: `Keep your diamond rings and fine jewelry sparkling with simple jewelry care, cleaning, storage, and maintenance tips from ${BRAND.name}.`,
  // ogTitle:'...'
};

export default function JewelryCareGuidePage() {
  return <Page />;
}
