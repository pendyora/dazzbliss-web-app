import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'All stories | The Journal | Pendyora',
  description: 'Every story from the Pendyora Journal: diamond guides, engagement advice, care and style.',
};

export default function AllBlogsPage() {
  return <Page />;
}
