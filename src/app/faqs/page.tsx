import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `FAQs${BRAND.titleSuffix}`,
  description: `Answers to common questions about ${BRAND.name} orders, sizing, diamonds, returns and care.`,
  // ogTitle:'...'
};

export default function DiamondPage() {
  return <Page />;
}
