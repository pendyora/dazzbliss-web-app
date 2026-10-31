import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Your Bag | Pendyora',
  description: 'Review the pieces in your Pendyora bag. Secure payment and worldwide shipping available.',
  // ogTitle:'...'
};

export default function CartPage() {
  return <Page />;
}
