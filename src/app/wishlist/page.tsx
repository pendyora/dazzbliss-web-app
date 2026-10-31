import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Wishlist Jewelry Collection - ASHCLAIR',
  description:
    'Explore our curated Wishlist Jewelry Collection. Find the perfect rings, earrings, bracelets, and necklaces for your loved ones. Enjoy free shipping with code MAJESCAFREE.',
  // ogTitle:'...'
};

export default function WishlistPage() {
  return <Page />;
}
