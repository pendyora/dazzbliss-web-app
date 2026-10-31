import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Shipping & Returns${BRAND.titleSuffix}`,
  description: `${BRAND.name} shipping options and costs, and how to return a piece within 30 days.`,
  // ogTitle:'...'
};

export default function ReturnsShipping() {
  return <Page />;
}
