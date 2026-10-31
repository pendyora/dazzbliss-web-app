import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from './homepage';

export const metadata: Metadata = {
  title: `${BRAND.name} Jewelry | Lab Grown Diamond Rings & Fine Jewelry for Women`,
  description: `Shop elegant lab grown diamond rings, necklaces, earrings, and fine jewelry at ${BRAND.name}. Modern styles, everyday luxury, and timeless pieces made for women who love beautiful jewelry.`,
  // ogTitle:'...'
};

export const dynamic = 'force-dynamic';

export default async function HOMEPAGEPage() {
  return <Page />;
}
