import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'My Profile - Purchases | Ashclair Jewelry',
  description: 'Access your Ashclair Jewelry profile to manage purchases, personal details, and billing information.',
  // ogTitle:'...'
};

export default function MyPurchases() {
  return <Page />;
}
