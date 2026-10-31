import React from 'react';

import { Image } from 'antd';

import { Img, Text } from '../../components';

/**
 * The section exactly as it was before the Instagram feed existed: a fixed,
 * curated gallery of bundled images.
 *
 * It is the fallback whenever the live feed cannot be shown — backend down,
 * expired or missing token, feed switched off, or an account with no posts.
 * Keeping the original markup verbatim means a failure degrades to a design
 * that has already shipped and been reviewed, rather than to a thinner version
 * of the new one.
 */
export default function CommunityGalleryFallback({
  borderColorClass = 'border-[#3b3b3b]',
  showTopBorder = true,
}: {
  borderColorClass?: string;
  showTopBorder?: boolean;
}) {
  return (
    <div>
      <div className={`flex flex-col items-center gap-[60px] ${showTopBorder ? `border-t border-solid ${borderColorClass}` : ''} sm:hidden`}>
        <div className="container-xs mt-16 2xl:px-[160px] xl:px-28 lg:px-20 lg:mt-10 md:px-5">
          <div className="flex items-start justify-between gap-5 md:flex-col">
            <Text
              size="text5xl"
              as="p"
              className="w-[32%] self-center leading-[54px] tracking-[2.20px] lg:w-[32%] lg:leading-9 md:w-full md:text-[26px] sm:text-[22px]"
            >
              <span className="uppercase">
                <>@ASHCLAIR Be inspired by Our community</>
              </span>
            </Text>
            <Text as="p" size="textlg" className="w-[44%] !font-light leading-8 2xl:w-[45%] lg:w-[50%] md:w-full text-justify">
              <>Upload your photo with your new jewels on instagram and tag us at #ashclairjewelry for a chance to be featured in our gallery!</>
            </Text>
          </div>
        </div>
        <div className="container-xs flex gap-2 self-stretch md:flex-col">
          <div className="grid grid-cols-3 gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 col-span-1 h-auto ">
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 w-full flex h-full aspect-square">
                  <Image
                    src="/images/img_ashclair_created.png"
                    alt="Woman wearing chunky gold rings"
                    preview={false}
                    className="!h-full object-cover"
                  />
                </div>
                <div className="col-span-1 flex w-full h-full aspect-square">
                  <Image src="/images/img_ashclair_an_e.png" alt="Hand with a thin silver ring" preview={false} className="object-cover !h-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 flex w-full h-auto aspect-square">
                  <Image
                    src="/images/img_ashclair_polinach_11007534_306x308.png"
                    alt="Woman wearing gold necklace and earrings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 w-full flex h-auto aspect-square">
                  <Image
                    src="/images/img_ashclair_arif_khan_15684184.png"
                    alt="Silver ring with blue gemstones on display"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-1 h-auto flex aspect-square">
              <Image src="/images/img_image_2.png" alt="Woman wearing diamond earrings and ring" preview={false} className="object-cover !h-full" />
            </div>
            <div className="flex flex-col gap-2 col-span-1 h-auto">
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 w-full flex h-full aspect-square">
                  <Image
                    src="/images/img_ashclair_created.png"
                    alt="Woman wearing chunky gold rings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 flex w-full h-full aspect-square">
                  <Image src="/images/img_ashclair_an_e.png" alt="Hand with a thin silver ring" preview={false} className="object-cover !h-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 w-full flex h-full aspect-square">
                  <Image
                    src="/images/img_ashclair_polinach_11007534_306x308.png"
                    alt="Woman wearing gold necklace and earrings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full aspect-square">
                  <Image
                    src="/images/img_ashclair_arif_khan_15684184.png"
                    alt="Silver ring with blue gemstones on display"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`sm:flex flex-col items-center pt-5 my-3 gap-[20px] ${showTopBorder ? 'border-t border-solid border-gray-200' : ''} hidden`}>
        <div className="container-xs sm:px-3">
          <div className="flex items-start justify-between gap-[14px] md:flex-col">
            <Text size="text5xl" as="p" className="px-2 text-center leading-[14px] tracking-[2px]">
              <span className="uppercase text-center">@ASHCLAIR Be inspired by Our community</span>
            </Text>
            <Text as="p" size="textlg" className="px-2 !font-light leading-[14px] text-center">
              <>Upload your photo with your new jewels on instagram and tag us at #ashclairjewelry for a chance to be featured in our gallery!</>
            </Text>
          </div>
        </div>
        <div className="container-xs flex justify-center sm:px-3">
          <div className="grid grid-cols-1 gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 col-span-1 h-auto box-border">
              <div className="grid grid-cols-2 gap-2 w-full h-auto">
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_created.png"
                    width={158}
                    height={158}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_an_e.png"
                    width={158}
                    height={158}
                    alt="Hand with a thin silver ring"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-auto">
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_polinach_11007534_306x308.png"
                    width={158}
                    height={158}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_arif_khan_15684184.png"
                    width={158}
                    height={158}
                    alt="Silver ring with blue gemstones on display"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-1 h-auto box-border aspect-square">
              <Img
                src="img_image_2.png"
                width={327}
                height={327}
                alt="Woman wearing diamond earrings and ring."
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-1 h-auto box-border">
              <div className="grid grid-cols-2 gap-2 w-full h-auto">
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_created.png"
                    width={158}
                    height={158}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_an_e.png"
                    width={158}
                    height={158}
                    alt="Hand with a thin silver ring"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-auto">
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_polinach_11007534_306x308.png"
                    width={158}
                    height={158}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_ashclair_arif_khan_15684184.png"
                    width={158}
                    height={158}
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
