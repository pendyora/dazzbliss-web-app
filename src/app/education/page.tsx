import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';
import { decrypt } from '@/utils/enc-decy';

import Page from '.';

export const metadata: Metadata = {
  title: 'Diamond Education Guide | Lab Grown Diamond Learning Center',
  description: `Learn about lab grown diamonds, diamond shapes, ring settings, clarity, cut, and jewelry buying tips with ${BRAND.name}’s easy diamond education guide.`,
  // ogTitle:'...'
};

async function getEducationData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banner/5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },

      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const resData = decrypt(data.data);
      return resData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

export default async function EducationPage() {
  const BannerData = await getEducationData();
  return <Page BannerData={BannerData} />;
}
