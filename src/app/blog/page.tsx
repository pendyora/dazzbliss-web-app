import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `The Journal${BRAND.titleSuffix}`,
  description: `Guides to diamonds and metals, how ${BRAND.name} pieces are made, and stories from the people who wear them.`,
};

export default function BLOGPage() {
  return <Page />;
}
