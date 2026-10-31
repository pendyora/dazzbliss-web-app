import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Diamonds',
  description: 'Ashclair - Gems & Jewelry',
  // ogTitle:'...'
};

export default function DiamondPage() {
  return <Page />;
}
