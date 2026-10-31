import React from 'react';

import { decrypt } from '@/utils/enc-decy';

import Faqs from './Faqs';

async function getFaqsData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/type/2`, {
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
      const resData = decrypt(data.data);
      return resData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}
const FAQ = async () => {
  const aboutData = await getFaqsData();
  const content = aboutData ? JSON.parse(aboutData?.content) : null;
  return (
    <div className="flex max-w-[1200px] p-5 m-auto  sm:pt-10 ">
      <Faqs content={content} />
    </div>
  );
};

export default FAQ;
