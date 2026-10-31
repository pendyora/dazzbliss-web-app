'use client';
import React, { useEffect, useState } from 'react';

import { Button, Image } from 'antd';
import { useRouter } from 'next/navigation';

import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchGemStoneCircle } from '@/store/slices/Master/masterSlice';

export default function ShopGemStone() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { gemStoneData, data } = useAppSelector((state) => state.master);
  const [gemstone, setGemstone] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchGemStoneCircle());
  }, [dispatch]);

  useEffect(() => {
    if (gemStoneData?.length > 0) {
      const filteredGemstone = gemStoneData
        ?.map((item: any) => {
          const masterData = data?.find((master: any) => master.id === item.master_id);
          return {
            ...item,
            name: masterData?.name,
            // if want vector image then uncomment below line
            // image: masterData?.image,
            // if want real image then uncomment below line
            image: masterData?.parent_code === 'SHAPE' ? [masterData?.image?.[1]] : masterData?.image,
            code: masterData?.code,
          };
        })
        ?.sort((a: any, b: any) => a.sorting_sequence - b.sorting_sequence);
      setGemstone(filteredGemstone);
    }
  }, [gemStoneData, data]);

  const [clickedIndex, setClickedIndex] = useState(0);
  const [rotation, setRotation] = useState(0);

  const handleClick = (index: number) => {
    if (clickedIndex !== index) {
      const itemCount = gemstone?.length || 1;
      const currentAngle = rotation;
      const targetAngle = index * -(360 / itemCount);

      // Calculate both clockwise and counter-clockwise distances
      let clockwiseDiff = targetAngle - currentAngle;
      let counterClockwiseDiff = clockwiseDiff;

      // Normalize clockwise rotation
      while (clockwiseDiff < 0) {
        clockwiseDiff += 360;
      }
      while (clockwiseDiff > 360) {
        clockwiseDiff -= 360;
      }

      // Normalize counter-clockwise rotation
      while (counterClockwiseDiff > 0) {
        counterClockwiseDiff -= 360;
      }
      while (counterClockwiseDiff < -360) {
        counterClockwiseDiff += 360;
      }

      // Choose the shortest rotation path
      const newRotation =
        Math.abs(clockwiseDiff) < Math.abs(counterClockwiseDiff) ? currentAngle + clockwiseDiff : currentAngle + counterClockwiseDiff;

      setRotation(newRotation);
      setClickedIndex(index);
    }
  };

  const getChildStylesMobile = (index: number) => {
    const isSelected = clickedIndex === index;
    const angle = (index / gemstone?.length) * 2 * Math.PI;
    const x = Math.cos(angle) * 120;
    const y = Math.sin(angle) * 120;
    return {
      left: '50%',
      top: '50%',
      transition: 'transform 1s, background-color 0.3s',
      transform: isSelected
        ? `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.7) rotate(${-rotation + 90}deg)`
        : `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${-rotation + 90}deg)`,
    };
  };
  const getChildStyles = (index: number) => {
    const isSelected = clickedIndex === index;
    const angle = (index / gemstone?.length) * 2 * Math.PI;

    const x = Math.cos(angle) * 210;
    const y = Math.sin(angle) * 210;

    return {
      left: '50%',
      top: '50%',
      transition: 'transform 1s, background-color 0.3s',
      transform: isSelected
        ? `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.8) rotate(${-rotation + 90}deg)`
        : `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${-rotation + 90}deg)`,
    };
  };

  // Tablet: `xl:-mb-14` on the wrapper below pulls the following section up by 56px.
  // That is harmless while this section is a row — the circle is taller than the text
  // column, leaving ~145px of dead space under the button for the next section to move
  // into. Below 770px `md:flex-col` stacks them, the button becomes the section's bottom
  // edge, and the same -56px drags "Our Collaborations" 12px ON TOP of it. The
  // `min-width:551px and max-width:769px` override restores a 0 bottom margin across
  // exactly that stacked band, leaving a normal ~44px gap; row widths are untouched.
  return (
    gemstone?.length > 0 && (
      <div className="mt-20 flex justify-center xl:mt-10 xl:-mb-14 2xl:mt-10 2xl-mb-14 sm:mt-[40px] sm:mb-5 [@media(min-width:551px)_and_(max-width:769px)]:mb-0">
        <div className="container-xs flex md:flex-col items-center justify-between gap-5 2xl:px-[160px] xl:px-26 lg:px-20 sm:px-3 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex-col">
          <div className="md:flex w-full flex-wrap justify-between gap-5 hidden [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex">
            <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
              {gemstone[clickedIndex ?? 0]?.other_details?.option?.[0]}
            </Text>
            <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
              {gemstone[clickedIndex ?? 0]?.other_details?.option?.[1]}
            </Text>
          </div>
          <div className="flex relative sm:my-5 items-center justify-center sm:w-[50%] sm:h-[50%] h-fit py-5 lg:py-0 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:my-5 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:w-[50%] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:h-[50%]">
            <div className="relative w-[500px] h-[500px] sm:w-[50%] sm:my-14 sm:h-auto sm:aspect-square rotate-[-90deg] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:w-[50%] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:my-14 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:h-auto [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:aspect-square">
              <div
                className={`absolute sm:hidden [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:hidden inset-0 flex items-center justify-center transition-transform duration-300`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 2s',
                }}
              >
                {gemstone.map((gems: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => handleClick(index)}
                    className={`bg-transparent h-12 w-12 !aspect-square rounded-full cursor-pointer absolute select-none`}
                    style={getChildStyles(index)}
                  >
                    <Image
                      src={gems?.image?.[0]}
                      fallback="/images/no_images.svg"
                      alt={gems?.name}
                      preview={false}
                      className="h-full w-full rounded-full object-contain"
                    />
                  </div>
                ))}
              </div>
              <div
                className={`absolute inset-0 hidden sm:flex [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex items-center justify-center transition-transform duration-300`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 2s',
                }}
              >
                {gemstone.map((gems: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => handleClick(index)}
                    className={`bg-transparent h-9 w-9 !aspect-square rounded-full cursor-pointer absolute select-none`}
                    style={getChildStylesMobile(index)}
                  >
                    <Image
                      src={gems.image}
                      fallback="/images/no_images.svg"
                      alt={gems.name}
                      preview={false}
                      className="h-full w-full rounded-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute flex sm:flex-col sm:gap-2 items-center justify-center text-xl font-bold h-fit text-center [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex-col [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:gap-2">
              <Text
                size="text4xl"
                as="p"
                className="uppercase text-wrap px-2 tracking-[1.30px] sm:!text-[15px] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!text-[15px]"
              >
                {gemstone[clickedIndex ?? 0]?.name}
              </Text>
              <Button
                disabled={gemstone[clickedIndex ?? 0]?.link !== '' ? false : true}
                onClick={() => {
                  router.push(`${gemstone[clickedIndex ?? 0]?.link}`);
                }}
                className="!hidden sm:!flex [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!flex !border !border-primary !h-[35px] !w-fit tracking-[1.50px] uppercase sm:!text-[12px] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!text-[12px]"
              >
                SHOP ALL
              </Button>
            </div>
          </div>
          <div className="flex w-[46%] flex-col lg:w-1/2 gap-40 2xl:gap-[100px] xl:gap-[90px] lg:gap-[90px] md:w-full md:gap-10 sm:gap-8 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:w-full [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:gap-10">
            <div className="flex md:hidden flex-wrap justify-between gap-5 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:hidden">
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {/* Loyalty */}
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[0]}
              </Text>
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[1]}
              </Text>
            </div>
            <div className="md:-mt-3 md:flex hidden flex-wrap justify-between gap-5 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex">
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[2]}
              </Text>
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[3]}
              </Text>
            </div>
            <div className="flex flex-col md:items-center items-start gap-5 md:mb-5 sm:mb-0 sm:gap-3">
              <div className="flex flex-col md:items-center items-start gap-[10px] sm:gap-3">
                <div className="flex flex-col items-center sm:justify-center flex-wrap">
                  <Text size="text5xl" as="p" className="md:text-[26px] sm:!text-[20px]">
                    <span className="text-[44px] uppercase tracking-[2.20px] text-[#2f2f2f] xl:text-[30px] sm:!text-[22px]">
                      {gemstone[clickedIndex ?? 0]?.name}
                    </span>
                  </Text>
                  <Text size="text4xl" as="p" className="md:text-[26px] sm:text-[26px]">
                    {/* <span className="uppercase text-[#000000]">&nbsp;–&nbsp;</span> */}
                    {/* <span className="capitalize text-[#000000] sm:!text-[18px]">{gemstone[clickedIndex ?? 0]?.desc}</span> */}
                  </Text>
                </div>
                <Text size="textlg" as="p">
                  {gemstone[clickedIndex ?? 0]?.desc}
                </Text>
              </div>
              {/* <Link href=''> */}
              <Button
                disabled={gemstone[clickedIndex ?? 0]?.link !== '' ? false : true}
                onClick={() => {
                  // router.push(`/all?diamondColor=${(gemstone[clickedIndex ?? 0]?.code ?? '').toLowerCase()}`);
                  router.push(`${gemstone[clickedIndex ?? 0]?.link}`);
                }}
                className="sm:!hidden [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!hidden !border !border-primary !h-[45px] tracking-[1.50px] uppercase 2xl:text-[16px] md:w-full xl:text-[16px] lg:text-[14px] sm:!text-[12px] lg:!h-[37px]"
              >
                SHOP ALL {/* SAPPHIRE */}
                {gemstone[clickedIndex ?? 0]?.name} JEWELS
              </Button>
              {/* </Link> */}
            </div>
            <div className="lg:mt-5 2xl:mt-5 xl:mt-5 flex md:hidden flex-wrap justify-between gap-5 sm:gap-2 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:hidden">
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[2]}
              </Text>
              <Text size="textlg" as="p" className="uppercase tracking-[1.30px]">
                {gemstone[clickedIndex ?? 0]?.other_details?.option?.[3]}
              </Text>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
