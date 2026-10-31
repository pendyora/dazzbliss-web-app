import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

const jewelryTypeMetadata: Record<string, { title: string; description: string }> = {
  'wedding-bands': {
    title: 'Wedding Bands for Women & Men | Lab Diamond Bands',
    description:
      'Shop elegant wedding bands for women and men with lab grown diamonds and classic gold styles. Find the perfect band to wear and love forever.',
  },
  'engagement-rings': {
    title: `Lab Grown Diamond Engagement Rings${BRAND.titleSuffix}`,
    description:
      'Explore stunning lab grown diamond engagement rings in solitaire, halo, oval, emerald, and hidden halo styles made for modern love stories.',
  },
};

export function generateMetadata({ params }: { params: { jewelryType: string } }): Metadata {
  const meta = jewelryTypeMetadata[params.jewelryType];
  if (meta) {
    return {
      title: meta.title,
      description: meta.description,
    };
  }
  return {
    title: `${BRAND.name} - ${BRAND.tagline}`,
    description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
  };
}

export default function PRODUCTPAGEPage() {
  return <Page />;
}
