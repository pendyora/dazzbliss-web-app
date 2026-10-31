import React from 'react';

import InspiredByCommunity from '@/page/InspiredByCommunity';

import WhyUs from './../../components/WhyUs';
import { FeaturedIn } from './../../page';
import GiftguideFrame67 from './GiftguideFrame67';

export default function GIFTGUIDEPage() {
  return (
    <div className="w-full bg-paper">
      <div className="sm:mt-5">
        <GiftguideFrame67 />
        <WhyUs />
        <FeaturedIn />
        <InspiredByCommunity />
      </div>
    </div>
  );
}
