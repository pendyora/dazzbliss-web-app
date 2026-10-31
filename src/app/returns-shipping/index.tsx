'use client';
import React from 'react';

import { LuClock3, LuGlobe, LuRotateCcw, LuTruck } from 'react-icons/lu';

import CareLayout from '@/components/ClientCare/CareLayout';
import PolicyDoc, { Callout, CareContact, PlainTable, PolicySection, StepList } from '@/components/ClientCare/PolicyDoc';

const FACTS = [
  { Icon: LuTruck, title: 'Free US shipping', text: 'By USPS on orders over $100.' },
  { Icon: LuClock3, title: 'Signed for', text: 'Signature required on orders over $80.' },
  { Icon: LuRotateCcw, title: '30-day returns', text: 'Refund or exchange from the date of shipment.' },
  { Icon: LuGlobe, title: 'International', text: 'Shipping and returns worldwide.' },
];

const SECTIONS: PolicySection[] = [
  {
    id: 'us-shipping',
    title: 'US shipping',
    body: (
      <>
        <PlainTable
          head={['Method', 'Carrier', 'Cost']}
          rows={[
            ['Standard', 'USPS', 'Free on orders over $100'],
            ['Second Day Air', 'UPS', '$25'],
            ['Overnight', 'UPS', '$35'],
          ]}
        />
        <Callout>All packages over $80 need a signature on delivery. This is mandatory for our insurance policy.</Callout>
      </>
    ),
  },
  {
    id: 'holiday-shipping',
    title: 'Holiday shipping',
    body: <p>FedEx and UPS packages may be delayed by a day or two during the holidays because of the high volume of parcels.</p>,
  },
  {
    id: 'us-returns',
    title: 'US returns',
    body: (
      <>
        <p>
          We want you to love every piece. If you are not completely satisfied, you can return any order for a refund or exchange within{' '}
          <strong>30 days from the date of shipment</strong>.
        </p>
        <p>
          Items must be returned in the condition you received them. Please leave the tag on until you are sure you are keeping the piece: if the tag
          is removed or the piece shows signs of wear, a <strong>10% restocking fee</strong> applies.
        </p>
        <Callout>Custom-making fees (sizing, metal upgrades, stone changes and similar) and shipping charges are not refundable.</Callout>
      </>
    ),
  },
  {
    id: 'international',
    title: 'International shipping & returns',
    body: (
      <>
        <p>
          International orders can also be returned for a refund or exchange within 30 days from the date of shipment, in the condition you received
          them. If the tag is removed, a 10% restocking fee applies.
        </p>
        <p>Custom-making fees (sizing, metal upgrades, stone changes and similar) and shipping charges are not refundable.</p>
      </>
    ),
  },
  {
    id: 'how-to-return',
    title: 'How to return an order',
    body: (
      <StepList
        steps={[
          { title: 'Pack it securely', text: 'Pack all your items together as one parcel, and include a copy of your invoice.' },
          {
            title: 'Ship it insured and tracked',
            text: 'We strongly suggest insurance and signature confirmation, and a tracking number so your return is quick.',
          },
          { title: 'Send it to us', text: 'Contact client care for the return address before you ship.' },
          {
            title: 'We inspect and process it',
            text: 'A certified jeweler checks the piece, and we process your return within 1–3 business days of receiving it.',
          },
        ]}
      />
    ),
  },
  {
    id: 'questions',
    title: 'Questions',
    body: (
      <p>
        Need help with a delivery or a return? <CareContact /> and we will take care of it.
      </p>
    ),
  },
];

export default function ReturnsShipping() {
  return (
    <CareLayout
      title="Shipping & returns"
      crumb="Shipping & returns"
      intro="How we ship, what it costs, and how to send a piece back within 30 days."
    >
      <PolicyDoc
        sections={SECTIONS}
        help={{ title: 'Need it by a date?', text: 'Tell us and we will check before you order.' }}
        lead={
          <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0 pt-[clamp(28px,4vw,44px)] lg:grid-cols-2 sm:gap-2">
            {FACTS.map(({ Icon, title, text }) => (
              <li key={title} className="grid content-start gap-2 border border-line p-5 sm:p-3.5">
                <Icon className="h-6 w-6 text-navy" strokeWidth={1.3} />
                <b className="font-cormorant text-[22px] font-medium leading-[1.1] sm:text-[18px]">{title}</b>
                <span className="text-[13px] text-ink-soft sm:text-[12px]">{text}</span>
              </li>
            ))}
          </ul>
        }
      />
    </CareLayout>
  );
}
