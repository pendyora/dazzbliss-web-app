import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Sign In to Your Cart - Ashclair Jewelry Store',
  description:
    'Access your cart to continue with your Ashclair jewelry purchase. Use code MAJESCAFREE for free shipping. Secure payment, worldwide shipping, and a selection of rings, diamonds, and couple collections await.',
  // ogTitle:'...'
};

export default function CartsigninPage() {
  return <Page />;
}
