import React from 'react';

import { Img, Text } from '../../components';

export default function InspiredByCommunity() {
  return (
    <div>
      <div className="flex flex-col items-center gap-[60px] border-t border-solid border-[#3b3b3b] sm:gap-[30px]">
        <div className="container-xs mt-16 2xl:px-[160px] xl:px-28 lg:px-20 lg:mt-10 md:px-5">
          <div className="flex items-start justify-between gap-5 md:flex-col">
            <Text
              size="text5xl"
              as="p"
              className="w-[32%] self-center leading-[54px] tracking-[2.20px] lg:w-[32%] lg:leading-9 md:w-full md:text-[26px] sm:text-[22px]"
            >
              <span className="uppercase">
                <>@ASHCLAIR Be inspired by Our comm</>
              </span>
              <span>unity</span>
            </Text>
            <Text as="p" size="textlg" className="w-[44%] !font-light leading-8 2xl:w-[45%] lg:w-[50%] md:w-full text-justify">
              <>Upload your photo with your new jewels on instagram and tag us at #ashclairjewelry for a chance to be featured in our gallery!</>
            </Text>
          </div>
        </div>
        <div className="container-xs flex gap-2 self-stretch md:flex-col">
          <div className="grid grid-cols-3 gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 col-span-1 h-[555px] lg:h-[343px] xl:h-[555px] 2xl:h-[565px]">
              <div className="grid grid-cols-2 gap-2 w-full h-1/2">
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_created.png"
                    width={300}
                    height={300}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_an_e.png"
                    width={308}
                    height={308}
                    alt="Hand with a thin silver ring"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2">
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_polinach_11007534_306x308.png"
                    width={308}
                    height={308}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_arif_khan_15684184.png"
                    width={308}
                    height={308}
                    alt="Silver ring with blue gemstones on display"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-1 h-[555px] lg:h-[343px] 2xl:h-[565px] xl:h-[555px]">
              <Img
                src="img_image_2.png"
                width={652}
                height={652}
                alt="Woman wearing diamond earrings and ring"
                className="w-[100%] h-full object-cover "
              />
            </div>
            <div className="flex flex-col gap-2 col-span-1 h-[555px] lg:h-[343px] xl:h-[555px] 2xl:h-[565px]">
              <div className="grid grid-cols-2 gap-2 w-full h-1/2">
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_created.png"
                    width={300}
                    height={300}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_an_e.png"
                    width={308}
                    height={308}
                    alt="Hand with a thin silver ring"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2">
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_polinach_11007534_306x308.png"
                    width={308}
                    height={308}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full">
                  <Img
                    src="img_ashclair_arif_khan_15684184.png"
                    width={308}
                    height={308}
                    alt="Silver ring with blue gemstones on display"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
