import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: `Your account${BRAND.titleSuffix}`,
  description: `Manage your ${BRAND.name} orders, wishlist, addresses and details.`,
  // ogTitle:'...'
};

export default function MyProfileMyAccount() {
  return <Page />;
}
