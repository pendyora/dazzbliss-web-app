import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Sign In | Pendyora',
  description: 'Sign in to your Pendyora account to see your orders, saved pieces and member previews.',
  // ogTitle:'...'
};

export default function LOGINPage() {
  return <Page />;
}
