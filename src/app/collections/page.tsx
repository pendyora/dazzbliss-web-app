import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Collections | Pendyora',
  description: 'Explore Pendyora collections: each one begins with a single piece, finished by hand in our atelier.',
  // ogTitle:'...'
};

export default function CollectionPage() {
  return <Page />;
}
