import React from 'react';

import { FaInstagram } from 'react-icons/fa';
import { FaArrowRightLong } from 'react-icons/fa6';

import { InstagramFeed, InstagramPost } from '@/@types/instagram';

import CommunityGalleryFallback from './CommunityGalleryFallback';
import InstagramCarousel, { Tile } from './InstagramCarousel';

/**
 * Where the heading handle and the Follow button point. Env-driven so the
 * handle can change without a code edit; the literal is the fallback.
 */
const PROFILE_URL = process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/ashclairjewelry/';
const HANDLE = '@ashclairjewelry';

const HEADING = 'Be inspired by our community';
const FOLLOW_LABEL = 'Follow us on Instagram';
const SUBHEADING = 'Upload your photo with your new jewels on instagram and tag us at #ashclairjewelry for a chance to be featured in our gallery!';

/**
 * Ceiling on how many posts the carousel lays out, in case the backend's own
 * limit is ever raised — every tile is rendered twice to make the loop seamless.
 * Falls back to 30 if the value is unset or not a number.
 */
const MAX_POSTS = Number.parseInt(process.env.NEXT_PUBLIC_INSTAGRAM_MAX_POSTS || '', 10) || 30;

/**
 * Reels return an .mp4 in media_url and a still in thumbnail_url. The still
 * becomes the poster, so there is something on screen before the video decodes
 * — and if it never does.
 */
const postPosterUrl = (post: InstagramPost): string => (post.media_type === 'VIDEO' ? post.thumbnail_url || post.media_url : post.media_url);

const postAlt = (post: InstagramPost): string => post.caption?.trim().slice(0, 100) || 'Ashclair jewellery on Instagram';

const toTiles = (posts: InstagramPost[]): Tile[] =>
  posts.slice(0, MAX_POSTS).map((post) => ({
    src: postPosterUrl(post),
    videoUrl: post.media_type === 'VIDEO' ? post.media_url : undefined,
    alt: postAlt(post),
    caption: post.caption,
    href: post.permalink,
  }));

/** Placeholder row shown while the feed request is still in flight. */
function CarouselSkeleton() {
  return (
    <div className="flex gap-1.5 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="aspect-[5/6] w-[330px] shrink-0 animate-pulse bg-stone xl:w-[300px] lg:w-[260px] md:w-[220px] sm:w-[180px]" />
      ))}
    </div>
  );
}

export default function InspiredByCommunity({
  borderColorClass = 'border-line',
  feed = null,
  loading = false,
  showTopBorder = true,
}: {
  borderColorClass?: string;
  feed?: InstagramFeed | null;
  loading?: boolean;
  /** Off on the homepage, where the section follows the reviews carousel with no divider. */
  showTopBorder?: boolean;
}) {
  // `feed` is null when the request failed, and `posts` is empty when the feed
  // is switched off, uncredentialed, or the account has none. There is nothing
  // live to show in any of those cases, so the section reverts wholesale to the
  // gallery it had before the feed existed. `loading` is not one of them — that
  // is the brief Suspense window, which keeps its skeleton.
  const posts = feed?.posts ?? [];

  if (!loading && !posts.length) {
    return <CommunityGalleryFallback borderColorClass={borderColorClass} showTopBorder={showTopBorder} />;
  }

  const tiles = toTiles(posts);

  return (
    <section
      aria-labelledby="instagram-feed-heading"
      className={`w-full bg-paper font-libre ${showTopBorder ? `border-t border-solid ${borderColorClass}` : ''} pt-[clamp(56px,7vw,96px)]`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]">
        <div className="flex items-end justify-between gap-8 md:flex-col md:items-start md:gap-4">
          <div className="max-w-[640px]">
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt transition-colors hover:text-ink"
            >
              <FaInstagram className="text-[13px]" aria-hidden="true" />
              {HANDLE}
            </a>

            <h2
              id="instagram-feed-heading"
              className="m-0 mt-3 text-balance font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-ink"
            >
              {HEADING}
            </h2>
          </div>

          <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-ink-soft">{SUBHEADING}</p>
        </div>
      </div>

      <div className="mt-10 md:mt-8 sm:mt-6">{loading ? <CarouselSkeleton /> : <InstagramCarousel tiles={tiles} />}</div>

      <div className="mx-auto flex w-full max-w-[1440px] justify-center px-[clamp(16px,3.2vw,56px)] pb-[clamp(56px,7vw,96px)] pt-10 md:pt-8 sm:pt-6">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group/follow inline-flex h-12 items-center gap-3 border border-ink bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink sm:w-full sm:justify-center sm:gap-2.5 sm:px-5"
        >
          <FaInstagram className="text-[15px]" aria-hidden="true" />
          {FOLLOW_LABEL}
          <FaArrowRightLong className="text-[13px] transition-transform duration-300 group-hover/follow:translate-x-1" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
