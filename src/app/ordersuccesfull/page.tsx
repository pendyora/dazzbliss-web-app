import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Order Confirmation | Dazzbliss',
  description: 'Thank you for your order at Dazzbliss. Your purchase has been confirmed and a confirmation email is on its way.',
  // ogTitle:'...'
};

export default function ConfirmorderthankyoupagePage() {
  return <Page />;
}
