import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { BRAND } from '@/config/brand';
import { decrypt } from '@/utils/enc-decy';

import Page from '.';

type Props = {
  params: Promise<{ jewelryType: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined | any }>;
};

/**
 * Builds the permanent-redirect target for a slug that no longer opens a live variation:
 * the closest live variation (301, `redirect_to_slug`) or the category listing
 * (410, `redirect_to_category`). Same request as the metadata fetch below, so Next dedupes it.
 */
async function getRetiredSlugRedirect(jewelryType: string, query: Record<string, any>, slug: string): Promise<string | null> {
  try {
    // The lightweight meta endpoint answers 301/410 exactly like /jewelry/:slug does.
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jewelry/meta/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      next: { revalidate: 10 }, // Cache for 10 ms
    });
    // 410: the product is no longer available; the body names its category listing.
    if (response.status === 410) {
      const gone: any = await response.json().catch(() => null);
      return `/${gone?.redirect_to_category || 'all'}`;
    }
    // 301: the variation moved; the body names the variation to open instead.
    if (response.status !== 301) {
      return null;
    }
    const moved: any = await response.json().catch(() => null);
    const redirectToSlug = moved?.redirect_to_slug;
    if (!redirectToSlug || redirectToSlug === slug) {
      return null;
    }

    // Carry every other parameter across (filter breadcrumb, appraisal,
    // warranty…) so the visitor lands where the original link intended.
    const nextQuery = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key === 'slug' || value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => nextQuery.append(key, String(entry)));
      } else {
        nextQuery.append(key, String(value));
      }
    });
    nextQuery.set('slug', redirectToSlug);
    return `/${jewelryType}/premade?${nextQuery.toString()}`;
  } catch (error) {
    // Fail open: a failed check must never stop the page from rendering.
    console.error('Error checking retired product slug:', error);
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const query = await searchParams;
  const { slug } = query;
  const { jewelryType } = await params;

  // Resolved before any metadata work so the redirect is decided before the
  // response starts. permanentRedirect signals by throwing, so it is called
  // here rather than inside the try below, which would swallow it.
  const redirectUrl = typeof slug === 'string' && slug ? await getRetiredSlugRedirect(jewelryType, query, slug) : null;
  if (redirectUrl) {
    permanentRedirect(redirectUrl);
  }

  if (typeof slug !== 'string' || !slug) {
    return {
      title: `${BRAND.name} - ${BRAND.tagline}`,
      description: `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`,
    };
  }

  try {
    // Same URL and options as getRetiredSlugRedirect, so Next dedupes the two into one request.
    // The full product is loaded by the client; the page head only needs these few fields.
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jewelry/meta/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      next: { revalidate: 10 }, // Cache for 10 ms
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const meta = decrypt(data.data);

      const title = meta?.meta_title ?? `${BRAND.name} - ${BRAND.tagline}`;
      const jewelryType = meta?.jewelry_type_name?.toLowerCase().replace(/\s+/g, '-');
      const description = meta?.meta_description ?? `${BRAND.name} offers fine jewelry and diamonds, including custom designs made to order.`;
      const imageUrl = meta?.image_url || undefined;
      const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${jewelryType}/premade?slug=${slug}`;
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
export default function PRODUCTPAGESPECIFICPRODUCTPage({ searchParams }: Props) {
  // console.log('sap', searchParams);
  return <Page />;
}
