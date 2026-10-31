import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { BRAND } from '@/config/brand';
import { decrypt } from '@/utils/enc-decy';

import Page from '.';

type Props = {
  // params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined | any }>;
};

export async function generateMetadata({ searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const { type, state, id, did } = await searchParams;

  // Diamond and setting listing steps have no product yet — this used to request /jewelry/undefined.
  if (typeof id !== 'string' || !id) {
    return {
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
    };
  }

  try {
    // Only the page head needs product data here; the full product is loaded by the client.
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jewelry/meta/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      // cache: 'no-store',
      next: { revalidate: 10 }, // Cache for 10 ms
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const meta = decrypt(data.data);

      const title = meta?.meta_title ?? `${BRAND.name} - ${BRAND.tagline}`;
      const description = meta?.meta_description ?? `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`;
      const imageUrl = meta?.image_url || undefined;
      const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/custom-jewelry?type=${type}&state=${state}${id ? `&id=${id}` : ''}${did ? `&did=${did}` : ''}`;
      // return resData;
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: pageUrl,
          siteName: BRAND.name,
          images: [
            {
              url: imageUrl,
              // width: 1200,
              // height: 628,
              alt: title,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
        },
      };
    }
    return {
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
    };
  } catch (error) {
    console.error('Error fetching Meta data:', error);
    return {
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
    };
  }
}

export default function CUSTOMJEWELRYCHOOSEADIAMONDPage({ searchParams }: Props) {
  // console.log('custom', searchParams);
  return <Page />;
}
