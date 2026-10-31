import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Collections${BRAND.titleSuffix}`,
  description: `Explore ${BRAND.name} fine jewelry collections.`,
  // ogTitle:'...'
};

export default function CollectionPage() {
  return <Page />;
}
