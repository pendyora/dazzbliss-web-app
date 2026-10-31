import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Wishlist | Pendyora',
  description: 'The pieces you have saved at Pendyora.',
  // ogTitle:'...'
};

export default function WishlistPage() {
  return <Page />;
}
