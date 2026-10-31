import React from 'react';

import { FaInstagram } from 'react-icons/fa';
import { FaArrowRightLong } from 'react-icons/fa6';

import { InstagramFeed, InstagramPost } from '@/@types/instagram';

import CommunityGalleryFallback from './CommunityGalleryFallback';
import InstagramCarousel, { Tile } from './InstagramCarousel';
import { Text } from '../../components';

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
        <div key={index} className="aspect-[5/6] w-[330px] shrink-0 animate-pulse bg-[#efeeea] xl:w-[300px] lg:w-[260px] md:w-[220px] sm:w-[180px]" />
      ))}
    </div>
  );
}

export default function InspiredByCommunity({
  borderColorClass = 'border-[#3b3b3b]',
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
      className={`w-full ${showTopBorder ? `border-t border-solid ${borderColorClass}` : ''} pt-10 md:pt-8 sm:pt-6`}
    >
      <div className="container-xs 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] uppercase tracking-[3px] text-[#818d64] transition-opacity hover:opacity-70 sm:text-[11px]"
          >
            <FaInstagram className="text-[16px]" aria-hidden="true" />
            {HANDLE}
          </a>

          <Text
            as="h2"
            id="instagram-feed-heading"
            size="text9xl"
            className="mt-4 uppercase leading-[1.15] tracking-[2.2px] sm:mt-3 sm:tracking-[1.5px]"
          >
            {HEADING}
          </Text>

          <Text as="p" size="textlg" className="mt-4 !font-light leading-7 text-[#4a4a4a] sm:mt-3 sm:leading-6">
            {SUBHEADING}
          </Text>
        </div>
      </div>

      <div className="mt-7 md:mt-6 sm:mt-5">{loading ? <CarouselSkeleton /> : <InstagramCarousel tiles={tiles} />}</div>

      <div className="mt-7 flex justify-center pb-10 md:mt-6 md:pb-8 sm:mt-5 sm:pb-6">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group/follow flex items-center gap-3 rounded-md bg-primary px-8 py-4 text-[13px] uppercase tracking-[2px] text-white transition-colors duration-300 hover:bg-[#0f2614] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-[11px]"
        >
          <FaInstagram className="text-[17px] sm:text-[15px]" aria-hidden="true" />
          {FOLLOW_LABEL}
          <FaArrowRightLong
            className="text-[14px] transition-transform duration-300 group-hover/follow:translate-x-1 sm:text-[12px]"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
}
