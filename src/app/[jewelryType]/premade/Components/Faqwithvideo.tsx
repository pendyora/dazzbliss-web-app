'use client';
import React, { useState } from 'react';

import { Text } from '@/components';

// import Link from 'next/link';

// Detailed FAQ Dataset based on client specifications
const FAQ_DATA = [
  {
    id: 1,
    question: 'Are your lab-grown diamonds real?',
    answer:
      'Yes. Our lab-grown diamonds are 100% real diamonds with the same physical, chemical, and optical properties as mined diamonds. They offer the same brilliance, durability, and sparkle while being a more ethical and sustainable choice.',
  },
  {
    id: 2,
    question: 'Are your diamonds certified?',
    answer:
      "Absolutely. Every center diamond (where applicable) is certified by a leading independent gemological laboratory such as IGI or GIA. Each certificate verifies the diamond's cut, color, clarity, and carat weight, ensuring complete authenticity and transparency.",
  },
  {
    id: 3,
    question: 'Can I customize my engagement ring?',
    answer:
      'Yes. You can customize your engagement ring by choosing your preferred diamond shape, carat weight, precious metal (10K, 14K or 18K), metal color (Yellow Gold, White Gold, Rose Gold, or Platinum), and ring size. We also offer bespoke designs to bring your unique vision to life.',
  },
  {
    id: 4,
    question: 'How long does it take to receive my order?',
    answer:
      'Every engagement ring is handcrafted with exceptional attention to detail. Production typically takes 7–14 business days, followed by secure, insured shipping. For in-stock items, orders are processed and delivered within 2 business days. Delivery times may vary depending on your location, and tracking information will be shared once your order is dispatched.',
  },
  {
    id: 5,
    question: 'What is your return and exchange policy?',
    answer:
      'We want you to shop with confidence. Eligible jewelry can be returned or exchanged within our return window of 30 days if it is unworn, undamaged, and in its original packaging with tag attached. Please note that customized or personalized pieces are generally non-returnable.',
  },
  {
    id: 6,
    question: 'Do your engagement rings come with a warranty?',
    answer:
      "Yes. Every engagement ring is backed by our craftsmanship warranty, covering manufacturing defects. We also recommend regular cleaning and inspections to help maintain your ring's beauty and ensure it lasts a lifetime.",
  },
];

// Vertical Reels Dataset - the "Our Best Sellers in Action" strip is hidden for now; uncomment
// this, the Link import and the reels section below to bring it back.
// const REELS_DATA = [
//   {
//     id: 1,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.52.00+PM.mp4',
//     productUrl:
//       'https://ashclair.com/engagement-rings/premade?slug=sunlit-crown-solitaire-engagement-ring-in-oval-round-lab-grown-diamond-oval-white-gold-14k-025-lab-white-diamond-r2088',
//     productName: 'Sunlit Crown Solitaire Engagement Ring',
//   },
//   {
//     id: 2,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.52.48+PM.mp4',
//     productUrl:
//       'https://ashclair.com/engagement-rings/premade?slug=eclipse-spark-solitaire-engagement-ring-in-125-cttw-princess-round-lab-grown-diamond-princess-white-gold-14k-1-lab-white-diamond-r2138',
//     productName: 'Eclipse Spark Solitaire Engagement Ring',
//   },
//   {
//     id: 3,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.53.40+PM.mp4',
//     productUrl: 'https://ashclair.com/earrings/premade?slug=lush-ivy-hoop-earrings-in-1-carat-round-lab-grown-diamond-rose-gold-14k-e11101',
//     productName: 'Lush Ivy Hoop Earrings',
//   },
//   {
//     id: 4,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.54.35+PM.mp4',
//     productUrl:
//       'https://ashclair.com/engagement-rings/premade?slug=belle-echo-engagement-ring-in-115-cttw-emerald-cut-round-lab-grown-diamond-emerald-white-gold-14k-2-lab-white-diamond-r5559',
//     productName: 'Belle Echo Halo Engagement Ring',
//   },
//   {
//     id: 5,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.56.00+PM.mp4',
//     productUrl:
//       'https://ashclair.com/earrings/premade?slug=two-stone-dangle-earrings-for-women-in-1200-cttw-asscher-pear-lab-grown-diamond-white-gold-14k-e11310',
//     productName: 'Two Stone Dangle Earrings',
//   },
//   {
//     id: 6,
//     videoUrl: 'https://videosbysachin.s3.us-west-1.amazonaws.com/WhatsApp+Video+2026-07-06+at+4.56.52+PM.mp4',
//     productUrl:
//       'https://ashclair.com/necklace/premade?slug=starlit-grace-halo-pendant-in-round-lab-grown-diamond-round-white-gold-14k-025-lab-white-diamond-n2065',
//     productName: 'Starlit Grace Halo Pendant',
//   },
// ];

const Faqwithvideo = () => {
  // Toggle index for FAQs
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full bg-[#ffffff] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Breakpoints in this repo are max-width, so the grid is the desktop base and `lg:` (<=1024px)
            collapses it to a single stacked column. */}
        <div className="flex flex-col gap-16 items-start">
          {/* Video Reels Section (hidden for now) - first on desktop, top on mobile
          <div className="min-w-0 w-full flex flex-col gap-6 order-first">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-[1px] uppercase font-sans text-secondary">Our Best Sellers in Action</h2>
              <div className="h-[2px] w-20 bg-secondary" />
            </div>

            Touch-Friendly Horizontal Reel Strip (Scrollbar Hidden Natively)
            <div className="w-full flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {REELS_DATA.map((reel) => (
                <div
                  key={reel.id}
                  className="flex-none w-[200px] md:w-[240px] aspect-[9/16] relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg snap-start group transition-all duration-300 bg-black"
                >
                  <video
                    src={reel.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                    <p className="text-white text-xs md:text-sm font-semibold font-sans tracking-[0.5px] mb-2 truncate">{reel.productName}</p>

                    <Link
                      href={reel.productUrl}
                      className="w-full bg-white text-secondary py-2 px-4 rounded-lg font-sans text-xs font-bold tracking-wider uppercase text-center shadow-md transform translate-y-1 group-hover:translate-y-0 transition-all duration-300 hover:bg-secondary hover:text-white"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          */}

          {/* FAQ Accordion Section - second on desktop, bottom on mobile */}
          <div className="min-w-0 w-full flex flex-col gap-6">
            <Text as="h2" size="text5xl" className="uppercase tracking-[2.20px] md:text-[26px] sm:w-full sm:text-[22px]">
              Frequently Asked Questions
            </Text>

            <div className="flex flex-col gap-4 mt-2">
              {FAQ_DATA.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div key={faq.id} className="border-b border-[#E5E9DB] pb-4 transition-all duration-300">
                    <button
                      className="w-full flex justify-between items-center text-left py-2 hover:opacity-80 transition-opacity"
                      onClick={() => toggleAccordion(index)}
                    >
                      <span className="text-base md:text-lg font-medium font-sans text-secondary pr-4">{faq.question}</span>
                      <span className="text-lg text-secondary flex-shrink-0">
                        {isOpen ? (
                          // Minimalist Minus Icon
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        ) : (
                          // Minimalist Plus Icon
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </span>
                    </button>

                    {/* Expandable Panel */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-sm md:text-base font-normal font-sans text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faqwithvideo;
