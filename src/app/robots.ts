import { MetadataRoute } from 'next';

// DAZZBLISS: crawling is blocked until NEXT_PUBLIC_ALLOW_INDEXING=true (set it only on the live site).
// The previous file listed both `allow: '/'` and `disallow: '/'`; Google follows the least restrictive
// rule, so the site was indexable.
const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
