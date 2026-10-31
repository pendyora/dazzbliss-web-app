// 'use client';
//
// import React, { useMemo, useRef, useState } from 'react';
//
// import { Image, Tooltip, TooltipProps } from 'antd';
// import AliceCarousel, { EventObject } from 'react-alice-carousel';
//
// import { Text, RatingBar, Slider } from '../../components';
//
// export default function CustomersReviews() {
// const [sliderState, setSliderState] = useState(0);
// const sliderRef = useRef<AliceCarousel>(null);
//
// const [arrow] = useState<'Show' | 'Hide' | 'Center'>('Show');
//
// const mergedArrow = useMemo<TooltipProps['arrow']>(() => {
// if (arrow === 'Hide') {
// return false;
// }
//
// if (arrow === 'Show') {
// return true;
// }
//
// return {
// pointAtCenter: true,
// };
// }, [arrow]);
// return (
// <div>
// <div className="flex justify-center bg-[#c5ccb4] py-[72px] 2xl:py-14 xl:py-14 lg:py-8 md:py-5 sm:p-0 ">
// <div className="container-xs flex items-center justify-between gap-[30px] 2xl:px-[160px] xl:px-28 lg:px-20 md:flex-col md:px-5 sm:hidden">
// <div className="flex w-[92%] items-center gap-[30px] lg:w-11/12 md:w-full">
// <Text
// size="text5xl"
// as="p"
// className="w-[26%] !font-medium uppercase leading-[54px] tracking-[2.20px] lg:w-[25%] md:w-full md:text-[26px] lg:text-[22px] lg:leading-9"
// >
// <>
// Real Reviews <br />
// From Real Customers
// </>
// </Text>
// <div className="mx-auto flex w-4/6 lg:w-[75%] 2xl:w-[75%] xl:w-[75%] md:w-[70%]">
// <Slider
// autoPlay
// autoPlayInterval={5000}
// responsive={{
// '0': { items: 1 },
// '551': { items: 1 },
// '1051': { items: 1 },
// '1441': { items: 1 },
// }}
// disableDotsControls
// activeIndex={sliderState}
// onSlideChanged={(e: EventObject) => {
// setSliderState(e?.item);
// }}
// ref={sliderRef}
// items={[...Array(3)].map(() => (
// <React.Fragment key={Math.random()}>
// <div className="flex items-center gap-8  w-full">
// <div className="flex w-1/2 flex-col items-start gap-20 xl:gap-[35px] lg:gap-[25px] md:gap-[60px] sm:gap-10">
// <div className="flex flex-col gap-6 self-stretch ">
// <div className="flex items-center gap-[30px]">
// <RatingBar value={1} isEditable={true} size={20} className="flex gap-2.5" />
// <Text size="textxl" as="p">
// 10.12.2023
// </Text>
// </div>
// <Text size="textlg" as="p" className="!font-light leading-8 text-justify">
// <>
// “I can’t stop staring at my new jewelry ring! The exquisite craftsmanship and stunning gemstones make it an absolute
// showstopper. Every time I wear it, I receive compliments galore.
// </>
// </Text>
// </div>
// <Text size="textmd" as="p" className="!font-medium pl-2">
// TANIA J.
// </Text>
// </div>
// <div className="flex w-1/2 flex-col items-start gap-[78px] xl:gap-[35px] lg:gap-[25px] md:gap-[58px] sm:gap-[39px]">
// <div className="flex flex-col gap-6 self-stretch ">
// <div className="flex items-center gap-[30px]">
// <RatingBar value={1} isEditable={true} size={20} className="flex gap-2.5" />
// <Text size="textxl" as="p">
// 03.12.2023
// </Text>
// </div>
// <Text size="textlg" as="p" className="!font-light leading-8 text-justify">
// <>
// “I can’t stop staring at my new jewelry ring! The exquisite craftsmanship and stunning gemstones make it an absolute
// showstopper. Every time I wear it, I receive compliments galore.
// </>
// </Text>
// </div>
// <Text size="textmd" as="p" className="!font-medium pl-2">
// ALEX P.
// </Text>
// </div>
// </div>
// </React.Fragment>
// ))}
// />
// </div>
// </div>
// <Tooltip placement="top" title={'Not available!!'} arrow={mergedArrow}>
// <Image
// src="/images/img_frame_50.svg"
// preview={false}
// alt="Frame 50"
// className="h-[40px] w-[6%] object-contain lg:w-1/12 cursor-pointer"
// />
// </Tooltip>
// </div>
//
// {/* Mobile design */}
// <div className="container-xs sm:flex flex-col items-center justify-between gap-[30px] p-5 hidden">
// <div className="flex w-[92%] items-center gap-[30px] lg:w-11/12 md:w-full">
// <Text size="text5xl" as="p" className=" !font-medium uppercase leading-[26px] text-center w-full">
// <>
// Real Reviews <br />
// From Real Customers
// </>
// </Text>
// </div>
// <div className="mx-auto flex w-full">
// <Slider
// autoPlay
// autoPlayInterval={5000}
// responsive={{
// '0': { items: 1 },
// '375': { items: 1 },
// '1051': { items: 1 },
// '1441': { items: 1 },
// }}
// disableDotsControls
// activeIndex={sliderState}
// onSlideChanged={(e: EventObject) => {
// setSliderState(e?.item);
// }}
// ref={sliderRef}
// items={[...Array(3)].map(() => (
// <React.Fragment key={Math.random()}>
// <div className="flex items-center gap-3  w-full ">
// <div className="flex w-full flex-col items-center justify-center gap-3">
// <div className="flex flex-col gap-[10px] self-stretch ">
// <div className="flex items-center justify-center gap-[30px]">
// <RatingBar value={1} isEditable={true} size={20} className="flex gap-2.5" />
// <Text size="textxl" as="p">
// 10.12.2023
// </Text>
// </div>
// <Text size="textlg" as="p" className="!font-light leading-8 text-center">
// <>
// “I can’t stop staring at my new jewelry ring! The exquisite craftsmanship and stunning gemstones make it an absolute
// showstopper. Every time I wear it, I receive compliments galore.
// </>
// </Text>
// </div>
// <Text size="textmd" as="p" className="!font-medium pl-2 text-center">
// TANIA J.
// </Text>
// </div>
// {/* <div className="flex w-1/2 flex-col items-start gap-[78px] xl:gap-[35px] lg:gap-[25px] md:gap-[58px] sm:gap-[39px]">
// <div className="flex flex-col gap-6 self-stretch ">
// <div className="flex items-center gap-[30px]">
// <RatingBar
// value={1}
// isEditable={true}
// size={20}
// className="flex gap-2.5"
// />
// <Text size="textxl" as="p">
// 03.12.2023
// </Text>
// </div>
// <Text
// size="textlg"
// as="p"
// className="!font-light leading-8 text-justify"
// >
// <>
// “I can’t stop staring at my new jewelry ring! The
// exquisite craftsmanship and stunning gemstones make
// it an absolute showstopper. Every time I wear it, I
// receive compliments galore.
// </>
// </Text>
// </div>
// <Text size="textmd" as="p" className="!font-medium pl-2">
// ALEX P.
// </Text>
// </div> */}
// </div>
// </React.Fragment>
// ))}
// />
// </div>
// <Tooltip placement="top" title={'Not available!!'} arrow={mergedArrow}>
// <Image
// src="/images/img_frame_50.svg"
// preview={false}
// alt="Frame 50"
// className="h-[40px] w-[6%] object-contain lg:w-1/12 cursor-pointer"
// />
// </Tooltip>
// </div>
// </div>
// </div>
// );
// }

export {};
