import React from 'react';

import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const PRIMARY =
  'inline-flex h-12 items-center justify-center border border-ink bg-ink px-8 text-[11.5px] font-medium uppercase tracking-[0.2em] text-paper transition-colors hover:bg-ink-hover hover:text-paper';
const SECONDARY =
  'inline-flex h-12 items-center justify-center border border-ink bg-transparent px-8 text-[11.5px] font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper';

/** App-wide 404, rendered inside the root layout (header and footer stay in place). */
export default function NotFound() {
  return (
    <section className="border-b border-line bg-paper font-libre text-ink antialiased">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[760px] flex-col items-center justify-center px-[clamp(16px,3.2vw,56px)] py-[clamp(64px,9vw,120px)] text-center">
        <p className="m-0 mb-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Error 404</p>
        <h1 className="m-0 font-cormorant text-[clamp(40px,4.6vw,64px)] font-normal leading-none tracking-[-0.01em] text-ink">
          This page has <em className="italic text-gilt">moved on</em>
        </h1>
        <p className="m-0 mt-5 max-w-[46ch] text-[14px] leading-[1.65] text-ink-soft">
          The link may be out of date, or the piece you were looking for is no longer available. Let us take you somewhere lovely instead.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3 sm:w-full sm:flex-col">
          <Link href="/" className={PRIMARY}>
            Home
          </Link>
          <Link href="/all" className={SECONDARY}>
            Shop jewelry
          </Link>
        </div>
        <p className="m-0 mt-8 text-[12.5px] text-ink-soft">
          Need a hand?{' '}
          <Link href="/contactpage" className="text-ink underline underline-offset-4 hover:text-ink-hover">
            Contact client care
          </Link>
        </p>
      </div>
    </section>
  );
}
