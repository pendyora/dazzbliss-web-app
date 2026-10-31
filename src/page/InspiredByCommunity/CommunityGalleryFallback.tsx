import React from 'react';

import { Image } from 'antd';

import { BRAND } from '@/config/brand';

import { COMMUNITY_SUBHEADING, INSTAGRAM_HANDLE } from './instagram';
import { Img } from '../../components';

/**
 * The section exactly as it was before the Instagram feed existed: a fixed,
 * curated gallery of bundled images.
 *
 * It is the fallback whenever the live feed cannot be shown — backend down,
 * expired or missing token, feed switched off, or an account with no posts.
 * The gallery layout is the original one; the heading block and spacing follow
 * the live section (kicker, Cormorant title, hairline divider).
 */
export default function CommunityGalleryFallback({
  borderColorClass = 'border-line',
  showTopBorder = true,
}: {
  borderColorClass?: string;
  showTopBorder?: boolean;
}) {
  return (
    <div>
      <div
        className={`flex flex-col items-center gap-10 bg-paper font-libre ${showTopBorder ? `border-t border-solid ${borderColorClass}` : ''} sm:hidden`}
      >
        <div className="mx-auto mt-[clamp(56px,7vw,96px)] w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]">
          <div className="flex items-end justify-between gap-8 md:flex-col md:items-start md:gap-4">
            <div className="max-w-[640px]">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">{INSTAGRAM_HANDLE || BRAND.name}</span>
              <p className="m-0 mt-3 text-balance font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-ink">
                Be inspired by our <em className="text-gilt">community</em>
              </p>
            </div>
            <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-ink-soft">{COMMUNITY_SUBHEADING}</p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1440px] gap-2 self-stretch px-[clamp(16px,3.2vw,56px)] md:flex-col">
          <div className="grid grid-cols-3 gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 col-span-1 h-auto ">
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 w-full flex h-full aspect-square">
                  <Image
                    src="/images/img_jewelry_created.png"
                    alt="Woman wearing chunky gold rings"
                    preview={false}
                    className="!h-full object-cover"
                  />
                </div>
                <div className="col-span-1 flex w-full h-full aspect-square">
                  <Image src="/images/img_jewelry_an_e.png" alt="Hand with a thin silver ring" preview={false} className="object-cover !h-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 flex w-full h-auto aspect-square">
                  <Image
                    src="/images/img_jewelry_polinach_11007534_306x308.png"
                    alt="Woman wearing gold necklace and earrings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 w-full flex h-auto aspect-square">
                  <Image
                    src="/images/img_jewelry_arif_khan_15684184.png"
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
                    src="/images/img_jewelry_created.png"
                    alt="Woman wearing chunky gold rings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 flex w-full h-full aspect-square">
                  <Image src="/images/img_jewelry_an_e.png" alt="Hand with a thin silver ring" preview={false} className="object-cover !h-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full h-1/2 lg:h-auto">
                <div className="col-span-1 w-full flex h-full aspect-square">
                  <Image
                    src="/images/img_jewelry_polinach_11007534_306x308.png"
                    alt="Woman wearing gold necklace and earrings"
                    preview={false}
                    className="object-cover !h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-full aspect-square">
                  <Image
                    src="/images/img_jewelry_arif_khan_15684184.png"
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

      <div
        className={`hidden flex-col items-center gap-6 bg-paper pt-14 font-libre sm:flex ${showTopBorder ? 'border-t border-solid border-line' : ''}`}
      >
        <div className="w-full px-4">
          <div className="flex flex-col items-start gap-3">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">{INSTAGRAM_HANDLE || BRAND.name}</span>
            <p className="m-0 text-balance font-cormorant text-[30px] font-medium leading-none text-ink">
              Be inspired by our <em className="text-gilt">community</em>
            </p>
            <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">{COMMUNITY_SUBHEADING}</p>
          </div>
        </div>
        <div className="flex w-full justify-center px-4">
          <div className="grid grid-cols-1 gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 col-span-1 h-auto box-border">
              <div className="grid grid-cols-2 gap-2 w-full h-auto">
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_jewelry_created.png"
                    width={158}
                    height={158}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_jewelry_an_e.png"
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
                    src="img_jewelry_polinach_11007534_306x308.png"
                    width={158}
                    height={158}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_jewelry_arif_khan_15684184.png"
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
                    src="img_jewelry_created.png"
                    width={158}
                    height={158}
                    alt="Woman wearing chunky gold rings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_jewelry_an_e.png"
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
                    src="img_jewelry_polinach_11007534_306x308.png"
                    width={158}
                    height={158}
                    alt="Woman wearing gold necklace and earrings"
                    className="object-cover col-span-1 w-full h-full"
                  />
                </div>
                <div className="col-span-1 w-full h-auto aspect-square">
                  <Img
                    src="img_jewelry_arif_khan_15684184.png"
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
