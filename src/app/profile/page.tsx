import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Your account | Pendyora',
  description: 'Manage your Pendyora orders, wishlist, addresses and details.',
  // ogTitle:'...'
};

export default function MyProfileMyAccount() {
  return <Page />;
}
