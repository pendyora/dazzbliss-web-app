import React from 'react';

import { Metadata } from 'next';

import Page from '.';
import '../../styles/font.css';
import '../../styles/tailwind.css';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'My Profile - Manage Your Account and Details | Ashclair Jewelry',
  description:
    'Access your Ashclair Jewelry profile to manage purchases, personal details, and billing information. Use code MAJESCAFREE for free shipping on your next order.',
  // ogTitle:'...'
};

export default function MyProfileMyAccount() {
  return <Page />;
}
