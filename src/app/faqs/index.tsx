import React from 'react';

import CareLayout from '@/components/ClientCare/CareLayout';
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
    <CareLayout
      title="Frequently asked questions"
      crumb="FAQs"
      intro="Quick answers about orders, sizing, diamonds and care. Can't find what you need? Our team is a message away."
    >
      <Faqs content={content} />
    </CareLayout>
  );
};

export default FAQ;
