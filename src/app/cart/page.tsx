import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Shopping Cart - Exclusive Jewelry Deals | ASHCLAIR',
  description:
    'Review your shopping cart at ASHCLAIR and enjoy free shipping with code MAJESCAFREE. Find the perfect jewelry for couples, education, and gifts. Secure payment and worldwide shipping available.',
  // ogTitle:'...'
};

export default function CartPage() {
  return <Page />;
}
