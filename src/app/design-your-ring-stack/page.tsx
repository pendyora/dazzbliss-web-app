import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,

  // ogTitle:'...'
};

export default function DesignYourRingStackPage() {
  return <Page />;
}
