import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { BRAND } from '@/config/brand';
import { decrypt, encrypt } from '@/utils/enc-decy';

import Page from '.';

type Props = {
  params: Promise<{ [key: string]: string | string[] | undefined | any }>;
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { educationSlug } = await params;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/education/all/${educationSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cache: 'no-store',
      body: encrypt({ slug: educationSlug }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const resData = decrypt(data.data);

      const educationData = resData;

      const title = educationData?.meta_title ?? `${BRAND.name} - ${BRAND.tagline}`;
      const description =
        educationData?.meta_description ?? `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`;
      const imageUrl = educationData?.thumbnail_image || educationData?.banner;
      const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/education/${educationSlug}`;
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
              // height: 630,
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

export default function EducationDetailsPage() {
  return <Page />;
}
