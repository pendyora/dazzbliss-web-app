import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `About ${BRAND.name} | Modern Lab Grown Diamond Jewelry Brand`,
  description: `Learn more about ${BRAND.name} and our passion for beautiful lab grown diamond jewelry, quality craftsmanship, timeless designs, and everyday luxury.`,
  // ogTitle:'...'
};

export default function ABOUTSECTIONPage() {
  return <Page />;
}
