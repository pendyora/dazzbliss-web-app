import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Secure Checkout | Pendyora',
  description: 'Complete your Pendyora order. Secure payment and worldwide shipping available.',
  // ogTitle:'...'
};

export default function CartsigninPage() {
  return <Page />;
}
