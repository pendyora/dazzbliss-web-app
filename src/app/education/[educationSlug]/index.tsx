/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';

import { Image } from 'antd';
import { useParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import { Text } from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { clearEducationDetails, fetchEducationDetails } from '../../../store/slices/education/educationSlice';

export default function EducationDetails() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const educationSlug = params?.educationSlug;
  const { educationDetails, loading } = useAppSelector((state) => state.education);
  const [educationData, setEducationData] = useState<any>(null);

  useEffect(() => {
    if (educationSlug) {
      // Clear the previous education details before fetching a new one
      dispatch(clearEducationDetails());
      dispatch(fetchEducationDetails(educationSlug as string));
    }
  }, [educationSlug]);

  useEffect(() => {
    setEducationData(educationDetails);
  }, [educationDetails]);

  return (
    <div className="w-full flex justify-center">
      <div className="flex max-w-[900px] pt-20 sm:pt-10 ">
        {loading ? (
          <div className="w-full h-[60vh] flex justify-center items-center">
            <LuLoader className="h-7 w-7 animate-spin" />
          </div>
        ) : (
          <div className="w-full">
            <div className="flex w-full justify-center sm:pt-5 items-center pb-10 sm:pb-0 flex-col">
              <Text
                size="text6xl"
                as="p"
                className="uppercase text-center px-5 leading-[60px] font-semibold 2xl:leading-10 !text-[26px] lg:leading-8 md:text-[34px] sm:!text-[23px]"
              >
                {educationData?.title}
              </Text>
              <Text size="textxl" className="text-center !italic !text-[16px] !text-[#6a6666] pt-4 px-5" as="p">
                {educationData?.subtitle}
              </Text>
            </div>

            <div className="h-[400px] sm:h-[300px] w-full flex py-10 sm:py-2 justify-center items-center">
              <Image
                src={educationData?.banner || '/images/noImage1.svg'}
                fallback="/images/noImage1.svg"
                alt="Mask Group"
                preview={false}
                width={'max-content'}
                height={400}
                className="w-full !h-full sm:hidden object-cover"
              />
              <Image
                src={educationData?.banner || '/images/noImage1.svg'}
                fallback="/images/noImage1.svg"
                alt="Mask Group"
                preview={false}
                className="w-[99%] !h-full sm:block hidden object-cover"
              />
            </div>

            <div className="flex flex-col justify-center items-center gap-20 border-b py-10 sm:py-2 border-solid border-[#3b3b3b] 2xl:gap-16 xl:gap-12 lg:gap-8 md:gap-[60px] sm:gap-5 md:px-10 sm:px-5 lg:px-20 education-css-setup">
              {educationData?.education && (
                <div className="flex sm:flex-col-reverse items-center">
                  <div className="flex m-auto education-css-setup">
                    <div className="prose" dangerouslySetInnerHTML={{ __html: educationData?.education }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
