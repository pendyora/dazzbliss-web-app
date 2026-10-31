import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Privacy Policy${BRAND.titleSuffix}`,
  description: `How ${BRAND.name} collects, uses and protects your personal information.`,
  // ogTitle:'...'
};

export default function PrivacyPolicy() {
  return <Page />;
}
