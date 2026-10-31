/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';

import { Image } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBlogDetails, clearBlogDetails } from '@/store/slices/blog/blogSlice';

// Single Journal story, in the Journal's language (src/components/Journal/JournalPage.tsx): breadcrumb, serif title,
// lede, a wide cover on a stone tile and a readable column for the CMS body.

const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';
// Long-form typography for the CMS HTML (typography plugin, tuned to the design's type scale and palette).
const PROSE =
  'prose max-w-none text-[15.5px] leading-[1.75] text-ink/85 md:text-[15px] prose-headings:font-cormorant prose-headings:font-medium prose-headings:text-ink prose-h1:text-[38px] prose-h2:mb-[0.8rem] prose-h2:mt-[2.2rem] prose-h2:text-[32px] prose-h2:leading-[1.1] prose-h3:text-[24px] prose-p:text-ink/85 prose-a:text-teal prose-a:underline-offset-[3px] hover:prose-a:text-navy prose-strong:text-ink prose-li:marker:text-teal prose-blockquote:border-l-teal prose-blockquote:font-cormorant prose-blockquote:text-[22px] prose-blockquote:font-normal prose-blockquote:text-ink prose-img:rounded-none prose-hr:border-line';

export default function BlogDetails() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const blogSlug = params?.blogSlug;
  const { blogDetails, loading } = useAppSelector((state) => state.blog);
  const [blogData, setBlogData] = useState<any>(null);

  useEffect(() => {
    if (blogSlug) {
      // Clear the previous blog details before fetching a new one
      dispatch(clearBlogDetails());
      dispatch(fetchBlogDetails(blogSlug as string));
    }
  }, [blogSlug]);

  useEffect(() => {
    setBlogData(blogDetails);
  }, [blogDetails]);

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center" aria-busy="true">
          <LuLoader className="h-7 w-7 animate-spin text-ink-soft" />
        </div>
      ) : (
        <article className="pb-20">
          <header className={`${SHELL} grid justify-items-center gap-3.5 pb-[clamp(28px,4vw,48px)] pt-[clamp(32px,4vw,56px)] text-center`}>
            <nav aria-label="Breadcrumb" className="flex flex-wrap justify-center gap-2 text-[12px] text-ink-soft">
              <Link href="/" className="text-ink-soft hover:text-ink">
                Home
              </Link>
              <span aria-hidden className="text-line-strong">
                /
              </span>
              <Link href="/blog" className="text-ink-soft hover:text-ink">
                Journal
              </Link>
            </nav>
            <h1 className="m-0 max-w-[22ch] font-cormorant text-[clamp(36px,4.4vw,58px)] font-medium leading-[1.05] tracking-[-0.01em]">
              {blogData?.title}
            </h1>
            {blogData?.subtitle && <p className="m-0 max-w-[60ch] text-[16px] leading-[1.7] text-ink-soft sm:text-[15px]">{blogData?.subtitle}</p>}
            {blogData?.created_at && <span className="text-[12.5px] text-ink-faint">{dayjs(blogData.created_at).format('D MMM YYYY')}</span>}
          </header>

          <div className={SHELL}>
            <figure className="m-0 h-[clamp(300px,42vw,560px)] w-full overflow-hidden bg-stone [&_.ant-image]:!block [&_.ant-image]:!h-full [&_.ant-image]:!w-full">
              <Image
                src={blogData?.banner || '/images/noImage1.svg'}
                fallback="/images/noImage1.svg"
                alt={blogData?.title || 'Journal story'}
                preview={false}
                width="100%"
                height="100%"
                className="!h-full w-full object-cover"
              />
            </figure>
          </div>

          {blogData?.blog && (
            <div className="mx-auto w-full max-w-[760px] px-[clamp(16px,3.2vw,48px)] pt-[clamp(36px,5vw,64px)]">
              <div className={PROSE} dangerouslySetInnerHTML={{ __html: blogData?.blog }} />
            </div>
          )}
        </article>
      )}
    </div>
  );
}
