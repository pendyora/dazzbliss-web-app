import React from 'react';

import InspiredByCommunity from '@/page/InspiredByCommunity';

import WhyAllorya from './../../components/WhyAllorya';
import { FeaturedIn } from './../../page';
import GiftguideFrame67 from './GiftguideFrame67';

export default function GIFTGUIDEPage() {
  return (
    <div className="w-full bg-[#ffffff]">
      <div className="sm:mt-5">
        <GiftguideFrame67 />
        <WhyAllorya />
        <FeaturedIn />
        <InspiredByCommunity />
      </div>
    </div>
  );
}
