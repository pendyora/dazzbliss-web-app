import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Contact Us${BRAND.titleSuffix}`,
  description: `Talk to a ${BRAND.name} jeweler about sizing, stones, an order or a custom design.`,
  // ogTitle:'...'
};

export default function CONTACTPAGEPage() {
  return <Page />;
}
