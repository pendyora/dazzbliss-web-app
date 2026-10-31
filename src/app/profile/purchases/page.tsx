import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Your orders | Pendyora',
  description: 'Track and view your Pendyora orders.',
  // ogTitle:'...'
};

export default function MyPurchases() {
  return <Page />;
}
