/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect } from 'react';

import { ConfigProvider, Image, Pagination } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { LuLoader } from 'react-icons/lu';

import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchEducationFilter,
  fetchEducationList,
  setEducationPage,
  setEducationPrevPage,
  setEducationSelectedCategory,
  setEducationSelectedFilter,
} from '../../store/slices/education/educationSlice';
import { plpTheme } from '../[jewelryType]/FilterDrawer';

const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';

export default function EducationPage({ BannerData }: any) {
  const dispatch = useAppDispatch();
  const masterData = useAppSelector((state) => state.master.data);
  const {
    loading,
    educationList,
    educationFilter,
    educationSelectedCategory,
    educationSelectedFilter,
    educationCounts,
    educationPage,
    educationPrevPage,
  } = useAppSelector((state: any) => state.education);
  const PAGE_LIMIT = 50;

  useEffect(() => {
    if (!educationFilter) {
      dispatch(fetchEducationFilter());
    }
    if (!educationSelectedCategory) {
      dispatch(setEducationSelectedCategory('all'));
    }
  }, []);

  useEffect(() => {
    if (!educationList?.length || educationSelectedCategory !== educationSelectedFilter) {
      dispatch(fetchEducationList({ education_type_id: educationSelectedFilter, page: 1, size: PAGE_LIMIT })).then(() => {
        dispatch(setEducationSelectedCategory(educationSelectedFilter ?? 'all'));
      });
    }
  }, [educationSelectedFilter]);

  useEffect(() => {
    if (educationPrevPage !== educationPage && educationList?.length !== 0) {
      dispatch(fetchEducationList({ education_type_id: educationSelectedFilter, page: educationPage, size: PAGE_LIMIT }));
    }
    // Update the ref with the current page after the effect runs
    dispatch(setEducationPrevPage(educationPage));
  }, [educationPage]);
  console.log(BannerData, 'BannerData');

  const bannerImage = BannerData?.banner_image?.[0]?.desktop_image;

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <section className="border-b border-line bg-haze">
        <div
          className={`${SHELL} grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-[clamp(28px,4vw,64px)] py-[clamp(32px,4.5vw,64px)] md:grid-cols-1 ${
            bannerImage ? '' : '!grid-cols-1'
          }`}
        >
          <div>
            <nav aria-label="Breadcrumb" className="mb-3.5 flex gap-2 text-[12px] text-ink-soft">
              <Link href="/" className="text-ink-soft hover:text-ink">
                Home
              </Link>
              <span aria-hidden className="text-line-strong">
                /
              </span>
              <span aria-current="page">Education</span>
            </nav>
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">The learning centre</span>
            <h1 className="m-0 mt-3 font-cormorant text-[clamp(40px,4.6vw,60px)] font-medium leading-none tracking-[-0.01em]">
              {BannerData?.banner_image?.[0]?.title || 'Education'}
            </h1>
            <p className="m-0 mt-3.5 max-w-[52ch] text-[15px] text-ink-soft">
              Plain-spoken guides to diamonds, metals and settings, so you can choose with confidence.
            </p>
          </div>
          {bannerImage && (
            <figure className="m-0 aspect-[16/9] overflow-hidden bg-stone">
              <img src={bannerImage} alt="" className="h-full w-full object-cover" />
            </figure>
          )}
        </div>
      </section>

      <div className="sticky top-[var(--header-height,108px)] z-20 border-b border-line bg-paper">
        <div className={`${SHELL} flex min-h-[58px] items-center gap-6`}>
          <span className="flex-none text-[10.5px] uppercase tracking-[0.16em] text-ink-faint md:hidden">Category</span>
          <div role="toolbar" aria-label="Categories" className="flex flex-1 gap-[26px] overflow-x-auto [scrollbar-width:none]">
            {educationFilter?.map((type: any, index: number) => {
              const category = index == 0 ? type.type : masterData?.find((el: any) => el.id === type.type);
              const active = educationSelectedFilter === type?.type;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={active}
                  className={`flex-none whitespace-nowrap border-b-[1.5px] pb-4 pt-[18px] text-[13.5px] capitalize ${
                    active ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                  onClick={() => {
                    dispatch(setEducationSelectedFilter(type?.type));
                  }}
                >
                  {category?.name ?? category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${SHELL} min-h-[60vh] pb-20`}>
        {loading ? (
          <div className="flex h-[50vh] w-full items-center justify-center" aria-busy="true">
            <LuLoader className="h-7 w-7 animate-spin text-ink-soft" />
          </div>
        ) : (
          <>
            {educationList?.length > 0 && (
              <div className="grid grid-cols-4 gap-x-5 gap-y-12 pt-9 lg:grid-cols-3 md:grid-cols-2 md:gap-y-9 sm:grid-cols-1">
                {educationList.map((item: any, index: number) => (
                  <Link
                    key={item?.slug ?? index}
                    href={`/education/${item?.slug}`}
                    className="group grid content-start gap-3 text-ink hover:text-ink"
                  >
                    <figure className="m-0 aspect-[4/3] overflow-hidden bg-stone [&_.ant-image]:!block [&_.ant-image]:!h-full [&_.ant-image]:!w-full">
                      <Image
                        src={item?.thumbnail_image || '/images/noImage1.svg'}
                        width="100%"
                        height="100%"
                        preview={false}
                        alt={`${item?.title}-alt`}
                        fallback="/images/noImage1.svg"
                        className="!h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.035]"
                      />
                    </figure>
                    <span className="text-[12.5px] text-ink-faint">{dayjs(item?.created_at).format('DD.MM.YYYY')}</span>
                    <h3 className="m-0 font-cormorant text-[24px] font-medium leading-[1.12] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {item?.title}
                    </h3>
                    <span className="justify-self-start border-b border-current text-[11.5px] font-semibold uppercase tracking-[0.12em]">
                      {item?.readMoreLink || 'Read more'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {educationCounts >= PAGE_LIMIT && (
              <div className="flex w-full justify-center pt-12">
                <ConfigProvider theme={plpTheme}>
                  <Pagination
                    current={educationPage}
                    pageSize={PAGE_LIMIT}
                    total={educationCounts}
                    onChange={(page) => dispatch(setEducationPage(page))}
                    showSizeChanger={false}
                  />
                </ConfigProvider>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
