import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `All stories | The Journal${BRAND.titleSuffix}`,
  description: `Every story from the ${BRAND.name} Journal: diamond guides, engagement advice, care and style.`,
};

export default function AllBlogsPage() {
  return <Page />;
}
