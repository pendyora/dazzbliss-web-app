import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pendyora',
  description: 'How Pendyora collects, uses and protects your personal information.',
  // ogTitle:'...'
};

export default function PrivacyPolicy() {
  return <Page />;
}
