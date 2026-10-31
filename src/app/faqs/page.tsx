import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'FAQs | Pendyora',
  description: 'Answers to common questions about Pendyora orders, sizing, diamonds, returns and care.',
  // ogTitle:'...'
};

export default function DiamondPage() {
  return <Page />;
}
