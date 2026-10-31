import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Forgot Password${BRAND.titleSuffix}`,
  description: `Reset the password for your ${BRAND.name} account.`,
  // ogTitle:'...'
};

export default function LOGINPage() {
  return <Page />;
}
