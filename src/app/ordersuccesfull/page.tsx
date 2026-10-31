import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Order Confirmation - Thank You for Your Purchase at Ashclair Jewelry',
  description:
    'Thank you for your order at Ashclair! Your purchase of exquisite jewelry, including diamond rings and gold pieces, has been confirmed. Enjoy free shipping with code MAJESCAFREE. Expect your order to arrive between Wed, 18 Sep - Fri, 20 Sep.',
  // ogTitle:'...'
};

export default function ConfirmorderthankyoupagePage() {
  return <Page />;
}
