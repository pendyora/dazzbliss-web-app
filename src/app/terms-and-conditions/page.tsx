import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Terms & Conditions${BRAND.titleSuffix}`,
  description: `The terms that apply when you use the ${BRAND.name} website and buy from us.`,
  // ogTitle:'...'
};

export default function ReturnsShipping() {
  return <Page />;
}
