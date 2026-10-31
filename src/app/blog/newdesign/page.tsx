import React from 'react';

import { Metadata } from 'next';

// import { decrypt } from '@/utils/enc-decy';

import Page from '.';

export const metadata: Metadata = {
  title: 'Ashclair - Blog List',
  description:
    'Ashclair offers handcrafted fine jewelry and premium gemstones—custom-designed with expert craftsmanship, direct from a family-run diamond house.',
  // ogTitle:'...'
};
// async function getBlogData() {
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banner/4`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Cache-Control': 'no-store',
//       },

//       next: { revalidate: 10 },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data: any = await response.json();
//     if (data.status === 200) {
//       const resData = decrypt(data.data);
//       return resData;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error fetching banner data:', error);
//     return null;
//   }
// }

export default async function BlogPage() {
  // const BlogBanner = await getBlogData();

  return <Page />;
}
