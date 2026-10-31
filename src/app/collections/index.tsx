'use client';
import { Image } from 'antd';
import Link from 'next/link';

import { useAppSelector } from '@/store';

export default function CollectionsPage() {
  const { headerData } = useAppSelector((state) => state.master);

  return (
    <div>
      <div
        className={`flex sm:hidden h-[660px] items-center justify-center py-48 2xl:h-[480px] xl:h-[380px] xl:py-8 lg:h-[280px] lg:py-8 md:h-auto md:py-5 sm:py-4`}
        style={{
          backgroundImage: `url('/images/collection_banner.webp')`,
          backgroundSize: 'cover',

          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="container-xs flex justify-end 2xl:px-[160px] xl:px-28 xl:py-[60px] lg:px-20 md:px-5 xl:justify-end md:justify-end"></div>
      </div>
      <div className="hidden sm:flex flex-col pb-5 gap-[20px]">
        <div className="h-[224px] w-full flex">
          <Image src="/images/collection_banner.webp" preview={false} alt="Ring" className="object-cover !h-full" />
        </div>
      </div>
      <div className="py-14 sm:py-5 flex flex-col gap-8 lg:gap-2 sm:gap-4">
        <div className="w-full flex justify-center items-center sm:px-5">
          <p className="text-[40px] sm:text-center sm:text-[27px]">TRENDING COLLECTIONS</p>
        </div>
        <div className="container-xs flex justify-end 2xl:px-[160px] xl:px-28 xl:py-[60px] lg:px-20 md:px-5 xl:justify-end md:justify-end">
          <div className="w-full grid grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-16 lg:gap-8 sm:gap-5 md:gap-6">
            {headerData?.collections?.map((item: any, i: number) => {
              return (
                <Link key={i} href={`/all?collections=${item?.name?.toLowerCase().split(' ').join('-')}`}>
                  <div className="flex w-full aspect-square relative flex-col gap-0.5 items-center md:!aspect-square sm:!aspect-square cursor-pointer">
                    <div className="!w-full aspect-square flex justify-center items-center">
                      <Image
                        className="!object-cover !aspect-square relative !w-[432px]"
                        preview={false}
                        src={item?.desktop_image}
                        fallback="/images/no_images.svg"
                        alt={item?.name}
                      />
                    </div>
                    <p className="absolute p-2 text-center bottom-0 bg-black/30 w-full text-white text-nowrap cursor-pointer">{item?.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
