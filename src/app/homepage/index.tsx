import React, { Suspense } from 'react';

import InspiredByCommunity from '@/page/InspiredByCommunity';
import { decrypt } from '@/utils/enc-decy';

import Craftsmanship from './Craftsmanship';
import Drops from './Drops';
import HomepageBanner from './HomepageBanner';
import HomepageHighlights from './HomepageHighlights';
import Motion from './Motion';
import OurBestSellers from './OurBestSellers';
import OurCollabrations from './OurCollabrations';
import RingBuilder from './RingBuilder';
import ShopByCategory from './ShopByCategory';
import ShopByLook from './ShopByLook';
import Testimonials from './Testimonials';

async function getBannerData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banner/1`, {
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
      const banner = decrypt(data.data);
      return banner;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}
async function getCategoryBannerData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banner/2`, {
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
      const banner = decrypt(data.data);

      return banner.banner_image;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

async function getHomepageHighlightsData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/homepage-highlights/section`, {
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
      return decrypt(data.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching homepage highlights data:', error);
    return null;
  }
}

/**
 * How long Next caches the feed response, in seconds. Env-driven so it can be
 * tuned per environment; the backend caches for 30 min behind this, so keep
 * this value SHORTER than that or content lags unpredictably.
 */
const INSTAGRAM_REVALIDATE_SECONDS = Number.parseInt(process.env.NEXT_PUBLIC_INSTAGRAM_REVALIDATE_SECONDS || '', 10) || 600;

async function getInstagramFeedData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instagram/feed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Next's own data cache, in front of the backend's 30 min in-memory cache.
      next: { revalidate: INSTAGRAM_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      return decrypt(data.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching instagram feed data:', error);
    return null;
  }
}

/**
 * Streamed separately so a slow Instagram response never delays the rest of the
 * homepage — Suspense shows the skeleton row until this resolves.
 */
async function InspiredByCommunitySection() {
  const feed = await getInstagramFeedData();
  // The live feed ends with its own bottom padding; the static gallery it falls
  // back to when there are no posts has none, so match it before Ashclair Story.
  const hasPosts = Boolean(feed?.posts?.length);

  return (
    <div className={hasPosts ? undefined : 'pb-10 md:pb-8 sm:pb-0'}>
      <InspiredByCommunity feed={feed} showTopBorder={false} />
    </div>
  );
}

export default async function HOMEPAGEPage() {
  // Independent requests, and each helper already returns null on failure, so load them together.
  const [initialBannerData, initialCategoryBannerData, initialHomepageHighlightsData] = await Promise.all([
    getBannerData(),
    getCategoryBannerData(),
    getHomepageHighlightsData(),
  ]);
  // const masterData = await getMasterData();
  return (
    <div className="w-full bg-[#ffffff] sm:relative">
      <div>
        {/* <MobileReviewsBadgeStrip /> */}
        <HomepageBanner bannerData={initialBannerData} />
        {/* <div className="mt-16 sm:mt-10" /> */}
        <Motion />
        <ShopByCategory bannerData={initialCategoryBannerData} />
        {/* CMS-driven (/homepage-highlights/section); renders nothing until the section is enabled with cards. */}
        <HomepageHighlights data={initialHomepageHighlightsData} />
        <OurBestSellers />
        <Craftsmanship />
        <ShopByLook />
        {/* <CustomizedForYou /> */}
        {/* <ShopGemStone /> */}
        <OurCollabrations />

        <RingBuilder />
        {/* <AlloryaStory /> */}

        <Drops />
        {/* <GiftguideFrame67 /> */}
        {/* <YotpoReviewsCarousel /> — live Yotpo reviews; Testimonials below is the design's static set. */}
        <Testimonials />
        {/* Live Instagram feed (/instagram/feed), streamed so a slow response never delays the page. */}
        <Suspense fallback={<InspiredByCommunity loading showTopBorder={false} />}>
          <InspiredByCommunitySection />
        </Suspense>
        {/* <WhyAllorya /> */}
        {/* <FeaturedIn /> */}
      </div>
    </div>
  );
}
