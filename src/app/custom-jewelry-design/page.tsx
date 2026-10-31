import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
};

export default function CustomJewelryDesignPage() {
  return <Page />;
}
