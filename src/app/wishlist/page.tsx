import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: `Wishlist${BRAND.titleSuffix}`,
  description: `The pieces you have saved at ${BRAND.name}.`,
  // ogTitle:'...'
};

export default function WishlistPage() {
  return <Page />;
}
