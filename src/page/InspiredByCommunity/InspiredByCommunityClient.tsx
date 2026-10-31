'use client';

import React, { useEffect, useState } from 'react';

import { InstagramFeed } from '@/@types/instagram';
import { apiGetInstagramFeed } from '@/services/instagramService';

import InspiredByCommunity from './index';

/**
 * Client-side twin of the homepage's `InspiredByCommunitySection`.
 *
 * The homepage is a server component, so it can await the feed and hand it
 * straight to `InspiredByCommunity`. Pages that are `'use client'` (the PDP)
 * cannot, and rendering `<InspiredByCommunity />` bare there means `feed` stays
 * null — which the section reads as "nothing live to show" and replaces with the
 * static gallery fallback. This fetches the same feed on mount so those pages
 * get the real carousel, and only falls back when the request genuinely returns
 * nothing.
 */
export default function InspiredByCommunityClient({
  borderColorClass,
  fallbackClassName,
  showTopBorder,
}: {
  borderColorClass?: string;
  /** Applied around the section only when it falls back to the static gallery. */
  fallbackClassName?: string;
  /** Forwarded to the section; leaving it out keeps the section's own default (a top divider). */
  showTopBorder?: boolean;
}) {
  const [feed, setFeed] = useState<InstagramFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFeed = async () => {
      try {
        const response = await apiGetInstagramFeed();
        if (cancelled) {
          return;
        }
        const data: any = response?.data;
        setFeed(data?.status === 200 ? (data?.data ?? null) : null);
      } catch (error) {
        // A failed request is not an error state of its own here — the section
        // reverts to the gallery it had before the feed existed.
        console.error('Error fetching instagram feed data:', error);
        if (!cancelled) {
          setFeed(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const section = <InspiredByCommunity feed={feed} loading={loading} borderColorClass={borderColorClass} showTopBorder={showTopBorder} />;

  if (fallbackClassName && !loading && !feed?.posts?.length) {
    return <div className={fallbackClassName}>{section}</div>;
  }

  return section;
}
