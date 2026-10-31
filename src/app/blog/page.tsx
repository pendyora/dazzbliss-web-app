import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'The Journal | Pendyora',
  description: 'Guides to diamonds and metals, how Pendyora pieces are made, and stories from the people who wear them.',
};

export default function BLOGPage() {
  return <Page />;
}
