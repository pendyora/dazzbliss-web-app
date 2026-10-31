import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Sign In${BRAND.titleSuffix}`,
  description: `Sign in to your ${BRAND.name} account to see your orders and saved pieces.`,
  // ogTitle:'...'
};

export default function LOGINPage() {
  return <Page />;
}
