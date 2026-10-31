'use client';
import React from 'react';

import { Image } from 'antd';
import { useRouter } from 'next/navigation';

import { Text } from '@/components';
import ProductProfile from '@/components/ProductProfile';

interface Product {
  productImage: string;
  stackable_image?: string;
  productName: string;
  productDescription: string;
  productPrice: string;
}

interface Banner {
  bannerImage: string;
  bannerDescription: string;
  redirect_url: string;
  desktop_image: string;
  jewelryTypeDetails: {
    id: string;
    code: string;
    name: string;
  };
  jewelry_type: string;
  mobile_image: string;
  name: string;
}

interface ChunkComponentProps {
  chunk: Product[];
  index: number;
  bannerData: Banner[];
}

const ChunkComponent: React.FC<ChunkComponentProps> = ({ chunk, index, bannerData }) => {
  // Get the banner for this chunk based on the index modulo bannerData length
  const routes = useRouter();
  const bannerIndex = index % bannerData.length;
  const banner = bannerData[bannerIndex];

  const chunkLength = chunk.length;

  // Determine if the current index is even or odd
  const isEvenIndex = index % 2 !== 0;
  return (
    <div className="w-full grid grid-cols-4 gap-4 mb-4 sm:mb-2 md:grid-cols-4 sm:grid-cols-2 sm:gap-2">
      {isEvenIndex ? (
        <>
          {chunk.slice(0, 4).map((product, i) => (
            <div key={i} className="col-span-1">
              <ProductProfile {...product} is_stackable={true} isStatic={true} key={'group2652' + i} className={`w-full`} />
            </div>
          ))}
          {chunk.slice(4, 8).map((product, i) => (
            <div key={i} className="col-span-1 hidden md:block">
              <ProductProfile {...product} is_stackable={true} isStatic={true} key={'group2652' + i} className={`w-full`} />
            </div>
          ))}
          {chunkLength >= 8 && banner && banner != undefined && (
            <div
              className="col-span-1 relative h-auto cursor-pointer lg:h-auto w-full md:h-auto sm:self-start sm:aspect-[5/8]"
              onClick={() => routes.push(banner?.redirect_url)}
            >
              <div className="flex items-center justify-center h-full w-full overflow-hidden">
                <div className="relative w-full h-full sm:static">
                  <Image
                    src={banner?.desktop_image}
                    alt="Group 1259 1"
                    preview={false}
                    wrapperClassName="!block !w-full !h-full sm:!hidden"
                    className="!w-full !h-full !object-fill"
                  />
                  <Image
                    src={banner?.mobile_image}
                    alt="Group 1259 1"
                    preview={false}
                    wrapperClassName="!hidden sm:!block sm:!absolute sm:!inset-0 !w-full !h-full"
                    className="!w-full !h-full !object-cover"
                  />
                  <div className="absolute bottom-0 left-0 p-4 bg-opacity-50">
                    <Text as="p" size="text5xl" className="font-bold uppercase sm:!text-[14px]">
                      {banner?.name}
                    </Text>
                    <Text as="p" size="textlg" className="underline sm:!text-[11px]">
                      Shop Now
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )}
          {chunk.slice(4, 8).map((product, i) => (
            <div key={i} className="col-span-1 md:hidden">
              <ProductProfile {...product} is_stackable={true} isStatic={true} key={'group2652' + i} className={`w-full`} />
            </div>
          ))}
        </>
      ) : (
        <>
          {chunk.slice(0, 8).map((product, i) => (
            <div key={i} className="col-span-1">
              <ProductProfile {...product} is_stackable={true} isStatic={true} key={'group2652' + i} className={`w-full`} />
            </div>
          ))}

          {chunkLength >= 8 && banner && banner != undefined && (
            <div
              className="col-span-1 relative cursor-pointer h-auto w-full md:h-auto sm:self-start sm:aspect-[5/8]"
              onClick={() => routes.push(banner?.redirect_url)}
            >
              <div className="flex items-center justify-center h-full w-full overflow-hidden">
                <div className="relative w-full h-full sm:static">
                  <Image
                    src={banner?.desktop_image}
                    alt="Group 1259 1"
                    preview={false}
                    wrapperClassName="!block !w-full !h-full sm:!hidden"
                    className="!w-full !h-full !object-fill"
                  />
                  <Image
                    src={banner?.mobile_image}
                    alt="Group 1259 1"
                    preview={false}
                    wrapperClassName="!hidden sm:!block sm:!absolute sm:!inset-0 !w-full !h-full"
                    className="!w-full !h-full !object-cover"
                  />
                  <div className="absolute bottom-0 left-0 p-4 bg-opacity-50">
                    <Text as="p" size="text5xl" className="font-bold uppercase sm:!text-[14px]">
                      {banner?.name}
                    </Text>
                    <Text as="p" size="textlg" className="underline cursor-pointer sm:!text-[11px]">
                      Shop Now
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChunkComponent;
