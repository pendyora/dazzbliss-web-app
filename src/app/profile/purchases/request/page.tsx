import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Cancel or Return Items | Ashclair Jewelry',
  description: 'Request a cancellation or return for your Ashclair Jewelry order.',
  robots: { index: false, follow: false },
};

export default function OrderRequestPage() {
  return <Page />;
}
