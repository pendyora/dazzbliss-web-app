import React from 'react';

import { Metadata } from 'next';

import { decrypt } from '@/utils/enc-decy';

import Page from '.';

export const metadata: Metadata = {
  title: 'Ashclair - All Blogs',
  description: 'List of all blogs available on Ashclair',
};

// async function getAllBlogsData() {
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs`, {
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
//     console.error('Error fetching blogs data:', error);
//     return null;
//   }
// }

export default async function AllBlogsPage() {
  // const allBlogs = await getAllBlogsData();
  return <Page />;
}
