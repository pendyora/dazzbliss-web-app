import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Shipping & Returns | Pendyora',
  description: 'Pendyora shipping options and costs, and how to return a piece within 30 days.',
  // ogTitle:'...'
};

export default function ReturnsShipping() {
  return <Page />;
}
